import type { GenerateFindingReadyResponse, GenerateFindingResponse } from '../types/ai'
import type { ReportFinding } from '../types/findings'
import FindingVariantOption from './FindingVariantOption'

type FindingSearchResultsProps = {
  query: string
  findings: ReportFinding[]
  generatedFinding: GenerateFindingResponse | null
  generateError: string
  isGenerating: boolean
  onGenerate: () => void
  onApplyGenerated: (finding: GenerateFindingReadyResponse) => void
  onSelect: (finding: ReportFinding) => void
}

function FindingSearchResults({
  query,
  findings,
  generatedFinding,
  generateError,
  isGenerating,
  onGenerate,
  onApplyGenerated,
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
          <div className="finding-search-list">
            {findings.map((finding) => (
              <FindingVariantOption key={finding.id} finding={finding} onSelect={onSelect} />
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
          {isGenerating ? 'Формирую...' : 'Сформировать описание'}
        </button>

        {generateError && <p className="finding-variant-ai-error">{generateError}</p>}

        {generatedFinding?.status === 'needs_clarification' && (
          <div className="ai-search-result">
            <strong>Нужно уточнить</strong>
            <p>{generatedFinding.question}</p>
            {generatedFinding.suggestions && generatedFinding.suggestions.length > 0 && (
              <div className="suggestion-list" aria-label="Варианты уточнения">
                {generatedFinding.suggestions.map((suggestion) => (
                  <span className="suggestion-chip" key={suggestion}>
                    {suggestion}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {generatedFinding?.status === 'ready' && (
          <article className="ai-search-result">
            <header className="ai-search-result-header">
              <div>
                <strong>{generatedFinding.title}</strong>
                <span className="ai-section-pill">{generatedFinding.sectionTitle}</span>
              </div>
              <button type="button" onClick={() => onApplyGenerated(generatedFinding)}>
                Добавить
              </button>
            </header>

            <p className="ai-preview">{generatedFinding.description}</p>
            <p className="ai-preview muted">{generatedFinding.conclusion}</p>

            {generatedFinding.differential && generatedFinding.differential.length > 0 && (
              <div className="differential-list" aria-label="Дифференциальный ряд">
                {generatedFinding.differential.map((item) => (
                  <span key={item}>{item}</span>
                ))}
              </div>
            )}
          </article>
        )}
      </div>
    </div>
  )
}

export default FindingSearchResults
