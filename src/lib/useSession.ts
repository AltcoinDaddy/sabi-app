import { useCallback, useEffect, useState } from 'react'
import { getStoredPhone, POINTS_KEY } from './auth'

export const POINTS_EVENT = 'sabi:points-changed'

export function readLocalPoints(): number {
  if (typeof window === 'undefined') return 0
  const raw = window.localStorage.getItem(POINTS_KEY)
  const n = raw ? parseInt(raw, 10) : 0
  return Number.isFinite(n) ? n : 0
}

export function writeLocalPoints(n: number) {
  try {
    window.localStorage.setItem(POINTS_KEY, String(n))
  } catch {
    /* noop */
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(POINTS_EVENT, { detail: n }))
  }
}

export function useSessionPhone() {
  const [phone, setPhone] = useState<string | null>(null)
  useEffect(() => {
    setPhone(getStoredPhone())
    const onStorage = () => setPhone(getStoredPhone())
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])
  return phone
}

export function useSessionPoints(serverPoints?: number) {
  const [points, setPoints] = useState<number>(() => {
    const local = readLocalPoints()
    return typeof serverPoints === 'number' ? Math.max(local, serverPoints) : local
  })

  useEffect(() => {
    if (typeof serverPoints === 'number') {
      setPoints((prev) => {
        const next = Math.max(prev, serverPoints)
        try {
          window.localStorage.setItem(POINTS_KEY, String(next))
        } catch {
          /* noop */
        }
        return next
      })
    }
  }, [serverPoints])

  useEffect(() => {
    const onChange = (e: Event) => {
      const detail = (e as CustomEvent).detail
      if (typeof detail === 'number') setPoints(detail)
      else setPoints(readLocalPoints())
    }
    window.addEventListener(POINTS_EVENT, onChange)
    window.addEventListener('storage', onChange)
    return () => {
      window.removeEventListener(POINTS_EVENT, onChange)
      window.removeEventListener('storage', onChange)
    }
  }, [])

  const addPoints = useCallback((delta: number) => {
    setPoints((prev) => {
      const next = prev + delta
      writeLocalPoints(next)
      return next
    })
  }, [])

  return { points, addPoints, setPoints }
}
