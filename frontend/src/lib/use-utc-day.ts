import { useEffect, useState } from 'react'
import { utcDayKey } from '@/lib/water'

/** Milissegundos até a próxima meia-noite UTC. */
export function msToNextUtcDay(now = new Date()) {
  return Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1) - now.getTime()
}

/**
 * O dia UTC de hoje ("2026-11-14"), que muda sozinho à meia-noite UTC.
 * Com o app aberto na virada, a rotina, os pontos e o plano passam para o dia novo sem recarregar.
 */
export function useUtcDayKey(): string {
  const [day, setDay] = useState(() => utcDayKey())
  useEffect(() => {
    // +1 s de folga para não cair um instante antes da virada.
    const timer = setTimeout(() => setDay(utcDayKey()), msToNextUtcDay() + 1000)
    return () => clearTimeout(timer)
  }, [day])
  return day
}
