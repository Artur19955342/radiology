import type { CreateReportTemplatePayload } from '../types/templates'
import { createTemplate as createApiTemplate, loadTemplates as loadApiTemplates } from './templatesApi'
import { dataBackend } from './dataBackend'
import { createLocalTemplate, loadLocalTemplates } from './templatesLocalDb'

export const loadTemplates = () =>
  dataBackend === 'api' ? loadApiTemplates() : loadLocalTemplates()

export const createTemplate = (payload: CreateReportTemplatePayload) =>
  dataBackend === 'api' ? createApiTemplate(payload) : createLocalTemplate(payload)
