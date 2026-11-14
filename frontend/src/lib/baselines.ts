/*
  As duas linhas de base de cada medida (plano v3, roteiro preventivo):

  - Pré-voo: valor do perfil, medido antes do lançamento (Profile.baseline).
  - Em voo: mediana dos check-ups dos últimos 14 dias de missão, sem contar hoje.
    Só existe com 3 dias ou mais; antes disso a tela diz "building".

  Comparar hoje com as duas separa o que é adaptação ao voo (em voo longe do pré-voo, devagar)
  do que é mudança de agora (hoje longe do em voo). Funções puras, sem React.
*/
import { configForProfile, lastDayKeys, type VitalConfig } from '@/lib/health'
import type { Profile } from '@/lib/api'
import type { CheckInInput } from '@/lib/storage'
import type { VitalId } from '@/types'

export const INFLIGHT_WINDOW_DAYS = 14
export const INFLIGHT_MIN_DAYS = 3

/** Os sete parâmetros do check-up, na ordem da tela. "elimination" é urina e fezes, em relato. */
export const CHECKUP_VITALS: VitalId[] = ['bloodPressure', 'heartRate', 'spo2', 'temperature', 'respiratoryRate', 'sleep']
export type ParamId = VitalId | 'elimination'
export const PARAMS: ParamId[] = [...CHECKUP_VITALS, 'elimination']

export interface BaselinePair {
  id: VitalId
  label: string
  unit: string
  decimals: number
  /** Valor de hoje (sistólica, na pressão). */
  today?: number
  todayText?: string
  preflight?: number
  inflight?: number
  /** Dias com medida dentro da janela do em voo. */
  inflightDays: number
  config: VitalConfig
}

export const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b)
  const m = Math.floor(s.length / 2)
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2
}

/** Último valor de cada dia UTC para uma medida (registros rejeitados ficam de fora). */
function byDay(records: CheckInInput[], id: VitalId) {
  const map = new Map<string, CheckInInput>()
  records
    .filter((r) => r.sync !== 'rejected' && Number.isFinite(r.vitals?.[id]))
    .sort((a, b) => a.at.localeCompare(b.at))
    .forEach((r) => map.set(r.at.slice(0, 10), r))
  return map
}

export function baselinePairs(profile: Profile, records: CheckInInput[], today = new Date()): BaselinePair[] {
  const configs = configForProfile(profile)
  const window = lastDayKeys(INFLIGHT_WINDOW_DAYS + 1, today)
  const todayKey = window.at(-1)!
  const past = new Set(window.slice(0, -1))
  return CHECKUP_VITALS.map((id) => {
    const c = configs.find((x) => x.id === id)!
    const days = byDay(records, id)
    const values = [...days.entries()].filter(([d]) => past.has(d)).map(([, r]) => r.vitals![id]!)
    const todayRecord = days.get(todayKey)
    const value = todayRecord?.vitals?.[id]
    const fmt = (n: number) => n.toFixed(c.decimals)
    return {
      id,
      label: c.label,
      unit: c.unit,
      decimals: c.decimals,
      today: value,
      todayText:
        value == null ? undefined : id === 'bloodPressure' ? `${fmt(value)}/${todayRecord?.vitals?.bloodPressureDiastolic ?? '—'}` : fmt(value),
      preflight: Number.isFinite(c.baseline) ? c.baseline : undefined,
      inflight: values.length >= INFLIGHT_MIN_DAYS ? median(values) : undefined,
      inflightDays: values.length,
      config: c,
    }
  })
}

/** Último relato de urina e fezes de hoje. */
export function eliminationToday(records: CheckInInput[], today = new Date()) {
  const key = today.toISOString().slice(0, 10)
  const r = records.filter((x) => x.sync !== 'rejected' && x.at.slice(0, 10) === key && x.healthDetails).at(-1)
  return { urine: r?.healthDetails?.urine, stool: r?.healthDetails?.stool }
}

export const fmtNum = (n: number | undefined, decimals: number) => (n == null ? '—' : n.toFixed(decimals))
export const fmtDelta = (n: number, decimals: number) => `${n > 0 ? '+' : n < 0 ? '−' : '±'}${Math.abs(n).toFixed(decimals)}`
