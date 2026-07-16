import { useEffect, useMemo, useState } from 'react'
import { adaptFindingWithAi } from '../data/aiApi'
import type { AdaptFindingResponse } from '../types/ai'
import type { ReportFinding } from '../types/findings'
import { applyNumberParameters, findNumberParameters } from '../utils/findingParameters'
import LocalizationInput from './LocalizationInput'

type FindingVariantOptionProps = {
  finding: ReportFinding
  isActive: boolean
  onActivate: () => void
  onSelect: (finding: ReportFinding) => void
}

const normalizeSummary = (value: string) => value.replace(/\s+/g, ' ').trim()

function FindingVariantOption({
  finding,
  isActive,
  onActivate,
  onSelect,
}: FindingVariantOptionProps) {
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
  const [aiNotice, setAiNotice] = useState('')

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
  const summary = normalizeSummary([activeDescription, activeConclusion].filter(Boolean).join(' '))

  useEffect(() => {
    setAdaptedFinding(null)
    setAiError('')
    setAiNotice('')
  }, [finding.title, localization, renderedConclusion, renderedDescription])

  const adaptWithAi = async () => {
    const nextLocalization = localization.trim()

    if (!nextLocalization) {
      setAiError('Укажите локализацию.')
      return
    }

    setIsAdapting(true)
    setAiError('')
    setAiNotice('')

    try {
      const result = await adaptFindingWithAi({
        title: finding.title,
        kind: finding.kind,
        description: renderedDescription,
        conclusion: renderedConclusion,
        localization: nextLocalization,
      })

      setAdaptedFinding(result)
      setAiNotice(result.warning || '')
    } catch (error) {
      setAiError(
        error instanceof Error
          ? error.message
          : 'ИИ сейчас недоступен. Вариант можно вставить без адаптации или повторить позже.',
      )
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
    <article
      className={`finding-variant-option${isActive ? ' active-variant' : ''}`}
      aria-selected={isActive}
      role="option"
      onClick={isActive ? undefined : onActivate}
      onFocus={onActivate}
      onMouseEnter={onActivate}
    >
      <header className="finding-variant-header">
        <strong className="finding-variant-title">{activeTitle}</strong>
        <span className="finding-variant-summary">{summary}</span>
        {isActive && (
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
        )}
      </header>

      {isActive && (
        <>
          <LocalizationInput value={localization} onChange={setLocalization} />
          {aiError && <p className="finding-variant-ai-error">{aiError}</p>}
          {aiNotice && <p className="finding-variant-ai-notice">{aiNotice}</p>}

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
        </>
      )}
    </article>
  )
}

export default FindingVariantOption
