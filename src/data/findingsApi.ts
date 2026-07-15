import type { CreateReportFindingPayload, ReportFinding } from '../types/findings'

type FindingsResponse = {
  findings: ReportFinding[]
}

type FindingResponse = {
  finding: ReportFinding
}

const FINDINGS_ENDPOINT = '/api/findings'

const getErrorMessage = async (response: Response) => {
  try {
    const data = (await response.json()) as { error?: string }
    return data.error || 'Не удалось выполнить запрос к базе находок.'
  } catch {
    return 'Не удалось выполнить запрос к базе находок.'
  }
}

export const loadFindings = async () => {
  const response = await fetch(FINDINGS_ENDPOINT)

  if (!response.ok) {
    throw new Error(await getErrorMessage(response))
  }

  const data = (await response.json()) as FindingsResponse
  return data.findings
}

export const createFinding = async (payload: CreateReportFindingPayload) => {
  const response = await fetch(FINDINGS_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    throw new Error(await getErrorMessage(response))
  }

  const data = (await response.json()) as FindingResponse
  return data.finding
}
