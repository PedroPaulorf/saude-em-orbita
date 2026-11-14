/*
  Cenários de demonstração (plano v3, seção 8): gravam no localStorage os registros de um dia da
  história, para gravar o vídeo em minutos. Dados FICTÍCIOS; datas relativas a hoje.
  Os valores ficam em data/conditions.json ("demo").
*/
import conditions from '@/data/conditions.json'
import { addDays, type StoredPlan } from '@/lib/plans'
import { PATTERNS } from '@/lib/prevention'
import { normalizeCheckIn, saveCheckIn, type CheckIn, type CheckInInput } from '@/lib/storage'
import { getActiveCrewId, scopedStorageKey } from '@/lib/active-profile'
import { utcDayKey, type WaterLog } from '@/lib/water'

interface Scenario {
  id: string
  title: string
  description: string
  plan?: { pattern: string; startedDaysAgo: number }
  health?: Record<string, number>[]
  /** Relato de urina e fezes no check-up de hoje. */
  healthDetailsToday?: { urine?: string; stool?: string }
  previousDays?: { behavioral: Record<string, number>; water: number; allManualSteps: boolean }
  today?: { behavioral: Record<string, number> | null }
}

export const DEMO = conditions.demo as { healthDefaults: Record<string, number>; scenarios: Scenario[] }
export const SCENARIOS = DEMO.scenarios

const KEYS = { water: 'health7:water:v2', plans: 'health7:plans:v1' }

export interface ScenarioData {
  checkIns: CheckIn[]
  water: WaterLog
  plans: StoredPlan[]
}

/** Registros do cenário, montados para "hoje" (pura, para testar). */
export function buildScenario(id: string, now = new Date()): ScenarioData {
  const s = SCENARIOS.find((x) => x.id === id)
  if (!s || !s.health) return { checkIns: [], water: {}, plans: [] }
  const today = utcDayKey(now)
  const n = s.health.length
  const checkIns: CheckInInput[] = []
  const water: WaterLog = {}
  const at = (day: string, hour: string) => (day === today ? now.toISOString() : `${day}T${hour}:00.000Z`)

  s.health.forEach((h, i) => {
    const day = addDays(today, i - (n - 1))
    checkIns.push({ kind: 'health', at: at(day, '07:30'), vitals: { ...DEMO.healthDefaults, ...h }, ...(day === today && s.healthDetailsToday ? { healthDetails: s.healthDetailsToday } : {}) })
    if (day !== today && s.previousDays) {
      checkIns.push({ kind: 'behavioral', at: at(day, '07:40'), behavioral: s.previousDays.behavioral })
      water[day] = s.previousDays.water
    }
  })
  if (s.today?.behavioral) checkIns.push({ kind: 'behavioral', at: now.toISOString(), behavioral: s.today.behavioral })
  checkIns.sort((a, b) => a.at.localeCompare(b.at))

  const plans: StoredPlan[] = []
  if (s.plan) {
    const pattern = PATTERNS.find((p) => p.id === s.plan!.pattern)
    const startedDay = addDays(today, -s.plan.startedDaysAgo)
    const manual = pattern?.plan?.steps.filter((x) => x.type === 'manual').map((x) => x.id) ?? []
    const done: Record<string, string[]> = {}
    if (s.previousDays?.allManualSteps) for (let i = 0; i < s.plan.startedDaysAgo; i++) done[addDays(startedDay, i)] = [...manual]
    plans.push({ id: `demo-${s.id}`, patternId: s.plan.pattern, startedDay, days: pattern?.plan?.days ?? 5, done })
  }
  return { checkIns: checkIns.map(normalizeCheckIn), water, plans }
}

/** Grava o cenário no navegador (substitui check-ups, água e planos). A tela recarrega depois. */
export function applyScenario(id: string) {
  const owner = getActiveCrewId()
  if (!owner) throw new Error('Sign in before loading a scenario.')
  const data = buildScenario(id)
  data.checkIns.forEach(record => saveCheckIn(owner, record))
  localStorage.setItem(scopedStorageKey(KEYS.water, owner)!, JSON.stringify(data.water))
  localStorage.setItem(scopedStorageKey(KEYS.plans, owner)!, JSON.stringify(data.plans))
}
