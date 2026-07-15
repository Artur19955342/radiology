export type FindingTextTarget = 'description' | 'conclusion'

export type NumberParameter = {
  id: string
  target: FindingTextTarget
  order: number
  value: string
  start: number
  end: number
}

const standaloneNumberPattern = /(?<![\p{L}\p{N}])\d+(?:[,.]\d+)?(?![\p{L}\p{N}])/gu

export const findNumberParameters = (text: string, target: FindingTextTarget) =>
  [...text.matchAll(standaloneNumberPattern)].map<NumberParameter>((match, index) => {
    const value = match[0]
    const start = match.index ?? 0

    return {
      id: `${target}-${index}`,
      target,
      order: index + 1,
      value,
      start,
      end: start + value.length,
    }
  })

export const applyNumberParameters = (
  text: string,
  parameters: NumberParameter[],
  values: Record<string, string>,
) =>
  [...parameters]
    .sort((left, right) => right.start - left.start)
    .reduce((currentText, parameter) => {
      const nextValue = values[parameter.id] ?? parameter.value
      return `${currentText.slice(0, parameter.start)}${nextValue}${currentText.slice(parameter.end)}`
    }, text)
