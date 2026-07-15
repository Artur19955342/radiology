export const getTextareaSelection = (textarea: HTMLTextAreaElement) => {
  const start = textarea.selectionStart
  const end = textarea.selectionEnd

  if (start === end) {
    return ''
  }

  return textarea.value.slice(start, end).trim()
}

const normalizeInlineText = (value: string) =>
  value
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()

export const appendTextBlock = (current: string, next: string) => {
  const trimmedCurrent = normalizeInlineText(current)
  const trimmedNext = normalizeInlineText(next)

  if (!trimmedNext) {
    return current
  }

  if (!trimmedCurrent) {
    return trimmedNext
  }

  return `${trimmedCurrent} ${trimmedNext}`
}

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

export const removeTextBlock = (current: string, block: string) => {
  const normalizedCurrent = normalizeInlineText(current)
  const normalizedBlock = normalizeInlineText(block)

  if (!normalizedCurrent || !normalizedBlock) {
    return current
  }

  if (normalizedCurrent === normalizedBlock) {
    return ''
  }

  const blockPattern = new RegExp(`(^|\\s)${escapeRegExp(normalizedBlock)}(?=\\s|$)`, 'g')

  return normalizedCurrent.replace(blockPattern, '$1').replace(/\s+/g, ' ').trim()
}
