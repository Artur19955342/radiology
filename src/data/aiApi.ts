import type { AdaptFindingRequest, AdaptFindingResponse } from '../types/ai'

type AdaptFindingApiResponse = {
  result: AdaptFindingResponse
}

const ADAPT_FINDING_ENDPOINT = '/api/ai/adapt-finding'

const getErrorMessage = async (response: Response) => {
  try {
    const data = (await response.json()) as { error?: string }
    return data.error || 'Не удалось адаптировать находку.'
  } catch {
    return 'Не удалось адаптировать находку.'
  }
}

export const adaptFindingWithAi = async (payload: AdaptFindingRequest) => {
  const response = await fetch(ADAPT_FINDING_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    throw new Error(await getErrorMessage(response))
  }

  const data = (await response.json()) as AdaptFindingApiResponse
  return data.result
}
