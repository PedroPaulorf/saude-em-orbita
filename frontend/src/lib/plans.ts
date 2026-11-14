/*
  Plano de volta à linha de base ("Back-to-baseline plan", plano v3, seção 5).

  Guardado em localStorage ("health7:plans:v1") como lista de
  { id, patternId, startedDay, days, done: { "2026-11-14": ["sleep-period"] }, endedDay?, outcome? }.
  O dia do plano, o que falta hoje e os pontos são DERIVADOS dos registros, como em game.ts.

  O plano é só de ações de rotina, aparece como SUGERIDO e vai para o solo revisar.
  Pontos premiam cumprir o passo, nunca a medida melhorar.
*/
import { useSyncExternalStore } from 'react'
import { scopedStorageKey } from '@/lib/active-profile'
import { hasHealthAnswers, type CheckIn } from '@/lib/storage'
import { PATTERNS, type PatternDef, type PlanStepDef } from '@/lib/prevention'
import { utcDayKey, type WaterLog } from '@/lib/water'

const KEY = 'health7:plans:v1'

export type PlanOutcome = 'back-to-baseline' | 'signs-still-present' | 'ended-early'

export const SUGGESTED = 'Suggested plan · not reviewed by a flight surgeon'

export const OUTCOME_TEXT: Record<PlanOutcome, string> = {
  'back-to-baseline': 'Plan complete. Measures back within your baseline.',
  'signs-still-present': 'Plan complete. Signs still present. Flagged for your flight surgeon.',
  'ended-early': 'Plan ended early. Points you earned stay with you.',
}

export interface StoredPlan {
  id: string
  patternId: string
  startedDay: string
  days: number
  /** Passos manuais marcados, por dia UTC. */
  done: Record<string, string[]>
  /** Último dia do plano (fechado ou encerrado antes). */
  endedDay?: string
  outcome?: PlanOutcome
}

// ---------- armazenamento reativo ----------

const listeners = new Set<() => void>()
let cache: { key: string | null; raw: string | null; plans: StoredPlan[] } = { key: null, raw: null, plans: [] }

export function loadPlans(): StoredPlan[] {
  const key = scopedStorageKey(KEY)
  let raw: string | null = null
  try {
    raw = key ? localStorage.getItem(key) : null
  } catch {
    if (cache.key !== key) cache = { key, raw: null, plans: [] }
    return cache.plans
  }
  if (key === cache.key && raw === cache.raw) return cache.plans
  let plans: StoredPlan[] = []
  try {
    const parsed: unknown = raw ? JSON.parse(raw) : []
    if (Array.isArray(parsed)) plans = parsed as StoredPlan[]
  } catch {
    // dado corrompido: sem planos
  }
  cache = { key, raw, plans }
  return plans
}

export function savePlans(plans: StoredPlan[]) {
  const key = scopedStorageKey(KEY)
  if (!key) throw new Error('Sign in before saving a plan.')
  try {
    localStorage.setItem(key, JSON.stringify(plans))
  } catch {
    // sem espaço: segue sem salvar
  }
  listeners.forEach((l) => l())
}

function subscribe(cb: () => void) {
  listeners.add(cb)
  window.addEventListener('storage', cb)
  return () => {
    listeners.delete(cb)
    window.removeEventListener('storage', cb)
  }
}

export function usePlans(): StoredPlan[] {
  return useSyncExternalStore(subscribe, loadPlans, () => [])
}

// ---------- datas ----------

export function addDays(day: string, n: number) {
  const d = new Date(`${day}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

const daysBetween = (a: string, b: string) => Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86_400_000)

// ---------- derivações ----------

export interface PlanContext {
  checkIns: CheckIn[]
  water: WaterLog
  waterGoal: number
}

export const patternOf = (plan: StoredPlan): PatternDef | undefined => PATTERNS.find((p) => p.id === plan.patternId)

/** O passo está feito naquele dia? Automático pelos registros; manual pelo que a pessoa marcou. */
export function stepDone(step: PlanStepDef, plan: StoredPlan, day: string, ctx: PlanContext): boolean {
  if (step.type === 'manual') return (plan.done[day] ?? []).includes(step.id)
  if (step.rule === 'waterGoal') return (ctx.water[day] ?? 0) >= ctx.waterGoal
  if (step.rule === 'bothCheckUps') {
    const records = ctx.checkIns.filter((c) => c.sync !== 'rejected' && c.at.slice(0, 10) === day)
    return records.some(hasHealthAnswers) && records.some(c => Object.keys(c.behavioral ?? {}).length)
  }
  return false
}

export interface PlanDay {
  day: string
  index: number
  steps: { def: PlanStepDef; done: boolean }[]
  doneCount: number
  complete: boolean
  state: 'done' | 'missed' | 'today' | 'upcoming'
}

export interface PlanView {
  plan: StoredPlan
  pattern: PatternDef
  days: PlanDay[]
  /** Dia do plano hoje (1 a N); se acabou, o último. */
  dayNumber: number
  today?: PlanDay
  lastDay: string
  /** Fechou: último dia completo, último dia passou, ou encerrado antes. */
  finished: boolean
  /** Os passos do último dia foram todos feitos. */
  completed: boolean
}

export function viewPlan(plan: StoredPlan, ctx: PlanContext, todayKey = utcDayKey()): PlanView | null {
  const pattern = patternOf(plan)
  if (!pattern?.plan) return null
  const lastDay = addDays(plan.startedDay, plan.days - 1)
  const end = plan.endedDay ?? lastDay
  const days: PlanDay[] = Array.from({ length: plan.days }, (_, i) => {
    const day = addDays(plan.startedDay, i)
    const steps = pattern.plan!.steps.map((def) => ({ def, done: stepDone(def, plan, day, ctx) }))
    const doneCount = steps.filter((s) => s.done).length
    const complete = doneCount === steps.length
    const state: PlanDay['state'] =
      day > end ? 'upcoming' : day === todayKey ? 'today' : day < todayKey ? (complete ? 'done' : 'missed') : 'upcoming'
    return { day, index: i + 1, steps, doneCount, complete, state }
  })
  const completed = days[days.length - 1].complete
  const finished = !!plan.endedDay || todayKey > lastDay || completed
  const dayNumber = Math.min(plan.days, Math.max(1, daysBetween(plan.startedDay, todayKey) + 1))
  return { plan, pattern, days, dayNumber, today: days.find((d) => d.state === 'today'), lastDay, finished, completed }
}

/** O plano em andamento (só um por vez). */
export function activePlan(plans: StoredPlan[], ctx: PlanContext, todayKey = utcDayKey()): PlanView | null {
  for (const p of plans) {
    const v = viewPlan(p, ctx, todayKey)
    if (v && !v.finished) return v
  }
  return null
}

// ---------- pontos ----------

export interface PlanPointsDay {
  steps: number
  dayBonus: number
  completion: number
}

/**
 * Pontos de plano por dia UTC: 5 por passo manual marcado, 10 quando todos os passos do dia estão feitos,
 * 50 quando os passos do último dia ficam todos feitos. Passo automático não dá ponto extra
 * (o check-up e a água já pontuam na rotina).
 */
export function planPointsByDay(plans: StoredPlan[], ctx: PlanContext, points: { planStep: number; planDayComplete: number; planCompleted: number }) {
  const out = new Map<string, PlanPointsDay>()
  const add = (day: string, k: keyof PlanPointsDay, n: number) => {
    const cur = out.get(day) ?? { steps: 0, dayBonus: 0, completion: 0 }
    cur[k] += n
    out.set(day, cur)
  }
  for (const plan of plans) {
    const pattern = patternOf(plan)
    if (!pattern?.plan) continue
    const end = plan.endedDay ?? addDays(plan.startedDay, plan.days - 1)
    for (let i = 0; i < plan.days; i++) {
      const day = addDays(plan.startedDay, i)
      if (day > end) break
      const manual = new Set((plan.done[day] ?? []).filter((id) => pattern.plan!.steps.some((s) => s.id === id && s.type === 'manual')))
      if (manual.size) add(day, 'steps', manual.size * points.planStep)
      const complete = pattern.plan.steps.every((s) => stepDone(s, plan, day, ctx))
      if (complete) add(day, 'dayBonus', points.planDayComplete)
      if (complete && i === plan.days - 1) add(day, 'completion', points.planCompleted)
    }
  }
  return out
}

// ---------- ações ----------

const uid = () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`)

export function startPlan(patternId: string, todayKey = utcDayKey()) {
  const pattern = PATTERNS.find((p) => p.id === patternId)
  if (!pattern?.plan) return
  savePlans([...loadPlans(), { id: uid(), patternId, startedDay: todayKey, days: pattern.plan.days, done: {} }])
}

/** Marca ou desmarca um passo manual de hoje. Desmarcar tira os pontos dele. */
export function toggleStep(planId: string, stepId: string, todayKey = utcDayKey()) {
  savePlans(
    loadPlans().map((p) => {
      if (p.id !== planId) return p
      const list = new Set(p.done[todayKey] ?? [])
      if (list.has(stepId)) list.delete(stepId)
      else list.add(stepId)
      return { ...p, done: { ...p.done, [todayKey]: [...list] } }
    }),
  )
}

/** Fecha o plano guardando o resultado (encerrar antes não tira pontos já ganhos). */
export function closePlan(planId: string, outcome: PlanOutcome, endedDay: string) {
  savePlans(loadPlans().map((p) => (p.id === planId ? { ...p, endedDay, outcome } : p)))
}
