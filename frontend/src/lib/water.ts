/*
  Registro de água: porções de 250 ml por dia UTC, em localStorage ("health7:water:v1"),
  no formato { "2026-11-14": 3 }. A meta diária é uma meta de demonstração (simulated.json → game).
*/
import { useSyncExternalStore } from 'react'
import simulated from '@/data/simulated.json'

const KEY = 'health7:water:v1'
export const WATER_GOAL = simulated.game.waterGoal
export const WATER_SERVING_ML = simulated.game.waterServingMl

export type WaterLog = Record<string, number>

/** Dia UTC no formato AAAA-MM-DD, como no resto do app. */
export const utcDayKey = (d = new Date()) => d.toISOString().slice(0, 10)

const listeners = new Set<() => void>()
let cache: { raw: string | null; log: WaterLog } = { raw: null, log: {} }

export function loadWater(): WaterLog {
  let raw: string | null = null
  try {
    raw = localStorage.getItem(KEY)
  } catch {
    return cache.log
  }
  if (raw === cache.raw) return cache.log // mesma referência: useSyncExternalStore não re-renderiza à toa
  let log: WaterLog = {}
  try {
    const parsed: unknown = raw ? JSON.parse(raw) : {}
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) log = parsed as WaterLog
  } catch {
    // dado corrompido: começa do zero
  }
  cache = { raw, log }
  return log
}

function save(log: WaterLog) {
  try {
    localStorage.setItem(KEY, JSON.stringify(log))
  } catch {
    // sem espaço ou bloqueado: segue sem salvar
  }
  listeners.forEach((l) => l())
}

/** Teto do registro (o dobro da meta), só para evitar toque acidental repetido. Pontos param na meta. */
export const WATER_MAX = WATER_GOAL * 2

/** Soma (ou tira, com delta negativo) porções de hoje, entre 0 e WATER_MAX. */
export function addWater(delta: number, day = utcDayKey()) {
  const log = loadWater()
  const next = Math.max(0, Math.min(WATER_MAX, (log[day] ?? 0) + delta))
  save({ ...log, [day]: next })
  return next
}

function subscribe(cb: () => void) {
  listeners.add(cb)
  window.addEventListener('storage', cb)
  return () => {
    listeners.delete(cb)
    window.removeEventListener('storage', cb)
  }
}

/** Registro inteiro, reativo. */
export function useWaterLog(): WaterLog {
  return useSyncExternalStore(subscribe, loadWater, () => ({}))
}
