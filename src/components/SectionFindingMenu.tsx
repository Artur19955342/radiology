import type { ReportFinding } from '../types/findings'
import SectionContentOption from './SectionContentOption'

type SectionFindingMenuProps = {
  findings: ReportFinding[]
  sectionTitle: string
  onSelect: (finding: ReportFinding) => void
}

function SectionFindingMenu({ findings, sectionTitle, onSelect }: SectionFindingMenuProps) {
  return (
    <div className="section-menu" role="menu" aria-label={`Содержимое раздела ${sectionTitle}`}>
      {findings.length === 0 ? (
        <p className="panel-muted">Нет сохраненного содержимого для этого раздела.</p>
      ) : (
        findings.map((finding) => (
          <SectionContentOption key={finding.id} finding={finding} onSelect={onSelect} />
        ))
      )}
    </div>
  )
}

export default SectionFindingMenu
