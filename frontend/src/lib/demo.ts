/*
  Cenários de demonstração (plano v3, seção 8): gravam no localStorage os registros de um dia da
  história, para gravar o vídeo em minutos. Dados FICTÍCIOS; datas relativas a hoje.
  Os valores ficam em data/conditions.json ("demo").
*/
import conditions from '@/data/conditions.json'
import { addDays, type StoredPlan } from '@/lib/plans'
import { PATTERNS } from '@/lib/prevention'
import type { CheckIn } from '@/lib/storage'
import { utcDayKey, type WaterLog } from '@/lib/water'

interface Scenario {
  id: string
  title: string
  description: string
  plan?: { pattern: string; startedDaysAgo: number }
  health?: { sleep: number; heartRate: number }[]
  previousDays?: { behavioral: Record<string, number>; water: number; allManualSteps: boolean }
  today?: { behavioral: Record<string, number> | null }
}

export const DEMO = conditions.demo as { healthDefaults: Record<string, number>; scenarios: Scenario[] }
export const SCENARIOS = DEMO.scenarios

const KEYS = { checkIns: 'health7:checkins:v2', water: 'health7:water:v1', plans: 'health7:plans:v1' }

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
  const checkIns: CheckIn[] = []
  const water: WaterLog = {}
  const at = (day: string, hour: string) => (day === today ? now.toISOString() : `${day}T${hour}:00.000Z`)

  s.health.forEach((h, i) => {
    const day = addDays(today, i - (n - 1))
    checkIns.push({ kind: 'health', at: at(day, '07:30'), vitals: { ...DEMO.healthDefaults, ...h } })
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
  return { checkIns, water, plans }
}

/** Grava o cenário no navegador (substitui check-ups, água e planos). A tela recarrega depois. */
export function applyScenario(id: string) {
  const data = buildScenario(id)
  try {
    localStorage.setItem(KEYS.checkIns, JSON.stringify(data.checkIns))
    localStorage.setItem(KEYS.water, JSON.stringify(data.water))
    localStorage.setItem(KEYS.plans, JSON.stringify(data.plans))
  } catch {
    // sem localStorage: nada a fazer
  }
}
