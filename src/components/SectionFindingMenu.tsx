import type { ReportFinding } from '../types/findings'
import FindingVariantOption from './FindingVariantOption'

type SectionFindingMenuProps = {
  findings: ReportFinding[]
  onSelect: (finding: ReportFinding) => void
}

function SectionFindingMenu({ findings, onSelect }: SectionFindingMenuProps) {
  return (
    <div className="section-menu" role="menu" aria-label="Сохраненные записи">
      {findings.length === 0 ? (
        <p className="panel-muted">Нет сохраненных записей.</p>
      ) : (
        findings.map((finding) => (
          <FindingVariantOption key={finding.id} finding={finding} onSelect={onSelect} />
        ))
      )}
    </div>
  )
}

export default SectionFindingMenu
