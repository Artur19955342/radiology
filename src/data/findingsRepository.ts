import type { CreateReportFindingPayload } from '../types/findings'
import { createFinding as createApiFinding, loadFindings as loadApiFindings } from './findingsApi'
import { dataBackend } from './dataBackend'
import { createLocalFinding, loadLocalFindings } from './findingsLocalDb'

export const loadFindings = () =>
  dataBackend === 'api' ? loadApiFindings() : loadLocalFindings()

export const createFinding = (payload: CreateReportFindingPayload) =>
  dataBackend === 'api' ? createApiFinding(payload) : createLocalFinding(payload)
