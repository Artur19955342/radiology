/// <reference types="node" />

import type { AdaptFindingRequest, AdaptFindingResponse } from '../../src/types/ai.js'
import { buildDeepSeekAdaptMessages } from './deepseekPrompt.js'

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

const DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions'
const DEFAULT_DEEPSEEK_MODEL = 'deepseek-v4-flash'
const MAX_DEEPSEEK_ATTEMPTS = 3

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

const parseDeepSeekJson = (content: string): AdaptFindingResponse => {
  const parsed = JSON.parse(extractJsonContent(content)) as Partial<AdaptFindingResponse>

  return {
    title: requireString(parsed.title, 'title').trim(),
    description: requireString(parsed.description, 'description').trim(),
    conclusion: requireString(parsed.conclusion, 'conclusion').trim(),
  }
}

const buildDeepSeekRequestBody = (
  payload: AdaptFindingRequest,
  attempt: number,
  useJsonMode: boolean,
) => {
  const messages = buildDeepSeekAdaptMessages(payload)

  if (attempt > 0) {
    messages.push({
      role: 'user',
      content:
        'Предыдущий ответ был пустым или невалидным. Верни непустой json-объект строго в формате {"title":"...","description":"...","conclusion":"..."}. Без markdown, без пояснений.',
    })
  }

  return {
    model: process.env.DEEPSEEK_MODEL || DEFAULT_DEEPSEEK_MODEL,
    messages,
    ...(useJsonMode
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

const requestDeepSeek = async (
  apiKey: string,
  payload: AdaptFindingRequest,
  attempt: number,
  useJsonMode: boolean,
) => {
  const response = await fetch(DEEPSEEK_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(buildDeepSeekRequestBody(payload, attempt, useJsonMode)),
  })

  const data = (await response.json()) as DeepSeekChatResponse

  if (!response.ok) {
    throw new Error(data.error?.message || 'DeepSeek не смог обработать запрос.')
  }

  return data.choices?.[0]?.message?.content?.trim() || ''
}

export const adaptFindingWithDeepSeek = async (
  payload: AdaptFindingRequest,
): Promise<AdaptFindingResponse> => {
  if (!payload.localization) {
    throw new Error('Укажите локализацию для адаптации.')
  }

  const apiKey = process.env.DEEPSEEK_API_KEY

  if (!apiKey) {
    throw new Error('Не задан DEEPSEEK_API_KEY.')
  }

  let lastError = 'DeepSeek вернул пустой ответ.'

  for (let attempt = 0; attempt < MAX_DEEPSEEK_ATTEMPTS; attempt += 1) {
    const useJsonMode = attempt < MAX_DEEPSEEK_ATTEMPTS - 1
    const content = await requestDeepSeek(apiKey, payload, attempt, useJsonMode)

    if (!content) {
      lastError = 'DeepSeek вернул пустой ответ.'
      continue
    }

    try {
      return parseDeepSeekJson(content)
    } catch (error) {
      lastError = error instanceof Error ? error.message : 'DeepSeek вернул некорректный JSON.'
    }
  }

  throw new Error(lastError)
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
