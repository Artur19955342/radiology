import type { ReportFinding } from '../types/findings'

type SectionContentOptionProps = {
  finding: ReportFinding
  onSelect: (finding: ReportFinding) => void
}

function SectionContentOption({ finding, onSelect }: SectionContentOptionProps) {
  return (
    <button
      type="button"
      className="section-content-title"
      onClick={() => onSelect(finding)}
    >
      {finding.title}
    </button>
  )
}

export default SectionContentOption
