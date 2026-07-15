import { useMemo, useState, type KeyboardEvent } from 'react'
import {
  defaultLocalizationDictionary,
  type LocalizationDictionaryEntry,
} from '../data/localizationDictionaries'

type LocalizationSide = 'right' | 'left'

type LocalizationInputProps = {
  value: string
  onChange: (value: string) => void
}

const sideLabel: Record<LocalizationSide, string> = {
  right: 'справа',
  left: 'слева',
}

const sideShortcut: Record<LocalizationSide, string> = {
  right: 'R',
  left: 'L',
}

const getActiveQuery = (value: string) => {
  const lastCommaIndex = value.lastIndexOf(',')
  return value.slice(lastCommaIndex + 1).trim().toLowerCase()
}

const replaceActiveQuery = (value: string, nextValue: string) => {
  const lastCommaIndex = value.lastIndexOf(',')

  if (lastCommaIndex === -1) {
    return nextValue
  }

  const prefix = value.slice(0, lastCommaIndex + 1).trimEnd()
  return `${prefix} ${nextValue}`
}

function LocalizationInput({ value, onChange }: LocalizationInputProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [selectedSide, setSelectedSide] = useState<LocalizationSide>('right')
  const query = getActiveQuery(value)

  const suggestions = useMemo(() => {
    if (!query) {
      return []
    }

    const startsWithMatches = defaultLocalizationDictionary.entries.filter((entry) =>
      entry.label.toLowerCase().startsWith(query),
    )
    const includesMatches = defaultLocalizationDictionary.entries.filter(
      (entry) =>
        !entry.label.toLowerCase().startsWith(query) &&
        entry.label.toLowerCase().includes(query),
    )

    return [...startsWithMatches, ...includesMatches].slice(0, 8)
  }, [query])

  const insertEntry = (entry: LocalizationDictionaryEntry, side: LocalizationSide) => {
    onChange(replaceActiveQuery(value, `${entry.label} ${sideLabel[side]}`))
    setSelectedIndex(0)
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (suggestions.length === 0) {
      return
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setSelectedIndex((current) => (current + 1) % suggestions.length)
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault()
      setSelectedIndex((current) => (current - 1 + suggestions.length) % suggestions.length)
    }

    if (event.key === 'ArrowRight') {
      event.preventDefault()
      setSelectedSide('right')
    }

    if (event.key === 'ArrowLeft') {
      event.preventDefault()
      setSelectedSide('left')
    }

    if (event.key === 'Enter') {
      event.preventDefault()
      insertEntry(suggestions[selectedIndex], selectedSide)
    }
  }

  return (
    <label className="variant-field localization-field">
      <span>Локализация</span>
      <input
        value={value}
        placeholder={`${defaultLocalizationDictionary.title}: начните вводить...`}
        onChange={(event) => {
          onChange(event.target.value)
          setSelectedIndex(0)
        }}
        onKeyDown={handleKeyDown}
      />

      {suggestions.length > 0 && (
        <div className="localization-suggestions" role="listbox">
          {suggestions.map((entry, index) => (
            <div
              className={`localization-option${index === selectedIndex ? ' active-localization' : ''}`}
              key={entry.id}
              role="option"
              aria-selected={index === selectedIndex}
            >
              <button
                type="button"
                className="localization-name"
                onClick={() => {
                  setSelectedIndex(index)
                  insertEntry(entry, selectedSide)
                }}
              >
                {entry.label}
              </button>
              <div className="localization-side-buttons" aria-label="Сторона">
                {(['right', 'left'] as const).map((side) => (
                  <button
                    type="button"
                    className={
                      index === selectedIndex && selectedSide === side ? 'active-side' : ''
                    }
                    key={side}
                    onClick={() => {
                      setSelectedIndex(index)
                      setSelectedSide(side)
                      insertEntry(entry, side)
                    }}
                  >
                    {sideShortcut[side]}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </label>
  )
}

export default LocalizationInput
