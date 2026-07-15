export type AiFindingKind = 'finding' | 'section_content'

export type AdaptFindingRequest = {
  title: string
  kind: AiFindingKind
  description: string
  conclusion: string
  localization: string
}

export type AdaptFindingResponse = {
  title: string
  description: string
  conclusion: string
  source?: 'deepseek' | 'original'
  warning?: string
}

export type GenerateFindingSection = {
  id: string
  title: string
}

export type GenerateFindingRequest = {
  query: string
  sections: GenerateFindingSection[]
}

export type GenerateFindingReadyResponse = {
  status: 'ready'
  title: string
  description: string
  conclusion: string
  sectionId: string
  sectionTitle: string
  differential?: string[]
  source?: 'deepseek_pro'
}

export type GenerateFindingClarificationResponse = {
  status: 'needs_clarification'
  question: string
  suggestions?: string[]
  source?: 'deepseek_pro' | 'fallback'
}

export type GenerateFindingResponse =
  | GenerateFindingReadyResponse
  | GenerateFindingClarificationResponse
