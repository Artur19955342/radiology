import {
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import FindingCapturePanel from './components/FindingCapturePanel'
import FindingSearchResults from './components/FindingSearchResults'
import SectionFindingMenu from './components/SectionFindingMenu'
import TemplateModal from './components/TemplateModal'
import TemplatePickerModal from './components/TemplatePickerModal'
import { generateFindingWithAi } from './data/aiApi'
import { createFinding, loadFindings } from './data/findingsRepository'
import { createTemplate, loadTemplates } from './data/templatesRepository'
import type { GenerateFindingReadyResponse, GenerateFindingResponse } from './types/ai'
import type { CreateReportFindingPayload, ReportFinding } from './types/findings'
import type {
  CreateReportTemplatePayload,
  DescriptionField,
  ReportTemplate,
} from './types/templates'
import { appendTextBlock, getTextareaSelection, removeTextBlock } from './utils/textSelection'
import './App.css'

type ReportStackStyle = CSSProperties & {
  '--description-height': string
}

type SectionContentLink = {
  findingId: string
  description: string
  conclusion: string
}

const MIN_DESCRIPTION_HEIGHT = 32
const MAX_DESCRIPTION_HEIGHT = 76
const HEIGHT_STEP = 3

const defaultDescriptionFields: DescriptionField[] = [
  {
    id: 'lungs',
    title: 'Легкие',
    placeholder: 'Опишите легочную ткань, очаговые и инфильтративные изменения...',
  },
  {
    id: 'pleura',
    title: 'Плевра',
    placeholder: 'Плевральные полости, жидкость, утолщения...',
  },
  {
    id: 'mediastinum',
    title: 'Средостение',
    placeholder: 'Сердце, сосуды, лимфатические узлы средостения...',
  },
  {
    id: 'bones',
    title: 'Костные структуры',
    placeholder: 'Костные структуры, дегенеративные изменения, повреждения...',
  },
]

const emptyFindingDraft: CreateReportFindingPayload = {
  title: '',
  description: '',
  conclusion: '',
  kind: 'finding',
}

const createEmptyDescription = (fields: DescriptionField[]) =>
  fields.reduce<Record<string, string>>((acc, field) => {
    acc[field.id] = ''
    return acc
  }, {})

const clampDescriptionHeight = (height: number) =>
  Math.min(MAX_DESCRIPTION_HEIGHT, Math.max(MIN_DESCRIPTION_HEIGHT, height))

const templateToFields = (template: ReportTemplate): DescriptionField[] =>
  template.sections.map((section) => ({
    id: section.id,
    title: section.title,
    placeholder: section.title,
  }))

const templateToDescription = (template: ReportTemplate) =>
  template.sections.reduce<Record<string, string>>((acc, section) => {
    acc[section.id] = section.text
    return acc
  }, {})

const matchesFindingSearch = (finding: ReportFinding, query: string) =>
  finding.title.toLowerCase().includes(query) ||
  finding.description.toLowerCase().includes(query) ||
  finding.conclusion.toLowerCase().includes(query)

const belongsToSection = (finding: ReportFinding, field: DescriptionField) => {
  if (finding.kind !== 'section_content') {
    return false
  }

  if (finding.sectionId) {
    return finding.sectionId === field.id
  }

  return finding.sectionTitle === field.title || finding.title === field.title
}

function App() {
  const stackRef = useRef<HTMLDivElement>(null)
  const [descriptionFields, setDescriptionFields] = useState(defaultDescriptionFields)
  const [description, setDescription] = useState(() => createEmptyDescription(defaultDescriptionFields))
  const [conclusion, setConclusion] = useState('')
  const [search, setSearch] = useState('')
  const [generatedFinding, setGeneratedFinding] = useState<GenerateFindingResponse | null>(null)
  const [generateError, setGenerateError] = useState('')
  const [isGeneratingFinding, setIsGeneratingFinding] = useState(false)
  const [descriptionHeight, setDescriptionHeight] = useState(58)
  const [isResizing, setIsResizing] = useState(false)
  const [templates, setTemplates] = useState<ReportTemplate[]>([])
  const [templatesError, setTemplatesError] = useState('')
  const [isTemplatesLoading, setIsTemplatesLoading] = useState(true)
  const [findings, setFindings] = useState<ReportFinding[]>([])
  const [findingDraft, setFindingDraft] = useState<CreateReportFindingPayload>(emptyFindingDraft)
  const [findingSaveError, setFindingSaveError] = useState('')
  const [isFindingSaving, setIsFindingSaving] = useState(false)
  const [activeFieldId, setActiveFieldId] = useState(defaultDescriptionFields[0].id)
  const [openMenuFieldId, setOpenMenuFieldId] = useState<string | null>(null)
  const [, setSectionContentLinks] = useState<Record<string, SectionContentLink>>({})
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false)
  const [isTemplatePickerOpen, setIsTemplatePickerOpen] = useState(false)

  useEffect(() => {
    let isMounted = true

    const refreshTemplates = async () => {
      try {
        const loadedTemplates = await loadTemplates()

        if (isMounted) {
          setTemplates(loadedTemplates)
          setTemplatesError('')
        }
      } catch (error) {
        if (isMounted) {
          setTemplatesError(error instanceof Error ? error.message : 'Не удалось загрузить шаблоны.')
        }
      } finally {
        if (isMounted) {
          setIsTemplatesLoading(false)
        }
      }
    }

    void refreshTemplates()

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    let isMounted = true

    const refreshFindings = async () => {
      try {
        const loadedFindings = await loadFindings()

        if (isMounted) {
          setFindings(loadedFindings)
        }
      } catch {
        // Search and section menus remain empty when the local store is unavailable.
      }
    }

    void refreshFindings()

    return () => {
      isMounted = false
    }
  }, [])

  const filledCount = useMemo(
    () => descriptionFields.filter((field) => description[field.id]?.trim()).length,
    [description, descriptionFields],
  )

  const findingSearchResults = useMemo(() => {
    const query = search.trim().toLowerCase()

    if (!query) {
      return []
    }

    return findings
      .filter((finding) => finding.kind === 'finding' && matchesFindingSearch(finding, query))
      .slice(0, 8)
  }, [findings, search])

  const descriptionSections = useMemo(
    () => descriptionFields.map((field) => ({ id: field.id, title: field.title })),
    [descriptionFields],
  )

  const stackStyle: ReportStackStyle = {
    '--description-height': `${descriptionHeight}%`,
  }

  const updateField = (id: string, value: string) => {
    setDescription((current) => ({ ...current, [id]: value }))
  }

  const applyTemplate = (template: ReportTemplate) => {
    const nextFields = templateToFields(template)
    setDescriptionFields(nextFields)
    setDescription(templateToDescription(template))
    setConclusion(template.conclusion)
    setActiveFieldId(nextFields[0]?.id || '')
    setOpenMenuFieldId(null)
    setSectionContentLinks({})
    setSearch('')
    setGeneratedFinding(null)
    setGenerateError('')
    setIsTemplatePickerOpen(false)
  }

  const handleSearchChange = (value: string) => {
    setSearch(value)
    setGeneratedFinding(null)
    setGenerateError('')
  }

  const applyFindingToField = (finding: ReportFinding, fieldId = activeFieldId) => {
    const targetFieldId = fieldId || descriptionFields[0]?.id

    if (!targetFieldId) {
      return
    }

    if (finding.kind === 'section_content') {
      const nextConclusion = finding.conclusion.trim()

      setSectionContentLinks((currentLinks) => {
        const previousLink = currentLinks[targetFieldId]

        setDescription((currentDescription) => ({
          ...currentDescription,
          [targetFieldId]: finding.description,
        }))

        setConclusion((currentConclusion) => {
          const withoutPreviousConclusion = previousLink?.conclusion
            ? removeTextBlock(currentConclusion, previousLink.conclusion)
            : currentConclusion

          return nextConclusion
            ? appendTextBlock(withoutPreviousConclusion, nextConclusion)
            : withoutPreviousConclusion
        })

        return {
          ...currentLinks,
          [targetFieldId]: {
            findingId: finding.id,
            description: finding.description,
            conclusion: nextConclusion,
          },
        }
      })
    } else {
      setDescription((current) => ({
        ...current,
        [targetFieldId]: appendTextBlock(current[targetFieldId] || '', finding.description),
      }))

      if (finding.conclusion.trim()) {
        setConclusion((current) => appendTextBlock(current, finding.conclusion))
      }
    }

    setActiveFieldId(targetFieldId)
    setOpenMenuFieldId(null)
    setSearch('')
    setGeneratedFinding(null)
    setGenerateError('')
  }

  const generateFindingFromSearch = async () => {
    const query = search.trim()

    if (!query) {
      return
    }

    setIsGeneratingFinding(true)
    setGenerateError('')
    setGeneratedFinding(null)

    try {
      const result = await generateFindingWithAi({
        query,
        sections: descriptionSections,
      })
      setGeneratedFinding(result)
    } catch (error) {
      setGenerateError(
        error instanceof Error
          ? error.message
          : 'ИИ сейчас недоступен. Уточните запрос или повторите позже.',
      )
    } finally {
      setIsGeneratingFinding(false)
    }
  }

  const applyGeneratedFinding = (finding: GenerateFindingReadyResponse) => {
    setDescription((current) => ({
      ...current,
      [finding.sectionId]: appendTextBlock(current[finding.sectionId] || '', finding.description),
    }))

    if (finding.conclusion.trim()) {
      setConclusion((current) => appendTextBlock(current, finding.conclusion))
    }

    setActiveFieldId(finding.sectionId)
    setOpenMenuFieldId(null)
    setSearch('')
    setGeneratedFinding(null)
    setGenerateError('')
  }

  const captureDescriptionSelection = (
    event: ReactKeyboardEvent<HTMLTextAreaElement>,
    field: DescriptionField,
  ) => {
    if (event.key !== 'Enter') {
      return
    }

    const selectedText = getTextareaSelection(event.currentTarget)

    if (!selectedText) {
      return
    }

    event.preventDefault()
    setFindingDraft((current) => ({
      ...current,
      title: current.title || field.title,
      description: selectedText,
      sectionId: field.id,
      sectionTitle: field.title,
    }))
  }

  const captureConclusionSelection = (event: ReactKeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== 'Enter') {
      return
    }

    const selectedText = getTextareaSelection(event.currentTarget)

    if (!selectedText) {
      return
    }

    event.preventDefault()
    setFindingDraft((current) => ({
      ...current,
      conclusion: selectedText,
    }))
  }

  const handleCreateTemplate = async (payload: CreateReportTemplatePayload) => {
    const savedTemplate = await createTemplate(payload)
    setTemplates((currentTemplates) => [
      savedTemplate,
      ...currentTemplates.filter((template) => template.id !== savedTemplate.id),
    ])
    setTemplatesError('')
    applyTemplate(savedTemplate)
  }

  const handleSaveFinding = async () => {
    setIsFindingSaving(true)
    setFindingSaveError('')

    try {
      const activeField =
        descriptionFields.find((field) => field.id === (findingDraft.sectionId || activeFieldId)) ||
        descriptionFields[0]
      const payload =
        findingDraft.kind === 'section_content'
          ? {
              ...findingDraft,
              sectionId: findingDraft.sectionId || activeField?.id,
              sectionTitle: findingDraft.sectionTitle || activeField?.title,
            }
          : {
              ...findingDraft,
              sectionId: undefined,
              sectionTitle: undefined,
            }

      const savedFinding = await createFinding(payload)
      setFindings((currentFindings) => [
        savedFinding,
        ...currentFindings.filter((finding) => finding.id !== savedFinding.id),
      ])
      setFindingDraft(emptyFindingDraft)
    } catch (error) {
      setFindingSaveError(error instanceof Error ? error.message : 'Не удалось сохранить запись.')
    } finally {
      setIsFindingSaving(false)
    }
  }

  const resizeToPointer = (clientY: number) => {
    const stack = stackRef.current
    if (!stack) {
      return
    }

    const rect = stack.getBoundingClientRect()
    const nextHeight = ((clientY - rect.top) / rect.height) * 100
    setDescriptionHeight(clampDescriptionHeight(nextHeight))
  }

  const startResize = (event: ReactPointerEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsResizing(true)
    event.currentTarget.setPointerCapture(event.pointerId)
    resizeToPointer(event.clientY)
  }

  const moveResize = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (isResizing) {
      resizeToPointer(event.clientY)
    }
  }

  const stopResize = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    setIsResizing(false)
  }

  const resizeWithKeyboard = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowUp') {
      event.preventDefault()
      setDescriptionHeight((height) => clampDescriptionHeight(height - HEIGHT_STEP))
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setDescriptionHeight((height) => clampDescriptionHeight(height + HEIGHT_STEP))
    }
  }

  return (
    <>
      <main className="workspace" aria-label="Рабочее место радиолога">
        <div
          ref={stackRef}
          className={`report-stack${isResizing ? ' is-resizing' : ''}`}
          style={stackStyle}
        >
          <section className="report-column description-column" aria-label="Описание">
            <header className="section-header">
              <div className="search-block">
                <p className="section-kicker">Протокол</p>
                <label className="visually-hidden" htmlFor="description-search">
                  Поиск по описанию и находкам
                </label>
                <input
                  id="description-search"
                  className="search-input"
                  type="search"
                  value={search}
                  placeholder="Поиск по описанию и находкам..."
                  onChange={(event) => handleSearchChange(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault()
                      void generateFindingFromSearch()
                    }
                  }}
                />
                <FindingSearchResults
                  query={search}
                  findings={findingSearchResults}
                  generatedFinding={generatedFinding}
                  generateError={generateError}
                  isGenerating={isGeneratingFinding}
                  onGenerate={() => void generateFindingFromSearch()}
                  onApplyGenerated={applyGeneratedFinding}
                  onSelect={(finding) => applyFindingToField(finding)}
                />
              </div>
              <span className="status-pill">
                {filledCount} из {descriptionFields.length}
              </span>
            </header>

            <div className="description-list">
              {descriptionFields.map((field) => (
                <div
                  className={`description-row${openMenuFieldId === field.id ? ' menu-open' : ''}`}
                  key={field.id}
                >
                  <div className="field-menu-wrap">
                    <button
                      type="button"
                      className={`field-number${openMenuFieldId === field.id ? ' active-number' : ''}`}
                      aria-label={`Открыть записи для поля ${field.title}`}
                      onClick={() => {
                        setActiveFieldId(field.id)
                        setOpenMenuFieldId((current) => (current === field.id ? null : field.id))
                      }}
                    >
                      {descriptionFields.findIndex((item) => item.id === field.id) + 1}
                    </button>
                    {openMenuFieldId === field.id && (
                      <SectionFindingMenu
                        findings={findings.filter((finding) => belongsToSection(finding, field))}
                        sectionTitle={field.title}
                        onSelect={(finding) => applyFindingToField(finding, field.id)}
                      />
                    )}
                  </div>
                  <textarea
                    id={field.id}
                    aria-label={field.title}
                    value={description[field.id] || ''}
                    placeholder={field.placeholder}
                    onFocus={() => setActiveFieldId(field.id)}
                    onKeyDown={(event) => captureDescriptionSelection(event, field)}
                    onChange={(event) => updateField(field.id, event.target.value)}
                  />
                </div>
              ))}
              {descriptionFields.length === 0 && (
                <div className="empty-search">Ничего не найдено</div>
              )}
            </div>
          </section>

          <div
            className="resize-divider"
            role="separator"
            tabIndex={0}
            aria-label="Изменить высоту описания и заключения"
            aria-orientation="horizontal"
            aria-valuemin={MIN_DESCRIPTION_HEIGHT}
            aria-valuemax={MAX_DESCRIPTION_HEIGHT}
            aria-valuenow={Math.round(descriptionHeight)}
            onPointerDown={startResize}
            onPointerMove={moveResize}
            onPointerUp={stopResize}
            onPointerCancel={stopResize}
            onKeyDown={resizeWithKeyboard}
          />

          <section className="report-column conclusion-column" aria-labelledby="conclusion-title">
            <header className="section-header">
              <div>
                <p className="section-kicker">Итог</p>
                <h2 id="conclusion-title">Заключение</h2>
              </div>
            </header>

            <textarea
              className="conclusion-input"
              value={conclusion}
              placeholder="Введите итоговое заключение..."
              onKeyDown={captureConclusionSelection}
              onChange={(event) => setConclusion(event.target.value)}
            />
          </section>
        </div>

        <aside className="side-panel" aria-label="Боковая панель">
          <div className="side-panel-header">
            <p className="section-kicker">Панель</p>
            <h2>Действия</h2>
          </div>

          <FindingCapturePanel
            draft={findingDraft}
            error={findingSaveError}
            isSaving={isFindingSaving}
            onChange={setFindingDraft}
            onSave={handleSaveFinding}
          />

          <div className="panel-group">
            <button type="button" onClick={() => setIsTemplatePickerOpen(true)}>
              Выбрать шаблон
            </button>
            <button type="button" onClick={() => setIsTemplateModalOpen(true)}>
              Создать шаблон
            </button>
          </div>
        </aside>
      </main>

      <TemplateModal
        open={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        onCreate={handleCreateTemplate}
      />
      <TemplatePickerModal
        open={isTemplatePickerOpen}
        templates={templates}
        isLoading={isTemplatesLoading}
        error={templatesError}
        onClose={() => setIsTemplatePickerOpen(false)}
        onSelect={applyTemplate}
      />
    </>
  )
}

export default App
