import type {
  AdaptFindingRequest,
  AdaptFindingResponse,
  GenerateFindingRequest,
  GenerateFindingResponse,
} from '../types/ai'

type AdaptFindingApiResponse = {
  result: AdaptFindingResponse
}

type GenerateFindingApiResponse = {
  result: GenerateFindingResponse
}

const ADAPT_FINDING_ENDPOINT = '/api/ai/adapt-finding'
const GENERATE_FINDING_ENDPOINT = '/api/ai/generate-finding'
const AI_REQUEST_TIMEOUT_MS = 50000
const GENERATE_FINDING_TIMEOUT_MS = 65000

const getErrorMessage = async (response: Response, fallback: string) => {
  try {
    const data = (await response.json()) as { error?: string }
    return data.error || fallback
  } catch {
    return fallback
  }
}

export const adaptFindingWithAi = async (payload: AdaptFindingRequest) => {
  const controller = new AbortController()
  const timeoutId = window.setTimeout(() => controller.abort(), AI_REQUEST_TIMEOUT_MS)

  try {
    const response = await fetch(ADAPT_FINDING_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    })

    if (!response.ok) {
      throw new Error(await getErrorMessage(response, 'Не удалось адаптировать находку.'))
    }

    const data = (await response.json()) as AdaptFindingApiResponse
    return data.result
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('ИИ отвечает слишком долго. Вариант можно вставить без адаптации или повторить позже.')
    }

    throw error
  } finally {
    window.clearTimeout(timeoutId)
  }
}

export const generateFindingWithAi = async (payload: GenerateFindingRequest) => {
  const controller = new AbortController()
  const timeoutId = window.setTimeout(() => controller.abort(), GENERATE_FINDING_TIMEOUT_MS)

  try {
    const response = await fetch(GENERATE_FINDING_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    })

    if (!response.ok) {
      throw new Error(await getErrorMessage(response, 'Не удалось сформировать находку.'))
    }

    const data = (await response.json()) as GenerateFindingApiResponse
    return data.result
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('ИИ отвечает слишком долго. Уточните запрос или повторите позже.')
    }

    throw error
  } finally {
    window.clearTimeout(timeoutId)
  }
}
