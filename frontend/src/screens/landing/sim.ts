/*
  Simulação da landing page: um "dia" de check-up com dados inventados, calculado com as MESMAS
  funções e textos do app. Nada é salvo e nada sai do navegador.

  - Medidas e limiares: data/simulated.json (os mesmos do check-up).
  - Estado de cada medida: evaluate() e ruleText() de lib/health.
  - Regiões do corpo: getBodyRegions(). Cor de fundo: healthLevel().
  - Estado do dia: a regra do motor para um único dia (lib/monitor): com alguma medida fora é
    WATCH, sem nenhuma é STABLE. Persistent change e Escalate dependem de vários dias ou de
    sintomas de alerta, que a simulação não tem.
  - Passos: a biblioteca ADVICE de lib/roadmap.
*/
import simulated from '@/data/simulated.json'
import { evaluate, getBodyRegions, ruleText, type VitalConfig } from '@/lib/health'
import { STATE_GUIDE, type MonitorState } from '@/lib/monitor'
import { healthLevel, type HealthLevel } from '@/lib/present'
import { ADVICE, type RoadmapPhase } from '@/lib/roadmap'
import type { BodyRegion, BodyRegionId, Vital, VitalId } from '@/types'

const CONFIGS = simulated.vitals as VitalConfig[]
const config = (id: VitalId) => CONFIGS.find((c) => c.id === id)!

/** As duas perguntas da simulação. */
export const QUESTIONS = [
  { config: config('heartRate'), min: 30, max: 220, presets: [63, 71, 79] },
  { config: config('sleep'), min: 0, max: 16, presets: [7.4, 6, 4.8] },
] as const

export interface Answers {
  heartRate: number
  sleep: number
}

/** Medidas que na simulação "chegam sozinhas", todas perto da linha de base. */
const FIXED: Partial<Record<VitalId, number>> = { bloodPressure: 118, temperature: 36.7, spo2: 97, respiratoryRate: 15 }

const fmt = (n: number, decimals: number) => n.toFixed(decimals).replace('-', '−')

function vital(c: VitalConfig, value: number): Vital {
  const delta = Number((value - c.baseline).toFixed(c.decimals))
  const status = evaluate(delta, c.rule)
  const isBP = c.id === 'bloodPressure'
  return {
    id: c.id,
    label: c.label,
    unit: c.unit,
    observed: true,
    comparable: true,
    value: isBP ? `${fmt(value, 0)}/${c.todayDiastolic ?? '—'}` : fmt(value, c.decimals),
    baseline: isBP ? `${fmt(c.baseline, 0)}/${fmt(c.baselineDiastolic ?? Number.NaN, 0)}` : fmt(c.baseline, c.decimals),
    delta: `${delta > 0 ? '+' : ''}${fmt(delta, c.decimals)}`,
    status,
    baselineValue: c.baseline,
    rule: ruleText(c, status),
    input: c.input,
    provenance: { method: 'simulated-device', quality: 'simulated' },
  }
}

export interface Day {
  vitals: Vital[]
  regions: BodyRegion[]
  level: HealthLevel
  state: MonitorState
  wording: string
  reason: string
  phases: RoadmapPhase[]
}

export function simulate(a: Answers): Day {
  const value = (id: VitalId) => (id === 'heartRate' ? a.heartRate : id === 'sleep' ? a.sleep : FIXED[id])
  const vitals = CONFIGS.filter((c) => value(c.id) != null).map((c) => vital(c, value(c.id)!))
  const off = vitals.filter((v) => v.status !== 'baseline')
  const state: MonitorState = off.length ? 'WATCH' : 'STABLE'
  const phases: RoadmapPhase[] = [
    { id: 'today', title: 'Today', steps: [] },
    { id: 'next-days', title: 'Next 3 days', steps: [] },
    { id: 'week', title: 'This week', steps: [] },
  ]
  for (const v of off) {
    const c = config(v.id)
    const above = value(v.id)! > c.baseline
    const advice = ADVICE[`${v.id}:${above ? 'above' : 'below'}`]
    if (!advice) continue
    const why = `${v.label} ${v.value} ${v.unit} · pre-flight ${v.baseline} ${v.unit}`
    phases[0].steps.push({ id: `${v.id}-today`, kind: 'do', text: advice.today, why, param: v.id, risk: advice.risk, action: advice.action })
    phases[1].steps.push({ id: `${v.id}-next`, kind: 'do', text: advice.next, why, param: v.id, risk: advice.risk })
    phases[2].steps.push({ id: `${v.id}-week`, kind: 'do', text: advice.week, why, param: v.id, risk: advice.risk })
  }
  return {
    vitals,
    regions: getBodyRegions(vitals),
    level: healthLevel(vitals),
    state,
    wording: STATE_GUIDE[state].wording,
    reason: off.length ? `${off.length} ${off.length === 1 ? 'measure' : 'measures'} off your baseline today` : 'All measures within your baselines',
    phases,
  }
}

/** Cor de fundo da página no app conforme a saúde do dia (styles/theme.css, --stage). */
export const STAGE: Record<HealthLevel, string> = { calm: 'var(--ground)', watch: '#b52a00', alert: '#8e1100' }

/** Risco do programa de pesquisa humana da NASA ligado a cada região que a simulação acende. */
export const REGION_RISK: Partial<Record<BodyRegionId, string>> = {
  chest: 'cardiovascular-adaptations',
  head: 'inadequate-sleep-and-irregular-schedules',
}
