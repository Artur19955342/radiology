export type DataBackend = 'local' | 'api'

export const dataBackend: DataBackend =
  import.meta.env.VITE_DATA_BACKEND === 'api' ? 'api' : 'local'
