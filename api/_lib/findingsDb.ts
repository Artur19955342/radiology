/// <reference types="node" />

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
  sectionId: string | null
  sectionTitle: string | null
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
  ...(row.sectionId ? { sectionId: row.sectionId } : {}),
  ...(row.sectionTitle ? { sectionTitle: row.sectionTitle } : {}),
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
      section_id TEXT,
      section_title TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `

  await sql`ALTER TABLE report_findings ADD COLUMN IF NOT EXISTS section_id TEXT`
  await sql`ALTER TABLE report_findings ADD COLUMN IF NOT EXISTS section_title TEXT`
}

export const validateFindingPayload = (payload: unknown): CreateReportFindingPayload => {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Данные находки заполнены некорректно.')
  }

  const candidate = payload as Partial<CreateReportFindingPayload>
  const title = typeof candidate.title === 'string' ? candidate.title.trim() : ''
  const description = typeof candidate.description === 'string' ? candidate.description.trim() : ''
  const conclusion = typeof candidate.conclusion === 'string' ? candidate.conclusion.trim() : ''
  const sectionId = typeof candidate.sectionId === 'string' ? candidate.sectionId.trim() : ''
  const sectionTitle =
    typeof candidate.sectionTitle === 'string' ? candidate.sectionTitle.trim() : ''
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

  if (kind === 'section_content' && !sectionId) {
    throw new Error('Для содержимого раздела нужна привязка к разделу.')
  }

  return {
    title,
    description,
    conclusion,
    kind,
    ...(kind === 'section_content' ? { sectionId, sectionTitle } : {}),
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
      section_id AS "sectionId",
      section_title AS "sectionTitle",
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
  const sectionId = payload.sectionId ?? null
  const sectionTitle = payload.sectionTitle ?? null

  const [row] = await sql<FindingRow[]>`
    INSERT INTO report_findings (id, title, description, conclusion, kind, section_id, section_title)
    VALUES (${id}, ${payload.title}, ${payload.description}, ${payload.conclusion}, ${payload.kind}, ${sectionId}, ${sectionTitle})
    RETURNING
      id,
      title,
      description,
      conclusion,
      kind,
      section_id AS "sectionId",
      section_title AS "sectionTitle",
      created_at::text AS "createdAt",
      updated_at::text AS "updatedAt"
  `

  return normalizeRow(row)
}
