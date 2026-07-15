export type FindingKind = 'finding' | 'section_content'

export type ReportFinding = {
  id: string
  title: string
  description: string
  conclusion: string
  kind: FindingKind
  createdAt: string
  updatedAt: string
}

export type CreateReportFindingPayload = {
  title: string
  description: string
  conclusion: string
  kind: FindingKind
}
