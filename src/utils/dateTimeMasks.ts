import type { PassportData } from '../types/passport'

const onlyDigits = (value: string, maxLength: number) =>
  value.replace(/\D/g, '').slice(0, maxLength)

const joinFilledParts = (parts: string[]) => parts.filter(Boolean).join('.')

const pad2 = (value: number) => String(value).padStart(2, '0')

export const formatDateInput = (value: string) => {
  const digits = onlyDigits(value, 8)
  return joinFilledParts([digits.slice(0, 2), digits.slice(2, 4), digits.slice(4, 8)])
}

export const formatTimeInput = (value: string) => {
  const digits = onlyDigits(value, 4)
  const hours = digits.slice(0, 2)
  const minutes = digits.slice(2, 4)

  return minutes ? `${hours}:${minutes}` : hours
}

export const formatCurrentDate = (date = new Date()) =>
  `${pad2(date.getDate())}.${pad2(date.getMonth() + 1)}.${date.getFullYear()}`

export const formatCurrentTime = (date = new Date()) =>
  `${pad2(date.getHours())}:${pad2(date.getMinutes())}`

export const createInitialPassportData = (): PassportData => {
  const now = new Date()

  return {
    fullName: '',
    birthDate: '',
    studyDate: formatCurrentDate(now),
    studyTime: formatCurrentTime(now),
    department: '',
    studyNumber: '',
    dose: '',
  }
}
