import type { CreateReportFindingPayload, FindingKind, ReportFinding } from '../types/findings'
import { createLocalId, readLocalCollection, writeLocalCollection } from './localBrowserDb'

const FINDINGS_LOCAL_KEY = 'radiology.reportFindings.v1'
const allowedKinds = new Set<FindingKind>(['finding', 'section_content'])

const sortByUpdatedAt = (findings: ReportFinding[]) =>
  [...findings].sort(
    (left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime(),
  )

export const loadLocalFindings = async () => {
  return sortByUpdatedAt(readLocalCollection<ReportFinding>(FINDINGS_LOCAL_KEY))
}

export const createLocalFinding = async (payload: CreateReportFindingPayload) => {
  const title = payload.title.trim()
  const description = payload.description.trim()
  const conclusion = payload.conclusion.trim()

  if (!title) {
    throw new Error('Укажите название.')
  }

  if (!description) {
    throw new Error('Добавьте описание.')
  }

  if (!allowedKinds.has(payload.kind)) {
    throw new Error('Выберите тип записи.')
  }

  const now = new Date().toISOString()
  const finding: ReportFinding = {
    id: createLocalId(),
    title,
    description,
    conclusion,
    kind: payload.kind,
    createdAt: now,
    updatedAt: now,
  }

  const findings = readLocalCollection<ReportFinding>(FINDINGS_LOCAL_KEY)
  writeLocalCollection(FINDINGS_LOCAL_KEY, sortByUpdatedAt([finding, ...findings]))

  return finding
}
