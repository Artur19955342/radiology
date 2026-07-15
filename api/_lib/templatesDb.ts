import { randomUUID } from 'node:crypto'
import type {
  CreateReportTemplatePayload,
  NewTemplateSection,
  ReportTemplate,
  TemplateSection,
} from '../../src/types/templates.js'
import { getSql } from './db.js'

type TemplateRow = {
  id: string
  title: string
  sections: TemplateSection[] | string
  conclusion: string
  createdAt: string
  updatedAt: string
}

const parseSections = (sections: TemplateRow['sections']) => {
  if (typeof sections === 'string') {
    return JSON.parse(sections) as TemplateSection[]
  }

  return sections
}

const normalizeRow = (row: TemplateRow): ReportTemplate => ({
  id: row.id,
  title: row.title,
  sections: parseSections(row.sections).sort((left, right) => left.order - right.order),
  conclusion: row.conclusion,
  createdAt: new Date(row.createdAt).toISOString(),
  updatedAt: new Date(row.updatedAt).toISOString(),
})

const ensureTemplatesTable = async () => {
  const sql = getSql()

  await sql`
    CREATE TABLE IF NOT EXISTS report_templates (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      sections JSONB NOT NULL DEFAULT '[]'::jsonb,
      conclusion TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `
}

const validateSection = (section: unknown, index: number): NewTemplateSection => {
  if (!section || typeof section !== 'object') {
    throw new Error(`Раздел ${index + 1} заполнен некорректно.`)
  }

  const candidate = section as Partial<NewTemplateSection>
  const text = typeof candidate.text === 'string' ? candidate.text.trim() : ''
  const title = typeof candidate.title === 'string' ? candidate.title.trim() : ''

  if (!text) {
    throw new Error(`Раздел ${index + 1} должен содержать текст.`)
  }

  return {
    order: index + 1,
    title: title || `Раздел ${index + 1}`,
    text,
  }
}

export const validateTemplatePayload = (payload: unknown): CreateReportTemplatePayload => {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Данные шаблона заполнены некорректно.')
  }

  const candidate = payload as Partial<CreateReportTemplatePayload>
  const title = typeof candidate.title === 'string' ? candidate.title.trim() : ''
  const conclusion = typeof candidate.conclusion === 'string' ? candidate.conclusion.trim() : ''

  if (!title) {
    throw new Error('Укажите название шаблона.')
  }

  if (!Array.isArray(candidate.sections) || candidate.sections.length === 0) {
    throw new Error('Добавьте хотя бы один раздел описания.')
  }

  return {
    title,
    conclusion,
    sections: candidate.sections.map(validateSection),
  }
}

export const listTemplates = async () => {
  await ensureTemplatesTable()

  const sql = getSql()
  const rows = await sql<TemplateRow[]>`
    SELECT
      id,
      title,
      sections,
      conclusion,
      created_at::text AS "createdAt",
      updated_at::text AS "updatedAt"
    FROM report_templates
    ORDER BY updated_at DESC
  `

  return rows.map(normalizeRow)
}

export const insertTemplate = async (payload: CreateReportTemplatePayload) => {
  await ensureTemplatesTable()

  const sql = getSql()
  const id = randomUUID()
  const sections: TemplateSection[] = payload.sections.map((section, index) => ({
    id: randomUUID(),
    order: index + 1,
    title: section.title,
    text: section.text,
  }))

  const [row] = await sql<TemplateRow[]>`
    INSERT INTO report_templates (id, title, sections, conclusion)
    VALUES (${id}, ${payload.title}, ${sql.json(sections)}, ${payload.conclusion})
    RETURNING
      id,
      title,
      sections,
      conclusion,
      created_at::text AS "createdAt",
      updated_at::text AS "updatedAt"
  `

  return normalizeRow(row)
}
