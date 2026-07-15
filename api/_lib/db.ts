import postgres from 'postgres'

let sqlClient: ReturnType<typeof postgres> | null = null

const getDatabaseUrl = () => process.env.POSTGRES_URL || process.env.DATABASE_URL

export const getSql = () => {
  const databaseUrl = getDatabaseUrl()

  if (!databaseUrl) {
    throw new Error('Не задан POSTGRES_URL или DATABASE_URL для базы данных.')
  }

  sqlClient ??= postgres(databaseUrl, {
    max: 1,
  })

  return sqlClient
}
