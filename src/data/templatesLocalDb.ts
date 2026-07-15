import type {
  CreateReportTemplatePayload,
  ReportTemplate,
  TemplateSection,
} from '../types/templates'
import { createLocalId, readLocalCollection, writeLocalCollection } from './localBrowserDb'

const TEMPLATES_LOCAL_KEY = 'radiology.reportTemplates.v1'

const sortByUpdatedAt = (templates: ReportTemplate[]) =>
  [...templates].sort(
    (left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime(),
  )

export const loadLocalTemplates = async () => {
  return sortByUpdatedAt(readLocalCollection<ReportTemplate>(TEMPLATES_LOCAL_KEY))
}

export const createLocalTemplate = async (payload: CreateReportTemplatePayload) => {
  const title = payload.title.trim()
  const sections = payload.sections
    .map((section, index): TemplateSection => ({
      id: createLocalId(),
      order: index + 1,
      title: section.title.trim() || `Раздел ${index + 1}`,
      text: section.text.trim(),
    }))
    .filter((section) => section.text)

  if (!title) {
    throw new Error('Укажите название шаблона.')
  }

  if (sections.length === 0) {
    throw new Error('Добавьте хотя бы один раздел описания.')
  }

  const now = new Date().toISOString()
  const template: ReportTemplate = {
    id: createLocalId(),
    title,
    sections,
    conclusion: payload.conclusion.trim(),
    createdAt: now,
    updatedAt: now,
  }

  const templates = readLocalCollection<ReportTemplate>(TEMPLATES_LOCAL_KEY)
  writeLocalCollection(TEMPLATES_LOCAL_KEY, sortByUpdatedAt([template, ...templates]))

  return template
}
