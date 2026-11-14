/*
  Radiação acumulada na missão (plano v3, seção 7).

  A série de dosímetro é SIMULADA e identificada como tal. O limite de carreira da NASA (600 mSv de dose
  efetiva, NASA-STD-3001) tem fonte. O app NÃO converte clima espacial (DONKI) em dose, não estima risco
  de câncer e não dá ordem de proteção sem fonte.
*/
import simulated from '@/data/simulated.json'
import { crew, lastDayKeys } from '@/lib/health'

export const RADIATION = simulated.radiation

export interface RadiationSummary {
  unit: string
  /** Dose dos últimos 7 dias, do mais antigo para hoje. */
  daily: { day: string; dose: number }[]
  weekTotal: number
  missionTotal: number
  missionDay: number
  careerLimit: number
  /** Fração do limite de carreira usada nesta missão (0 a 1). */
  limitFraction: number
  source: string
  limitSource: { label: string; url: string }
}

const round1 = (n: number) => Math.round(n * 10) / 10

export function radiationSummary(today = new Date()): RadiationSummary {
  const days = lastDayKeys(RADIATION.daily.length, today)
  const daily = RADIATION.daily.map((dose, i) => ({ day: days[i], dose }))
  const weekTotal = RADIATION.daily.reduce((s, d) => s + d, 0)
  const missionTotal = round1(RADIATION.missionTotalBeforeWindow + weekTotal)
  return {
    unit: RADIATION.unit,
    daily,
    weekTotal: round1(weekTotal),
    missionTotal,
    missionDay: crew.missionDay,
    careerLimit: RADIATION.careerLimit,
    limitFraction: missionTotal / RADIATION.careerLimit,
    source: RADIATION.source,
    limitSource: RADIATION.careerLimitSource,
  }
}
