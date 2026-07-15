import type { GenerateFindingClarificationResponse } from '../types/ai'
import type { ReportFinding } from '../types/findings'
import FindingVariantOption from './FindingVariantOption'

type FindingSearchResultsProps = {
  query: string
  findings: ReportFinding[]
  activeFindingIndex: number
  clarification: GenerateFindingClarificationResponse | null
  generateError: string
  isGenerating: boolean
  hasDraft: boolean
  onActiveFindingChange: (index: number) => void
  onGenerate: () => void
  onSelect: (finding: ReportFinding) => void
}

function FindingSearchResults({
  query,
  findings,
  activeFindingIndex,
  clarification,
  generateError,
  isGenerating,
  hasDraft,
  onActiveFindingChange,
  onGenerate,
  onSelect,
}: FindingSearchResultsProps) {
  const trimmedQuery = query.trim()

  if (!trimmedQuery) {
    return null
  }

  return (
    <div className="finding-search-results" aria-label="Найденные записи и свободный поиск">
      {findings.length > 0 && (
        <>
          <div className="finding-search-header">
            <span>Найдено в базе</span>
            <small>{findings.length}</small>
          </div>
          <div className="finding-search-list" role="listbox" aria-label="Варианты находок">
            {findings.map((finding, index) => (
              <FindingVariantOption
                key={finding.id}
                finding={finding}
                isActive={index === activeFindingIndex}
                onActivate={() => onActiveFindingChange(index)}
                onSelect={onSelect}
              />
            ))}
          </div>
        </>
      )}

      <div className="ai-search-panel">
        <div className="finding-search-header">
          <span>Свободный поиск</span>
          <small>DeepSeek Pro</small>
        </div>

        <button
          className="ai-search-generate"
          type="button"
          disabled={isGenerating || trimmedQuery.length < 2}
          onClick={onGenerate}
        >
          {isGenerating ? 'Формирую...' : hasDraft ? 'Обновить предложение' : 'Сформировать описание'}
        </button>

        {hasDraft && <p className="ai-search-note">Описание и заключение открыты справа.</p>}
        {generateError && <p className="finding-variant-ai-error">{generateError}</p>}

        {clarification && (
          <div className="ai-search-result">
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
      </div>
    </div>
  )
}

export default FindingSearchResults
