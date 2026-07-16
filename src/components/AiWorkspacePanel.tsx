import type { GenerateFindingClarificationResponse, GenerateFindingSection } from '../types/ai'
import AiFindingDraftPanel, { type AiFindingDraft } from './AiFindingDraftPanel'

type AiWorkspacePanelProps = {
  draft: AiFindingDraft | null
  sections: GenerateFindingSection[]
  clarification: GenerateFindingClarificationResponse | null
  error: string
  isGenerating: boolean
  onDraftChange: (patch: Partial<AiFindingDraft>) => void
  onApply: () => void
  onClear: () => void
  onRetry: () => void
}

function AiWorkspacePanel({
  draft,
  sections,
  clarification,
  error,
  isGenerating,
  onDraftChange,
  onApply,
  onClear,
  onRetry,
}: AiWorkspacePanelProps) {
  return (
    <div className="panel-group ai-workspace-panel">
      <AiFindingDraftPanel
        draft={draft}
        sections={sections}
        clarification={clarification}
        error={error}
        isGenerating={isGenerating}
        onChange={onDraftChange}
        onApply={onApply}
        onClear={onClear}
        onRetry={onRetry}
      />
    </div>
  )
}

export default AiWorkspacePanel
