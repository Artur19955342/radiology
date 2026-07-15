import { useMemo, useState } from 'react'
import type { ReportFinding } from '../types/findings'
import { applyNumberParameters, findNumberParameters } from '../utils/findingParameters'

type SectionContentOptionProps = {
  finding: ReportFinding
  onSelect: (finding: ReportFinding) => void
}

function SectionContentOption({ finding, onSelect }: SectionContentOptionProps) {
  const numberParameters = useMemo(
    () => [
      ...findNumberParameters(finding.description, 'description'),
      ...findNumberParameters(finding.conclusion, 'conclusion'),
    ],
    [finding.conclusion, finding.description],
  )
  const [numberValues, setNumberValues] = useState<Record<string, string>>(() =>
    numberParameters.reduce<Record<string, string>>((acc, parameter) => {
      acc[parameter.id] = parameter.value
      return acc
    }, {}),
  )

  const renderedDescription = applyNumberParameters(
    finding.description,
    numberParameters.filter((parameter) => parameter.target === 'description'),
    numberValues,
  )
  const renderedConclusion = applyNumberParameters(
    finding.conclusion,
    numberParameters.filter((parameter) => parameter.target === 'conclusion'),
    numberValues,
  )

  const applyOption = () => {
    onSelect({
      ...finding,
      description: renderedDescription,
      conclusion: renderedConclusion,
    })
  }

  return (
    <article className="section-content-option">
      <header className="section-content-option-header">
        <button type="button" className="section-content-title" onClick={applyOption}>
          {finding.title}
        </button>
        <button type="button" className="section-content-apply" onClick={applyOption}>
          Выбрать
        </button>
      </header>

      {numberParameters.length > 0 && (
        <div className="variant-number-grid compact-number-grid" aria-label="Числовые параметры">
          {numberParameters.map((parameter) => (
            <label className="variant-field compact" key={parameter.id}>
              <span>
                {parameter.target === 'description' ? 'Описание' : 'Заключение'} {parameter.order}
              </span>
              <input
                value={numberValues[parameter.id] ?? parameter.value}
                onChange={(event) =>
                  setNumberValues((current) => ({
                    ...current,
                    [parameter.id]: event.target.value,
                  }))
                }
              />
            </label>
          ))}
        </div>
      )}
    </article>
  )
}

export default SectionContentOption
