import { useMemo, useState } from 'react'
import type { CreateReportTemplatePayload } from '../types/templates'

type TemplateModalProps = {
  open: boolean
  onClose: () => void
  onCreate: (payload: CreateReportTemplatePayload) => Promise<void>
}

type ParsedLine = {
  order: number
  text: string
}

const parseDescriptionLines = (description: string): ParsedLine[] =>
  description
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((text, index) => ({
      order: index + 1,
      text,
    }))

function TemplateModal({ open, onClose, onCreate }: TemplateModalProps) {
  const [step, setStep] = useState(1)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [conclusion, setConclusion] = useState('')
  const [sectionTitles, setSectionTitles] = useState<Record<number, string>>({})
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const parsedLines = useMemo(() => parseDescriptionLines(description), [description])

  if (!open) {
    return null
  }

  const resetAndClose = () => {
    setStep(1)
    setTitle('')
    setDescription('')
    setConclusion('')
    setSectionTitles({})
    setError('')
    setIsSaving(false)
    onClose()
  }

  const goToSectionNames = () => {
    const templateTitle = title.trim()

    if (!templateTitle) {
      setError('Укажите название шаблона.')
      return
    }

    if (parsedLines.length === 0) {
      setError('Добавьте описание: каждая строка станет отдельным разделом.')
      return
    }

    setError('')
    setSectionTitles((current) => {
      const nextTitles: Record<number, string> = {}

      parsedLines.forEach((line) => {
        nextTitles[line.order] = current[line.order] || `Раздел ${line.order}`
      })

      return nextTitles
    })
    setStep(2)
  }

  const saveTemplate = async () => {
    const payload: CreateReportTemplatePayload = {
      title: title.trim(),
      conclusion: conclusion.trim(),
      sections: parsedLines.map((line) => ({
        order: line.order,
        title: sectionTitles[line.order]?.trim() || `Раздел ${line.order}`,
        text: line.text,
      })),
    }

    setIsSaving(true)
    setError('')

    try {
      await onCreate(payload)
      resetAndClose()
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Не удалось сохранить шаблон.')
      setIsSaving(false)
    }
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <section
        className="template-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="template-modal-title"
      >
        <header className="modal-header">
          <div>
            <p className="section-kicker">Шаблоны</p>
            <h2 id="template-modal-title">Создать шаблон</h2>
          </div>
          <button type="button" className="icon-button" aria-label="Закрыть" onClick={resetAndClose}>
            ×
          </button>
        </header>

        <div className="wizard-steps" aria-label="Шаги создания шаблона">
          <span className={step === 1 ? 'active-step' : ''}>1. Текст</span>
          <span className={step === 2 ? 'active-step' : ''}>2. Разделы</span>
        </div>

        {step === 1 ? (
          <div className="modal-body">
            <label className="form-field">
              <span>Название</span>
              <input
                value={title}
                placeholder="Например: КТ органов грудной клетки"
                onChange={(event) => setTitle(event.target.value)}
              />
            </label>

            <label className="form-field">
              <span>Описание</span>
              <textarea
                className="template-description-input"
                value={description}
                placeholder={'Каждая строка станет отдельным разделом:\nЛегочные поля без инфильтрации.\nПлевральные полости свободны.'}
                onChange={(event) => setDescription(event.target.value)}
              />
            </label>

            <div className="numbered-preview" aria-label="Разделы описания">
              {parsedLines.length > 0 ? (
                parsedLines.map((line) => (
                  <div className="numbered-line" key={`${line.order}-${line.text}`}>
                    <span>{line.order}</span>
                    <p>{line.text}</p>
                  </div>
                ))
              ) : (
                <p className="muted-text">Пока нет строк описания.</p>
              )}
            </div>

            <label className="form-field">
              <span>Заключение</span>
              <textarea
                className="template-conclusion-input"
                value={conclusion}
                placeholder="Итоговое заключение шаблона..."
                onChange={(event) => setConclusion(event.target.value)}
              />
            </label>
          </div>
        ) : (
          <div className="modal-body">
            <div className="section-title-list">
              {parsedLines.map((line) => (
                <div className="section-title-row" key={`${line.order}-${line.text}`}>
                  <span className="line-badge">{line.order}</span>
                  <div>
                    <label className="form-field">
                      <span>Название раздела</span>
                      <input
                        value={sectionTitles[line.order] || ''}
                        placeholder={`Раздел ${line.order}`}
                        onChange={(event) =>
                          setSectionTitles((current) => ({
                            ...current,
                            [line.order]: event.target.value,
                          }))
                        }
                      />
                    </label>
                    <p>{line.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {error && <div className="modal-error">{error}</div>}

        <footer className="modal-actions">
          {step === 2 && (
            <button type="button" onClick={() => setStep(1)} disabled={isSaving}>
              Назад
            </button>
          )}
          <button type="button" className="secondary-action" onClick={resetAndClose} disabled={isSaving}>
            Отмена
          </button>
          {step === 1 ? (
            <button type="button" className="primary-action" onClick={goToSectionNames}>
              Далее
            </button>
          ) : (
            <button type="button" className="primary-action" onClick={saveTemplate} disabled={isSaving}>
              {isSaving ? 'Сохранение...' : 'Сохранить'}
            </button>
          )}
        </footer>
      </section>
    </div>
  )
}

export default TemplateModal
