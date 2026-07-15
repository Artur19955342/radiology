import { randomUUID } from 'node:crypto'
import type {
  CreateReportFindingPayload,
  FindingKind,
  ReportFinding,
} from '../../src/types/findings.js'
import { getSql } from './db.js'

type FindingRow = {
  id: string
  title: string
  description: string
  conclusion: string
  kind: FindingKind
  createdAt: string
  updatedAt: string
}

const allowedKinds = new Set<FindingKind>(['finding', 'section_content'])

const normalizeRow = (row: FindingRow): ReportFinding => ({
  id: row.id,
  title: row.title,
  description: row.description,
  conclusion: row.conclusion,
  kind: row.kind,
  createdAt: new Date(row.createdAt).toISOString(),
  updatedAt: new Date(row.updatedAt).toISOString(),
})

const ensureFindingsTable = async () => {
  const sql = getSql()

  await sql`
    CREATE TABLE IF NOT EXISTS report_findings (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      conclusion TEXT NOT NULL DEFAULT '',
      kind TEXT NOT NULL CHECK (kind IN ('finding', 'section_content')),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `
}

export const validateFindingPayload = (payload: unknown): CreateReportFindingPayload => {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Данные находки заполнены некорректно.')
  }

  const candidate = payload as Partial<CreateReportFindingPayload>
  const title = typeof candidate.title === 'string' ? candidate.title.trim() : ''
  const description = typeof candidate.description === 'string' ? candidate.description.trim() : ''
  const conclusion = typeof candidate.conclusion === 'string' ? candidate.conclusion.trim() : ''
  const kind = candidate.kind

  if (!title) {
    throw new Error('Укажите название.')
  }

  if (!description) {
    throw new Error('Добавьте описание.')
  }

  if (!kind || !allowedKinds.has(kind)) {
    throw new Error('Выберите тип записи.')
  }

  return {
    title,
    description,
    conclusion,
    kind,
  }
}

export const listFindings = async () => {
  await ensureFindingsTable()

  const sql = getSql()
  const rows = await sql<FindingRow[]>`
    SELECT
      id,
      title,
      description,
      conclusion,
      kind,
      created_at::text AS "createdAt",
      updated_at::text AS "updatedAt"
    FROM report_findings
    ORDER BY updated_at DESC
  `

  return rows.map(normalizeRow)
}

export const insertFinding = async (payload: CreateReportFindingPayload) => {
  await ensureFindingsTable()

  const sql = getSql()
  const id = randomUUID()

  const [row] = await sql<FindingRow[]>`
    INSERT INTO report_findings (id, title, description, conclusion, kind)
    VALUES (${id}, ${payload.title}, ${payload.description}, ${payload.conclusion}, ${payload.kind})
    RETURNING
      id,
      title,
      description,
      conclusion,
      kind,
      created_at::text AS "createdAt",
      updated_at::text AS "updatedAt"
  `

  return normalizeRow(row)
}
