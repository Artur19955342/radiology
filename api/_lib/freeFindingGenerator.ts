/// <reference types="node" />

import type {
  GenerateFindingClarificationResponse,
  GenerateFindingReadyResponse,
  GenerateFindingRequest,
  GenerateFindingResponse,
  GenerateFindingSection,
} from '../../src/types/ai.js'
import { buildFreeFindingMessages, getFreeFindingRoutingHint } from './freeFindingPrompt.js'

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

type GenerateAttempt = {
  useJsonMode: boolean
}

const DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions'
const DEFAULT_PRO_MODEL = 'deepseek-v4-pro'
const DEFAULT_TIMEOUT_MS = 45000

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

const normalizeSections = (value: unknown): GenerateFindingSection[] => {
  if (!Array.isArray(value)) {
    throw new Error('Передайте список разделов протокола.')
  }

  const sections = value
    .map((item) => {
      if (!item || typeof item !== 'object') {
        return null
      }

      const candidate = item as Record<string, unknown>
      const id = typeof candidate.id === 'string' ? candidate.id.trim() : ''
      const title = typeof candidate.title === 'string' ? candidate.title.trim() : ''

      if (!id || !title) {
        return null
      }

      return { id, title }
    })
    .filter((section): section is GenerateFindingSection => Boolean(section))

  if (sections.length === 0) {
    throw new Error('В протоколе нет разделов, куда можно добавить находку.')
  }

  return sections
}

const validateGenerateFindingPayload = (payload: unknown): GenerateFindingRequest => {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Некорректные данные для свободного поиска.')
  }

  const candidate = payload as Record<string, unknown>
  const query = requireString(candidate.query, 'query').trim()

  if (query.length < 2) {
    throw new Error('Введите находку для поиска.')
  }

  return {
    query,
    sections: normalizeSections(candidate.sections),
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

const cleanStringArray = (value: unknown) =>
  Array.isArray(value)
    ? value
        .filter((item): item is string => typeof item === 'string')
        .map((item) => item.trim())
        .filter(Boolean)
    : undefined

const buildClarification = (
  question: string,
  suggestions?: string[],
): GenerateFindingClarificationResponse => ({
  status: 'needs_clarification',
  question,
  suggestions,
  source: 'deepseek_pro',
})

const buildGuidedFallback = (
  payload: GenerateFindingRequest,
): GenerateFindingReadyResponse | null => {
  const routingHint = getFreeFindingRoutingHint(payload)

  if (!routingHint) {
    return null
  }

  return {
    status: 'ready',
    sectionId: routingHint.sectionId,
    sectionTitle: routingHint.sectionTitle,
    title: 'Гиподенсивная область',
    description:
      'В веществе головного мозга определяется гиподенсивная область. Денситометрические характеристики и распространенность требуют сопоставления с клиническими данными и при необходимости уточнения по МРТ или КТ в динамике.',
    conclusion:
      'Гиподенсивная область головного мозга. Дифференциальный ряд: ишемические изменения, постишемические кистозно-глиозные изменения, воспалительные изменения, объемное образование.',
    differential: [
      'Ишемические изменения',
      'Постишемические кистозно-глиозные изменения',
      'Воспалительные изменения',
      'Объемное образование',
    ],
    source: 'fallback',
  }
}

const parseGeneratedFinding = (
  content: string,
  payload: GenerateFindingRequest,
): GenerateFindingResponse => {
  const parsed = JSON.parse(extractJsonContent(content)) as Record<string, unknown>

  if (parsed.status === 'needs_clarification') {
    return buildClarification(
      requireString(parsed.question, 'question').trim() || 'Уточните, к какому разделу относится находка.',
      cleanStringArray(parsed.suggestions),
    )
  }

  if (parsed.status !== 'ready') {
    throw new Error('DeepSeek вернул ответ без статуса.')
  }

  const sectionId = requireString(parsed.sectionId, 'sectionId').trim()
  const section = payload.sections.find((item) => item.id === sectionId)

  if (!section) {
    return buildClarification(
      'Уточните, в какой раздел добавить находку.',
      payload.sections.slice(0, 4).map((item) => item.title),
    )
  }

  const result: GenerateFindingReadyResponse = {
    status: 'ready',
    sectionId: section.id,
    sectionTitle: section.title,
    title: requireString(parsed.title, 'title').trim(),
    description: requireString(parsed.description, 'description').trim(),
    conclusion: requireString(parsed.conclusion, 'conclusion').trim(),
    differential: cleanStringArray(parsed.differential),
    source: 'deepseek_pro',
  }

  if (!result.title || !result.description || !result.conclusion) {
    throw new Error('DeepSeek вернул неполную находку.')
  }

  return result
}

const getRequestTimeoutMs = () => {
  const configuredTimeout = Number(process.env.DEEPSEEK_PRO_TIMEOUT_MS || process.env.DEEPSEEK_TIMEOUT_MS)

  if (Number.isFinite(configuredTimeout) && configuredTimeout >= 5000) {
    return configuredTimeout
  }

  return DEFAULT_TIMEOUT_MS
}

const getAttemptPlan = (): GenerateAttempt[] => [
  { useJsonMode: true },
  { useJsonMode: false },
]

const buildDeepSeekRequestBody = (
  payload: GenerateFindingRequest,
  attemptIndex: number,
  attempt: GenerateAttempt,
) => {
  const messages = buildFreeFindingMessages(payload)

  if (attemptIndex > 0) {
    messages.push({
      role: 'user',
      content: [
        'Предыдущий ответ был пустым или невалидным.',
        'Верни только непустой JSON по одной из схем: ready или needs_clarification.',
        'Не используй markdown.',
      ].join('\n'),
    })
  }

  return {
    model: process.env.DEEPSEEK_PRO_MODEL || DEFAULT_PRO_MODEL,
    messages,
    ...(attempt.useJsonMode
      ? {
          response_format: {
            type: 'json_object',
          },
        }
      : {}),
    max_tokens: 2200,
    temperature: 0.1,
    stream: false,
    thinking: {
      type: 'enabled',
    },
    reasoning_effort: 'high',
  }
}

const requestWithTimeout = async (
  apiKey: string,
  payload: GenerateFindingRequest,
  attemptIndex: number,
  attempt: GenerateAttempt,
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
      throw new Error(data.error?.message || 'DeepSeek Pro не смог обработать запрос.')
    }

    return data.choices?.[0]?.message?.content?.trim() || ''
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('DeepSeek Pro не ответил за отведенное время.')
    }

    throw error
  } finally {
    clearTimeout(timeoutId)
  }
}

export const generateFindingWithDeepSeekPro = async (
  payload: GenerateFindingRequest,
): Promise<GenerateFindingResponse> => {
  const apiKey = process.env.DEEPSEEK_PRO_API_KEY || process.env.DEEPSEEK_API_KEY

  if (!apiKey) {
    return {
      status: 'needs_clarification',
      question: 'Для свободного поиска нужен серверный ключ DEEPSEEK_PRO_API_KEY.',
      source: 'fallback',
    }
  }

  let lastError = 'DeepSeek Pro вернул пустой ответ.'

  for (const [attemptIndex, attempt] of getAttemptPlan().entries()) {
    try {
      const content = await requestWithTimeout(apiKey, payload, attemptIndex, attempt)

      if (!content) {
        lastError = 'DeepSeek Pro вернул пустой ответ.'
        continue
      }

      const result = parseGeneratedFinding(content, payload)

      if (result.status === 'needs_clarification' && getFreeFindingRoutingHint(payload)) {
        lastError = result.question
        continue
      }

      return result
    } catch (error) {
      lastError = error instanceof Error ? error.message : 'DeepSeek Pro вернул некорректный ответ.'
    }
  }

  console.warn('DeepSeek Pro free finding fallback:', lastError)
  const guidedFallback = buildGuidedFallback(payload)

  if (guidedFallback) {
    return guidedFallback
  }

  return {
    status: 'needs_clarification',
    question: 'ИИ не смог надежно разобрать находку. Уточните формулировку или раздел протокола.',
    suggestions: payload.sections.slice(0, 4).map((section) => section.title),
    source: 'fallback',
  }
}

export const handleGenerateFindingRequest = async (request: Request) => {
  try {
    if (request.method !== 'POST') {
      return json({ error: 'Метод не поддерживается.' }, 405)
    }

    const payload = validateGenerateFindingPayload(await request.json())
    const result = await generateFindingWithDeepSeekPro(payload)

    return json({ result })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Ошибка свободного поиска.'
    return json({ error: message }, 500)
  }
}
