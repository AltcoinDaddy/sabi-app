export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

export function validEmail(email: unknown): email is string {
  return typeof email === 'string' && email.includes('@')
}

export const needEmail = (email: unknown) => {
  if (!validEmail(email)) throw new Error('email required')
  return normalizeEmail(email)
}

// ISO Week Helper (e.g. 2026-W41)
export function getCurrentIsoWeek() {
  const d = new Date()
  d.setUTCHours(0, 0, 0, 0)
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7))
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
  return `${d.getUTCFullYear()}-W${weekNo}`
}

export function getCurrentSeason() {
  return new Date().getUTCFullYear().toString()
}

export function getNextIsoWeek() {
  const d = new Date()
  d.setUTCHours(0, 0, 0, 0)
  d.setUTCDate(d.getUTCDate() + 7) // Add 7 days
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7))
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
  return `${d.getUTCFullYear()}-W${weekNo}`
}
