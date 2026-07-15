import type { AdaptFindingRequest, AdaptFindingResponse } from '../types/ai'

type AdaptFindingApiResponse = {
  result: AdaptFindingResponse
}

const ADAPT_FINDING_ENDPOINT = '/api/ai/adapt-finding'
const AI_REQUEST_TIMEOUT_MS = 50000

const getErrorMessage = async (response: Response) => {
  try {
    const data = (await response.json()) as { error?: string }
    return data.error || 'Не удалось адаптировать находку.'
  } catch {
    return 'Не удалось адаптировать находку.'
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
      throw new Error(await getErrorMessage(response))
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
