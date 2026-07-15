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

const parseDeepSeekJson = (content: string): AdaptFindingResponse => {
  const parsed = JSON.parse(content) as Partial<AdaptFindingResponse>

  return {
    title: requireString(parsed.title, 'title').trim(),
    description: requireString(parsed.description, 'description').trim(),
    conclusion: requireString(parsed.conclusion, 'conclusion').trim(),
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
    throw new Error('Не задан DEEPSEEK_API_KEY.')
  }

  const response = await fetch(DEEPSEEK_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: process.env.DEEPSEEK_MODEL || DEFAULT_DEEPSEEK_MODEL,
      messages: buildDeepSeekAdaptMessages(payload),
      response_format: {
        type: 'json_object',
      },
      max_tokens: 900,
      temperature: 0.2,
      stream: false,
    }),
  })

  const data = (await response.json()) as DeepSeekChatResponse

  if (!response.ok) {
    throw new Error(data.error?.message || 'DeepSeek не смог обработать запрос.')
  }

  const content = data.choices?.[0]?.message?.content

  if (!content) {
    throw new Error('DeepSeek вернул пустой ответ.')
  }

  return parseDeepSeekJson(content)
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
