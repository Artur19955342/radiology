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
}
