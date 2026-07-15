const unavailableStorageError = 'Локальная база недоступна в этом браузере.'

export const createLocalId = () => {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID()
  }

  return `local-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

const getStorage = () => {
  if (typeof window === 'undefined' || !window.localStorage) {
    throw new Error(unavailableStorageError)
  }

  return window.localStorage
}

export const readLocalCollection = <T>(key: string): T[] => {
  const rawValue = getStorage().getItem(key)

  if (!rawValue) {
    return []
  }

  try {
    const parsed = JSON.parse(rawValue)
    return Array.isArray(parsed) ? (parsed as T[]) : []
  } catch {
    return []
  }
}

export const writeLocalCollection = <T>(key: string, records: T[]) => {
  getStorage().setItem(key, JSON.stringify(records))
}
