import type { AdaptFindingRequest, AdaptFindingResponse } from '../../src/types/ai.js'

type TextParts = Pick<AdaptFindingRequest | AdaptFindingResponse, 'title' | 'description' | 'conclusion'>

const NUMBER_TOKEN_PATTERN = /\d+(?:[,.]\d+)?/g

export const extractNumberTokens = (text: string) => text.match(NUMBER_TOKEN_PATTERN) ?? []

export const extractFindingNumberTokens = (finding: TextParts) =>
  extractNumberTokens([finding.title, finding.description, finding.conclusion].join('\n'))

export const formatProtectedNumbersForPrompt = (payload: AdaptFindingRequest) => {
  const numbers = extractFindingNumberTokens(payload)

  if (numbers.length === 0) {
    return 'В исходном тексте нет числовых значений.'
  }

  return `Числа, которые запрещено менять, удалять или добавлять: ${numbers.join(', ')}.`
}

export const assertNumberIntegrity = (
  original: AdaptFindingRequest,
  candidate: AdaptFindingResponse,
) => {
  const originalNumbers = extractFindingNumberTokens(original)
  const candidateNumbers = extractFindingNumberTokens(candidate)

  if (originalNumbers.length !== candidateNumbers.length) {
    throw new Error(
      `ИИ изменил количество чисел. Было: ${originalNumbers.join(', ') || 'нет'}; стало: ${
        candidateNumbers.join(', ') || 'нет'
      }.`,
    )
  }

  const changedIndex = originalNumbers.findIndex((number, index) => number !== candidateNumbers[index])

  if (changedIndex !== -1) {
    throw new Error(
      `ИИ изменил число ${originalNumbers[changedIndex]} на ${candidateNumbers[changedIndex]}.`,
    )
  }
}
