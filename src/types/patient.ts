import type { PassportData } from './passport'
import type { DescriptionField } from './templates'

export type OpenPatientWorkspace = {
  id: string
  templateId: string
  templateTitle: string
  descriptionFields: DescriptionField[]
  description: Record<string, string>
  conclusion: string
  passportData: PassportData
}
