export type DescriptionField = {
  id: string
  title: string
  placeholder: string
}

export type TemplateSection = {
  id: string
  order: number
  title: string
  text: string
}

export type NewTemplateSection = {
  order: number
  title: string
  text: string
}

export type ReportTemplate = {
  id: string
  title: string
  sections: TemplateSection[]
  conclusion: string
  createdAt: string
  updatedAt: string
}

export type CreateReportTemplatePayload = {
  title: string
  sections: NewTemplateSection[]
  conclusion: string
}
