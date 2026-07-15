/// <reference types="node" />

import type { AdaptFindingRequest, AdaptFindingResponse } from '../../src/types/ai.js'
import { buildDeepSeekAdaptMessages } from './deepseekPrompt.js'
import { assertNumberIntegrity, formatProtectedNumbersForPrompt } from './numberIntegrity.js'

type DeepSeekChatResponse = {
  choices?: Array<{
    message?: {
      content?: string
    }
  }>
  error?: {
    message?: string
  }
}

type DeepSeekAttempt = {
  model: string
  useJsonMode: boolean
}

const DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions'
const DEFAULT_DEEPSEEK_MODEL = 'deepseek-v4-flash'
const FALLBACK_DEEPSEEK_MODEL = 'deepseek-v4-pro'
const DEFAULT_DEEPSEEK_TIMEOUT_MS = 14000

const json = (body: unknown, status = 200) =>
  Response.json(body, {
    status,
    headers: {
      'Cache-Control': 'no-store',
    },
  })

const requireString = (value: unknown, field: string) => {
  if (typeof value !== 'string') {
    throw new Error(`Поле ${field} должно быть строкой.`)
  }

  return value
}

const validateAdaptFindingPayload = (payload: unknown): AdaptFindingRequest => {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Некорректные данные для адаптации находки.')
  }

  const candidate = payload as Record<string, unknown>
  const kind = requireString(candidate.kind, 'kind')

  if (kind !== 'finding' && kind !== 'section_content') {
    throw new Error('Некорректный тип находки.')
  }

  return {
    title: requireString(candidate.title, 'title').trim(),
    kind,
    description: requireString(candidate.description, 'description').trim(),
    conclusion: requireString(candidate.conclusion, 'conclusion').trim(),
    localization: requireString(candidate.localization, 'localization').trim(),
  }
}

const extractJsonContent = (content: string) => {
  const trimmed = content.trim().replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '')
  const start = trimmed.indexOf('{')
  const end = trimmed.lastIndexOf('}')

  if (start >= 0 && end > start) {
    return trimmed.slice(start, end + 1)
  }

  return trimmed
}

const parseDeepSeekJson = (
  content: string,
  payload: AdaptFindingRequest,
): AdaptFindingResponse => {
  const parsed = JSON.parse(extractJsonContent(content)) as Partial<AdaptFindingResponse>
  const candidate = {
    title: requireString(parsed.title, 'title').trim(),
    description: requireString(parsed.description, 'description').trim(),
    conclusion: requireString(parsed.conclusion, 'conclusion').trim(),
    source: 'deepseek',
  } satisfies AdaptFindingResponse

  assertNumberIntegrity(payload, candidate)

  return candidate
}

const getRequestTimeoutMs = () => {
  const configuredTimeout = Number(process.env.DEEPSEEK_TIMEOUT_MS)

  if (Number.isFinite(configuredTimeout) && configuredTimeout >= 3000) {
    return configuredTimeout
  }

  return DEFAULT_DEEPSEEK_TIMEOUT_MS
}

const getAttemptPlan = (): DeepSeekAttempt[] => {
  const primaryModel = process.env.DEEPSEEK_MODEL || DEFAULT_DEEPSEEK_MODEL
  const fallbackModel = primaryModel === FALLBACK_DEEPSEEK_MODEL ? DEFAULT_DEEPSEEK_MODEL : FALLBACK_DEEPSEEK_MODEL

  return [
    { model: primaryModel, useJsonMode: true },
    { model: primaryModel, useJsonMode: false },
    { model: fallbackModel, useJsonMode: false },
  ]
}

const buildOriginalFallback = (payload: AdaptFindingRequest): AdaptFindingResponse => ({
  title: payload.title,
  description: payload.description,
  conclusion: payload.conclusion,
  source: 'original',
  warning:
    'ИИ не смог адаптировать текст без гарантии сохранения чисел. Оставлен исходный вариант; можно повторить позже.',
})

const buildDeepSeekRequestBody = (
  payload: AdaptFindingRequest,
  attemptIndex: number,
  attempt: DeepSeekAttempt,
) => {
  const messages = buildDeepSeekAdaptMessages(payload)

  if (attemptIndex > 0) {
    messages.push({
      role: 'user',
      content: [
        'Предыдущий ответ был пустым, невалидным или изменил числа.',
        'Повтори адаптацию, меняя только локализацию и грамматическое согласование вокруг нее.',
        formatProtectedNumbersForPrompt(payload),
        'Верни непустой json-объект строго в формате {"title":"...","description":"...","conclusion":"..."}.',
        'Без markdown, без пояснений.',
      ].join('\n'),
    })
  }

  return {
    model: attempt.model,
    messages,
    ...(attempt.useJsonMode
      ? {
          response_format: {
            type: 'json_object',
          },
        }
      : {}),
    max_tokens: 1200,
    temperature: 0,
    stream: false,
  }
}

const requestWithTimeout = async (
  apiKey: string,
  payload: AdaptFindingRequest,
  attemptIndex: number,
  attempt: DeepSeekAttempt,
) => {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), getRequestTimeoutMs())

  try {
    const response = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(buildDeepSeekRequestBody(payload, attemptIndex, attempt)),
      signal: controller.signal,
    })

    const data = (await response.json()) as DeepSeekChatResponse

    if (!response.ok) {
      throw new Error(data.error?.message || 'DeepSeek не смог обработать запрос.')
    }

    return data.choices?.[0]?.message?.content?.trim() || ''
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('DeepSeek не ответил за отведенное время.')
    }

    throw error
  } finally {
    clearTimeout(timeoutId)
  }
}

export const adaptFindingWithDeepSeek = async (
  payload: AdaptFindingRequest,
): Promise<AdaptFindingResponse> => {
  if (!payload.localization) {
    throw new Error('Укажите локализацию для адаптации.')
  }

  const apiKey = process.env.DEEPSEEK_API_KEY

  if (!apiKey) {
    return buildOriginalFallback(payload)
  }

  let lastError = 'DeepSeek вернул пустой ответ.'

  for (const [attemptIndex, attempt] of getAttemptPlan().entries()) {
    try {
      const content = await requestWithTimeout(apiKey, payload, attemptIndex, attempt)

      if (!content) {
        lastError = 'DeepSeek вернул пустой ответ.'
        continue
      }

      return parseDeepSeekJson(content, payload)
    } catch (error) {
      lastError = error instanceof Error ? error.message : 'DeepSeek вернул некорректный ответ.'
    }
  }

  console.warn('DeepSeek adaptation fallback:', lastError)
  return buildOriginalFallback(payload)
}

export const handleDeepSeekAdaptRequest = async (request: Request) => {
  try {
    if (request.method !== 'POST') {
      return json({ error: 'Метод не поддерживается.' }, 405)
    }

    const payload = validateAdaptFindingPayload(await request.json())
    const result = await adaptFindingWithDeepSeek(payload)

    return json({ result })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Ошибка адаптации находки.'
    return json({ error: message }, 500)
  }
}
