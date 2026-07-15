import type { CreateReportFindingPayload, FindingKind } from '../types/findings'

type FindingCapturePanelProps = {
  draft: CreateReportFindingPayload
  error: string
  isSaving: boolean
  onChange: (draft: CreateReportFindingPayload) => void
  onSave: () => void
}

const kindOptions: Array<{ label: string; value: FindingKind }> = [
  { label: 'Находка', value: 'finding' },
  { label: 'Содержимое раздела', value: 'section_content' },
]

function FindingCapturePanel({
  draft,
  error,
  isSaving,
  onChange,
  onSave,
}: FindingCapturePanelProps) {
  const updateDraft = (patch: Partial<CreateReportFindingPayload>) => {
    onChange({
      ...draft,
      ...patch,
    })
  }

  return (
    <section className="panel-group capture-panel" aria-label="Сохранение находки">
      <h3>Сохранить текст</h3>

      <label className="panel-field">
        <span>Название</span>
        <input
          value={draft.title}
          placeholder="Название находки"
          onChange={(event) => updateDraft({ title: event.target.value })}
        />
      </label>

      <label className="panel-field">
        <span>Описание</span>
        <textarea
          className="panel-textarea"
          value={draft.description}
          placeholder="Выделите текст в описании и нажмите Enter"
          onChange={(event) => updateDraft({ description: event.target.value })}
        />
      </label>

      <label className="panel-field">
        <span>Заключение</span>
        <textarea
          className="panel-textarea compact"
          value={draft.conclusion}
          placeholder="Выделите текст в заключении и нажмите Enter"
          onChange={(event) => updateDraft({ conclusion: event.target.value })}
        />
      </label>

      <div className="mode-toggle" role="radiogroup" aria-label="Тип записи">
        {kindOptions.map((option) => (
          <button
            type="button"
            className={draft.kind === option.value ? 'active-mode' : ''}
            key={option.value}
            onClick={() => updateDraft({ kind: option.value })}
          >
            {option.label}
          </button>
        ))}
      </div>

      {error && <p className="panel-alert">{error}</p>}

      <button type="button" className="primary-action" onClick={onSave} disabled={isSaving}>
        {isSaving ? 'Сохранение...' : 'Сохранить'}
      </button>
    </section>
  )
}

export default FindingCapturePanel
