/*
  Bateria psicotécnica do check-in comportamental: reflexo (luzes de largada), memória (grade 4×4)
  e atenção (Stroop). Guardada NESTE APARELHO, por tripulante ("health7:cognitive:v1"), como a água e
  os planos: o contrato do servidor só aceita humor, estresse e descanso.

  Cada resultado é comparado só com a própria pessoa (mediana das sessões anteriores, a partir de 3).
  Não é diagnóstico: latência do navegador e efeito de prática mudam os números.
*/
import { useSyncExternalStore } from 'react'
import { scopedStorageKey, subscribeActiveProfile } from '@/lib/active-profile'

const KEY = 'health7:cognitive:v1'
export const BASELINE_MIN_SESSIONS = 3

export interface CognitiveResult {
  at: string
  /** Tempos de reação válidos, em ms (largadas queimadas ficam de fora). */
  reaction?: { trials: number[]; median: number; jumpStarts: number }
  /** Memória: rodadas com quantos números e se acertou a ordem toda. */
  memory?: { rounds: { n: number; correct: boolean }[]; span: number }
  /** Atenção (Stroop): acertos e tempo médio das respostas certas. */
  stroop?: { correct: number; total: number; meanMs: number }
}

export const median = (xs: number[]) => {
  if (!xs.length) return NaN
  const s = [...xs].sort((a, b) => a - b)
  const m = Math.floor(s.length / 2)
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2
}

// ---------- armazenamento reativo ----------

const listeners = new Set<() => void>()
let cache: { key: string | null; raw: string | null; list: CognitiveResult[] } = { key: null, raw: null, list: [] }
subscribeActiveProfile(() => listeners.forEach((l) => l()))

export function loadCognitive(): CognitiveResult[] {
  const key = scopedStorageKey(KEY)
  let raw: string | null = null
  try {
    raw = key ? localStorage.getItem(key) : null
  } catch {
    return cache.list
  }
  if (key === cache.key && raw === cache.raw) return cache.list
  let list: CognitiveResult[] = []
  try {
    const parsed: unknown = raw ? JSON.parse(raw) : []
    if (Array.isArray(parsed)) list = parsed.filter((r) => r && typeof r.at === 'string')
  } catch {
    list = []
  }
  cache = { key, raw, list }
  return list
}

export function saveCognitive(result: CognitiveResult) {
  const key = scopedStorageKey(KEY)
  if (!key) throw new Error('Sign in before saving the tests.')
  try {
    localStorage.setItem(key, JSON.stringify([...loadCognitive(), result].slice(-60)))
  } catch {
    throw new Error('Could not save the tests on this device. Free storage, then try again.')
  }
  listeners.forEach((l) => l())
}

export function useCognitive(): CognitiveResult[] {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
    loadCognitive,
    () => [],
  )
}

// ---------- comparação com a própria pessoa ----------

export interface PersonalCompare {
  value: number
  /** Mediana das sessões anteriores; undefined antes de 3 sessões. */
  baseline?: number
  sessions: number
}

/** Reflexo de hoje contra a mediana das sessões anteriores. */
export function compareReaction(history: CognitiveResult[], today: number): PersonalCompare {
  const past = history.map((r) => r.reaction?.median).filter((x): x is number => Number.isFinite(x))
  return { value: today, sessions: past.length, baseline: past.length >= BASELINE_MIN_SESSIONS ? median(past) : undefined }
}

/** Embaralha uma cópia (Fisher–Yates). */
export function shuffle<T>(xs: T[], rand = Math.random): T[] {
  const a = [...xs]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
