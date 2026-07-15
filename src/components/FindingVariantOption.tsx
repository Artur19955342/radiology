import { useEffect, useMemo, useState } from 'react'
import { adaptFindingWithAi } from '../data/aiApi'
import type { AdaptFindingResponse } from '../types/ai'
import type { ReportFinding } from '../types/findings'
import { applyNumberParameters, findNumberParameters } from '../utils/findingParameters'
import LocalizationInput from './LocalizationInput'

type FindingVariantOptionProps = {
  finding: ReportFinding
  onSelect: (finding: ReportFinding) => void
}

const kindLabel = {
  finding: 'Находка',
  section_content: 'Содержимое раздела',
} as const

function FindingVariantOption({ finding, onSelect }: FindingVariantOptionProps) {
  const numberParameters = useMemo(
    () => [
      ...findNumberParameters(finding.description, 'description'),
      ...findNumberParameters(finding.conclusion, 'conclusion'),
    ],
    [finding.conclusion, finding.description],
  )
  const [localization, setLocalization] = useState('')
  const [numberValues, setNumberValues] = useState<Record<string, string>>(() =>
    numberParameters.reduce<Record<string, string>>((acc, parameter) => {
      acc[parameter.id] = parameter.value
      return acc
    }, {}),
  )
  const [adaptedFinding, setAdaptedFinding] = useState<AdaptFindingResponse | null>(null)
  const [isAdapting, setIsAdapting] = useState(false)
  const [aiError, setAiError] = useState('')

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

  const activeTitle = adaptedFinding?.title ?? finding.title
  const activeDescription = adaptedFinding?.description ?? renderedDescription
  const activeConclusion = adaptedFinding?.conclusion ?? renderedConclusion

  useEffect(() => {
    setAdaptedFinding(null)
    setAiError('')
  }, [finding.title, localization, renderedConclusion, renderedDescription])

  const adaptWithAi = async () => {
    const nextLocalization = localization.trim()

    if (!nextLocalization) {
      setAiError('Укажите локализацию.')
      return
    }

    setIsAdapting(true)
    setAiError('')

    try {
      const result = await adaptFindingWithAi({
        title: finding.title,
        kind: finding.kind,
        description: renderedDescription,
        conclusion: renderedConclusion,
        localization: nextLocalization,
      })

      setAdaptedFinding(result)
    } catch (error) {
      setAiError(error instanceof Error ? error.message : 'Не удалось адаптировать находку.')
    } finally {
      setIsAdapting(false)
    }
  }

  const applyVariant = () => {
    onSelect({
      ...finding,
      title: activeTitle,
      description: activeDescription,
      conclusion: activeConclusion,
    })
  }

  return (
    <article className="finding-variant-option">
      <header className="finding-variant-header">
        <div>
          <strong>{activeTitle}</strong>
          <small>{kindLabel[finding.kind]}</small>
        </div>
        <div className="finding-variant-actions">
          <button
            className="ai-action"
            type="button"
            disabled={isAdapting || !localization.trim()}
            onClick={adaptWithAi}
          >
            {isAdapting ? 'ИИ...' : 'ИИ'}
          </button>
          <button type="button" onClick={applyVariant}>
            Вставить
          </button>
        </div>
      </header>

      <LocalizationInput value={localization} onChange={setLocalization} />
      {aiError && <p className="finding-variant-ai-error">{aiError}</p>}

      {numberParameters.length > 0 && (
        <div className="variant-number-grid" aria-label="Числовые параметры">
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

      <p className="finding-variant-preview">{activeDescription}</p>
      {activeConclusion && <p className="finding-variant-preview muted">{activeConclusion}</p>}
    </article>
  )
}

export default FindingVariantOption
