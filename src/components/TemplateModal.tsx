import { useMemo, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react'
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

const getDescriptionLineOrderAtIndex = (description: string, selectionStart: number) => {
  const rawLines = description.split(/\r?\n/)
  const activeLineIndex = description.slice(0, selectionStart).split(/\r?\n/).length - 1
  let order = 0

  for (let index = 0; index <= activeLineIndex; index += 1) {
    if (rawLines[index]?.trim()) {
      order += 1
    }
  }

  return order
}

const normalizeTitleSelection = (value: string) => value.replace(/\s+/g, ' ').trim()

function TemplateModal({ open, onClose, onCreate }: TemplateModalProps) {
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
    setTitle('')
    setDescription('')
    setConclusion('')
    setSectionTitles({})
    setError('')
    setIsSaving(false)
    onClose()
  }

  const assignSelectedTextToSectionTitle = (
    event: ReactKeyboardEvent<HTMLTextAreaElement>,
  ) => {
    if (event.key !== 'Enter') {
      return
    }

    const textarea = event.currentTarget
    const selectedText = normalizeTitleSelection(
      textarea.value.slice(textarea.selectionStart, textarea.selectionEnd),
    )

    if (!selectedText) {
      return
    }

    const lineOrder = getDescriptionLineOrderAtIndex(description, textarea.selectionStart)

    if (!lineOrder) {
      return
    }

    event.preventDefault()
    setSectionTitles((current) => ({
      ...current,
      [lineOrder]: selectedText,
    }))
  }

  const saveTemplate = async () => {
    const templateTitle = title.trim()

    if (!templateTitle) {
      setError('Укажите название шаблона.')
      return
    }

    if (parsedLines.length === 0) {
      setError('Добавьте описание: каждая строка станет отдельным разделом.')
      return
    }

    const payload: CreateReportTemplatePayload = {
      title: templateTitle,
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
        className="template-modal template-builder-modal"
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

        <div className="modal-body template-modal-layout">
          <div className="template-editor-pane">
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
                onKeyDown={assignSelectedTextToSectionTitle}
                onChange={(event) => setDescription(event.target.value)}
              />
            </label>

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

          <aside className="template-sections-pane" aria-label="Разделы шаблона">
            <div className="template-sections-header">
              <div>
                <p className="section-kicker">Разделы</p>
                <h3>Названия</h3>
              </div>
              <span>{parsedLines.length}</span>
            </div>

            <div className="section-title-list">
              {parsedLines.length > 0 ? (
                parsedLines.map((line) => (
                  <div className="section-title-row" key={`${line.order}-${line.text}`}>
                    <span className="line-badge">{line.order}</span>
                    <div>
                      <label className="form-field section-title-field">
                        <input
                          value={sectionTitles[line.order] || ''}
                          placeholder={`Раздел ${line.order}`}
                          aria-label={`Название раздела ${line.order}`}
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
                ))
              ) : (
                <p className="muted-text">Строки описания появятся здесь как разделы.</p>
              )}
            </div>
          </aside>
        </div>

        {error && <div className="modal-error">{error}</div>}

        <footer className="modal-actions">
          <button type="button" className="secondary-action" onClick={resetAndClose} disabled={isSaving}>
            Отмена
          </button>
          <button type="button" className="primary-action" onClick={saveTemplate} disabled={isSaving}>
            {isSaving ? 'Сохранение...' : 'Сохранить'}
          </button>
        </footer>
      </section>
    </div>
  )
}

export default TemplateModal
