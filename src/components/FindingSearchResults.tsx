import type { ReportFinding } from '../types/findings'
import FindingVariantOption from './FindingVariantOption'

type FindingSearchResultsProps = {
  findings: ReportFinding[]
  onSelect: (finding: ReportFinding) => void
}

function FindingSearchResults({ findings, onSelect }: FindingSearchResultsProps) {
  if (findings.length === 0) {
    return null
  }

  return (
    <div className="finding-search-results" aria-label="Найденные записи">
      <div className="finding-search-header">
        <span>Найдено в базе</span>
        <small>{findings.length}</small>
      </div>
      <div className="finding-search-list">
        {findings.map((finding) => (
          <FindingVariantOption key={finding.id} finding={finding} onSelect={onSelect} />
        ))}
      </div>
    </div>
  )
}

export default FindingSearchResults
