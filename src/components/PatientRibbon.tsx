import type { OpenPatientWorkspace } from '../types/patient'

type PatientRibbonProps = {
  patients: OpenPatientWorkspace[]
  activePatientId: string | null
  onSelect: (patient: OpenPatientWorkspace) => void
  onClose: (patient: OpenPatientWorkspace) => void
  onCreate: () => void
}

const getPatientName = (patient: OpenPatientWorkspace) =>
  patient.passportData.fullName.trim() || 'Без имени'

function PatientRibbon({
  patients,
  activePatientId,
  onSelect,
  onClose,
  onCreate,
}: PatientRibbonProps) {
  return (
    <nav className="patient-ribbon" aria-label="Открытые пациенты">
      <div className="patient-capsule-list">
        {patients.map((patient) => (
          <div
            className={`patient-capsule${patient.id === activePatientId ? ' active-patient' : ''}`}
            key={patient.id}
          >
            <button
              type="button"
              className="patient-capsule-main"
              onClick={() => onSelect(patient)}
            >
              <span>{getPatientName(patient)}</span>
              <small>{patient.templateTitle}</small>
            </button>
            <button
              type="button"
              className="patient-capsule-close"
              aria-label={`Закрыть пациента ${getPatientName(patient)}`}
              onClick={() => onClose(patient)}
            >
              ×
            </button>
          </div>
        ))}

        <button
          type="button"
          className="patient-capsule patient-add-capsule"
          aria-label="Добавить пациента"
          onClick={onCreate}
        >
          +
        </button>
      </div>
    </nav>
  )
}

export default PatientRibbon
