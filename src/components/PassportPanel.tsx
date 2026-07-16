import type { PassportData } from '../types/passport'
import { formatDateInput, formatTimeInput } from '../utils/dateTimeMasks'

type PassportPanelProps = {
  data: PassportData
  onChange: (patch: Partial<PassportData>) => void
}

type PassportField = {
  id: keyof PassportData
  label: string
  placeholder?: string
  inputMode?: 'text' | 'numeric' | 'decimal'
  formatter?: (value: string) => string
}

const passportFields: PassportField[] = [
  { id: 'fullName', label: 'ФИО', placeholder: 'Иванов Иван Иванович' },
  {
    id: 'birthDate',
    label: 'Дата рождения',
    placeholder: 'дд.мм.гггг',
    inputMode: 'numeric',
    formatter: formatDateInput,
  },
  {
    id: 'studyDate',
    label: 'Дата',
    placeholder: 'дд.мм.гггг',
    inputMode: 'numeric',
    formatter: formatDateInput,
  },
  {
    id: 'studyTime',
    label: 'Время',
    placeholder: 'чч:мм',
    inputMode: 'numeric',
    formatter: formatTimeInput,
  },
  { id: 'department', label: 'Отделение', placeholder: 'Отделение' },
  { id: 'studyNumber', label: '№ исследования', placeholder: 'Номер', inputMode: 'text' },
  { id: 'dose', label: 'Доза в мЗв', placeholder: 'мЗв', inputMode: 'decimal' },
]

function PassportPanel({ data, onChange }: PassportPanelProps) {
  const updateField = (field: PassportField, value: string) => {
    onChange({
      [field.id]: field.formatter ? field.formatter(value) : value,
    })
  }

  return (
    <section className="passport-panel" aria-label="Паспортная часть">
      <div className="passport-grid">
        {passportFields.map((field) => (
          <label className="panel-field" key={field.id}>
            <span>{field.label}</span>
            <input
              value={data[field.id]}
              placeholder={field.placeholder}
              inputMode={field.inputMode}
              onChange={(event) => updateField(field, event.target.value)}
            />
          </label>
        ))}
      </div>
    </section>
  )
}

export default PassportPanel
