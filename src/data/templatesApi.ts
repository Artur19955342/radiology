import type { CreateReportTemplatePayload, ReportTemplate } from '../types/templates'

type TemplatesResponse = {
  templates: ReportTemplate[]
}

type TemplateResponse = {
  template: ReportTemplate
}

const TEMPLATES_ENDPOINT = '/api/templates'

const getErrorMessage = async (response: Response) => {
  try {
    const data = (await response.json()) as { error?: string }
    return data.error || 'Не удалось выполнить запрос к базе шаблонов.'
  } catch {
    return 'Не удалось выполнить запрос к базе шаблонов.'
  }
}

export const loadTemplates = async () => {
  const response = await fetch(TEMPLATES_ENDPOINT)

  if (!response.ok) {
    throw new Error(await getErrorMessage(response))
  }

  const data = (await response.json()) as TemplatesResponse
  return data.templates
}

export const createTemplate = async (payload: CreateReportTemplatePayload) => {
  const response = await fetch(TEMPLATES_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    throw new Error(await getErrorMessage(response))
  }

  const data = (await response.json()) as TemplateResponse
  return data.template
}
