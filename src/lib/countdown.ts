import { useEffect, useState } from 'react'

/** Ticking clock so countdowns stay fresh without refetching. */
export function useNow(intervalMs = 30_000): number {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), intervalMs)
    return () => clearInterval(t)
  }, [intervalMs])
  return now
}

export function isLocked(kickoff: string | Date, now = Date.now()): boolean {
  return new Date(kickoff).getTime() <= now
}

/** Compact lock countdown: "2d 4h", "4h 12m", "12m 30s", "Closing…". */
export function formatCountdown(kickoff: string | Date, now = Date.now()): string {
  const ms = new Date(kickoff).getTime() - now
  if (ms <= 0) return 'Locked'
  const s = Math.floor(ms / 1000)
  const d = Math.floor(s / 86400)
  const h = Math.floor((s % 86400) / 3600)
  const m = Math.floor((s % 3600) / 60)
  if (d >= 1) return `${d}d ${h}h`
  if (h >= 1) return `${h}h ${m}m`
  if (m >= 1) return `${m}m ${s % 60}s`
  return 'Closing…'
}

export function dayLabel(kickoff: string | Date, now = Date.now()): string {
  const k = new Date(kickoff)
  const startOf = (d: Date) => {
    const c = new Date(d)
    c.setHours(0, 0, 0, 0)
    return c.getTime()
  }
  const diffDays = Math.round((startOf(k) - startOf(new Date(now))) / 864e5)
  const date = k.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' })
  if (diffDays <= 0) return `Today · ${date}`
  if (diffDays === 1) return `Tomorrow · ${date}`
  return date
}

export function dayKey(kickoff: string | Date): string {
  const k = new Date(kickoff)
  return `${k.getFullYear()}-${k.getMonth()}-${k.getDate()}`
}

/** Monday-based key so "first visit of the week" logic resets weekly. */
export function weekKey(now = new Date()): string {
  const d = new Date(now)
  const day = (d.getDay() + 6) % 7 // Monday = 0
  d.setDate(d.getDate() - day)
  d.setHours(0, 0, 0, 0)
  return `wk-${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
}
