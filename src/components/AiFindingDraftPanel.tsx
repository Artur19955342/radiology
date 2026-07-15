import type { GenerateFindingClarificationResponse, GenerateFindingSection } from '../types/ai'

export type AiFindingDraft = {
  title: string
  sectionId: string
  description: string
  conclusion: string
  differential: string[]
}

type AiFindingDraftPanelProps = {
  draft: AiFindingDraft | null
  sections: GenerateFindingSection[]
  clarification: GenerateFindingClarificationResponse | null
  error: string
  isGenerating: boolean
  onChange: (patch: Partial<AiFindingDraft>) => void
  onApply: () => void
  onClear: () => void
  onRetry: () => void
}

function AiFindingDraftPanel({
  draft,
  sections,
  clarification,
  error,
  isGenerating,
  onChange,
  onApply,
  onClear,
  onRetry,
}: AiFindingDraftPanelProps) {
  if (!draft && !clarification && !error && !isGenerating) {
    return null
  }

  const canApply = Boolean(
    draft?.sectionId && (draft.description.trim() || draft.conclusion.trim()),
  )

  return (
    <section className="panel-group ai-draft-panel" aria-label="AI предложение">
      <header className="ai-draft-header">
        <div>
          <p className="section-kicker">DeepSeek Pro</p>
          <h3>Предложение</h3>
        </div>
        {draft && (
          <button className="secondary-action" type="button" onClick={onClear}>
            Сбросить
          </button>
        )}
      </header>

      {isGenerating && <p className="panel-muted">Формирую описание и заключение...</p>}
      {error && <p className="panel-alert">{error}</p>}
      {clarification && (
        <div className="ai-clarification">
          <strong>Нужно уточнить</strong>
          <p>{clarification.question}</p>
          {clarification.suggestions && clarification.suggestions.length > 0 && (
            <div className="suggestion-list" aria-label="Варианты уточнения">
              {clarification.suggestions.map((suggestion) => (
                <span className="suggestion-chip" key={suggestion}>
                  {suggestion}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {draft && (
        <>
          <label className="panel-field">
            <span>Раздел</span>
            <select
              value={draft.sectionId}
              onChange={(event) => onChange({ sectionId: event.target.value })}
            >
              {sections.map((section) => (
                <option key={section.id} value={section.id}>
                  {section.title}
                </option>
              ))}
            </select>
          </label>

          <label className="panel-field">
            <span>Название</span>
            <input
              value={draft.title}
              placeholder="Название находки"
              onChange={(event) => onChange({ title: event.target.value })}
            />
          </label>

          <label className="panel-field">
            <span>Описание</span>
            <textarea
              className="panel-textarea ai-panel-textarea"
              value={draft.description}
              placeholder="Описание можно отредактировать перед добавлением"
              onChange={(event) => onChange({ description: event.target.value })}
            />
          </label>

          <label className="panel-field">
            <span>Заключение</span>
            <textarea
              className="panel-textarea compact ai-panel-textarea"
              value={draft.conclusion}
              placeholder="Заключение можно отредактировать перед добавлением"
              onChange={(event) => onChange({ conclusion: event.target.value })}
            />
          </label>

          {draft.differential.length > 0 && (
            <div className="differential-list" aria-label="Дифференциальный ряд">
              {draft.differential.map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>
          )}

          <div className="ai-draft-actions">
            <button type="button" className="primary-action" onClick={onApply} disabled={!canApply}>
              Добавить в протокол
            </button>
            <button type="button" onClick={onRetry} disabled={isGenerating}>
              Повторить
            </button>
          </div>
        </>
      )}
    </section>
  )
}

export default AiFindingDraftPanel
