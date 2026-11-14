/*
  Dados de saúde do painel: junta os dados simulados com o último check-up salvo
  e calcula o estado de cada medida em relação à linha de base da pessoa.

  AS REGRAS SÃO DE DEMONSTRAÇÃO: não têm fonte clínica. Os limites ficam em
  data/simulated.json ("rule") para quem cuida de dados e regras ajustar sem mexer aqui.
*/
import simulated from '@/data/simulated.json'
import type { BodyRegion, Status, Vital, VitalId } from '@/types'
import { latestCheckIn } from '@/lib/storage'

type Direction = 'above' | 'below' | 'both'

export interface VitalConfig {
  id: VitalId
  label: string
  question: string
  fieldLabel: string
  unit: string
  decimals: number
  baseline: number
  baselineDiastolic?: number
  todayDiastolic?: number
  history: number[]
  rule: { direction: Direction; attention: number; flagged: number }
}

export const crew = simulated.crew
export const vitalConfigs = simulated.vitals as VitalConfig[]
export const behavioralQuestions = simulated.behavioral

const MINUS = '−' // sinal de menos tipográfico, como no design system

function fmt(n: number, decimals: number) {
  return n.toFixed(decimals).replace('-', MINUS)
}

function fmtDelta(n: number, decimals: number) {
  const rounded = Number(n.toFixed(decimals))
  if (rounded === 0) return fmt(0, decimals)
  return rounded > 0 ? `+${fmt(rounded, decimals)}` : fmt(rounded, decimals)
}

/** Aplica a regra de demonstração ao desvio em relação à linha de base. */
export function evaluate(delta: number, rule: VitalConfig['rule']): Status {
  const relevant =
    rule.direction === 'above' ? Math.max(delta, 0) : rule.direction === 'below' ? Math.max(-delta, 0) : Math.abs(delta)
  if (relevant >= rule.flagged) return 'flagged'
  if (relevant >= rule.attention) return 'attention'
  return 'baseline'
}

/** Texto da regra, mostrado ao lado de toda sinalização. */
export function ruleText(c: VitalConfig, status: Status) {
  const limit = status === 'flagged' ? c.rule.flagged : c.rule.attention
  const side = c.rule.direction === 'above' ? 'above' : c.rule.direction === 'below' ? 'below' : 'away from'
  return `Rule: ${fmt(limit, c.decimals)} ${c.unit} or more ${side} baseline today.`
}

function toVital(c: VitalConfig, today: number, history: number[], todayDiastolic?: number): Vital {
  const delta = today - c.baseline
  const status = evaluate(delta, c.rule)
  const isBP = c.id === 'bloodPressure'
  return {
    id: c.id,
    label: c.label,
    unit: c.unit,
    value: isBP ? `${fmt(today, 0)}/${fmt(todayDiastolic ?? c.todayDiastolic ?? 0, 0)}` : fmt(today, c.decimals),
    baseline: isBP ? `${c.baseline}/${c.baselineDiastolic}` : fmt(c.baseline, c.decimals),
    delta: fmtDelta(delta, c.decimals),
    status,
    history,
    baselineValue: c.baseline,
    rule: status === 'baseline' ? undefined : ruleText(c, status),
  }
}

/** Medidas de hoje: o último check-up salvo, ou os dados simulados se ainda não houver. */
export function getTodayVitals(): Vital[] {
  const saved = latestCheckIn()
  return vitalConfigs.map((c) => {
    const savedValue = saved?.vitals[c.id]
    if (savedValue == null) {
      return toVital(c, c.history[c.history.length - 1], c.history)
    }
    const history = [...c.history.slice(1), savedValue]
    return toVital(c, savedValue, history, saved?.vitals.bloodPressureDiastolic)
  })
}

const ORDER: Record<Status, number> = { baseline: 0, attention: 1, flagged: 2 }
const worst = (...s: Status[]) => s.reduce((a, b) => (ORDER[b] > ORDER[a] ? b : a), 'baseline' as Status)

const STATUS_TEXT: Record<Status, string> = {
  baseline: 'Within baseline',
  attention: 'Attention',
  flagged: 'Flagged for ground',
}

/** Liga as medidas às regiões da figura do corpo. */
export function getBodyRegions(vitals: Vital[]): BodyRegion[] {
  const v = Object.fromEntries(vitals.map((x) => [x.id, x])) as Record<VitalId, Vital>
  const cardio = worst(v.heartRate.status, v.bloodPressure.status)
  const cardioDetail = v.heartRate.status === cardio ? `${v.heartRate.delta} bpm` : `${v.bloodPressure.delta} mmHg`
  return [
    { id: 'head', name: 'Head · sleep', status: v.sleep.status, stateText: withDetail(v.sleep.status, `${v.sleep.delta} h`) },
    { id: 'chest', name: 'Chest · cardiovascular', status: cardio, stateText: withDetail(cardio, cardioDetail) },
    {
      id: 'core',
      name: 'Core · temperature',
      status: v.temperature.status,
      stateText: withDetail(v.temperature.status, `${v.temperature.delta} °C`),
    },
    { id: 'leftArm', status: 'baseline' },
    { id: 'rightArm', status: 'baseline' },
    { id: 'leftLeg', status: 'baseline' },
    { id: 'rightLeg', status: 'baseline' },
  ]
}

function withDetail(status: Status, detail: string) {
  return status === 'baseline' ? STATUS_TEXT.baseline : `${STATUS_TEXT[status]} · ${detail}`
}

export { STATUS_TEXT }
