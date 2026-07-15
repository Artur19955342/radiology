import type { ReportTemplate } from '../types/templates'

type TemplatePickerModalProps = {
  open: boolean
  templates: ReportTemplate[]
  isLoading: boolean
  error: string
  onClose: () => void
  onSelect: (template: ReportTemplate) => void
}

function TemplatePickerModal({
  open,
  templates,
  isLoading,
  error,
  onClose,
  onSelect,
}: TemplatePickerModalProps) {
  if (!open) {
    return null
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <section
        className="template-modal template-picker-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="template-picker-title"
      >
        <header className="modal-header">
          <div>
            <p className="section-kicker">Шаблоны</p>
            <h2 id="template-picker-title">Выбрать шаблон</h2>
          </div>
          <button type="button" className="icon-button" aria-label="Закрыть" onClick={onClose}>
            x
          </button>
        </header>

        <div className="modal-body">
          {isLoading && <p className="panel-muted">Загрузка шаблонов...</p>}
          {error && <p className="panel-alert">{error}</p>}
          {!isLoading && !error && templates.length === 0 && (
            <p className="panel-muted">Пока нет сохраненных шаблонов.</p>
          )}
          {templates.length > 0 && (
            <div className="template-picker-list">
              {templates.map((template) => (
                <button
                  type="button"
                  className="template-picker-button"
                  key={template.id}
                  onClick={() => onSelect(template)}
                >
                  <span>{template.title}</span>
                  <small>{template.sections.length} раздела</small>
                </button>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

export default TemplatePickerModal
