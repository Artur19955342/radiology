import type { ReportTemplate } from '../types/templates'

type StartScreenProps = {
  templates: ReportTemplate[]
  isLoading: boolean
  error: string
  onSelectTemplate: (template: ReportTemplate) => void
  onCreateTemplate: () => void
}

const getSectionLabel = (count: number) => {
  if (count === 1) {
    return '1 раздел'
  }

  if (count > 1 && count < 5) {
    return `${count} раздела`
  }

  return `${count} разделов`
}

function StartScreen({
  templates,
  isLoading,
  error,
  onSelectTemplate,
  onCreateTemplate,
}: StartScreenProps) {
  return (
    <main className="start-screen" aria-label="Выбор шаблона">
      <section className="start-shell">
        <header className="start-header">
          <div>
            <p className="section-kicker">Шаблоны</p>
            <h1>Выберите шаблон</h1>
          </div>
        </header>

        {isLoading && <p className="panel-muted">Загрузка шаблонов...</p>}
        {error && <p className="panel-alert">{error}</p>}

        <div className="template-tile-grid">
          <button
            type="button"
            className="template-tile create-template-tile"
            onClick={onCreateTemplate}
          >
            <span className="create-template-icon">+</span>
            <strong>Создать шаблон</strong>
          </button>

          {templates.map((template) => (
            <button
              type="button"
              className="template-tile"
              key={template.id}
              onClick={() => onSelectTemplate(template)}
            >
              <strong>{template.title}</strong>
              <span>{getSectionLabel(template.sections.length)}</span>
              {template.conclusion && <small>{template.conclusion}</small>}
            </button>
          ))}
        </div>
      </section>
    </main>
  )
}

export default StartScreen
