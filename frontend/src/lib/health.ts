/*
  Dados de saúde do painel: junta os dados simulados com o último check-up salvo
  e calcula o estado de cada medida em relação à linha de base da pessoa.

  AS REGRAS SÃO DE DEMONSTRAÇÃO: não têm fonte clínica. Os limites ficam em
  data/simulated.json ("rule") para quem cuida de dados e regras ajustar sem mexer aqui.
*/
import simulated from '@/data/simulated.json'
import type { BodyRegion, Status, Vital, VitalId, VitalInput } from '@/types'
import { loadCheckIns, type HealthCheckIn } from '@/lib/storage'

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
  source: string
  input: VitalInput
}

export const crew = simulated.crew
export const vitalConfigs = simulated.vitals as VitalConfig[]
/** Só as medidas perguntadas no check-up; as de aparelho chegam sozinhas. */
export const manualVitalConfigs = vitalConfigs.filter((c) => c.input === 'manual')
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
    source: c.source,
    input: c.input,
  }
}

/** Os últimos `n` dias UTC (AAAA-MM-DD), terminando hoje. */
export function lastDayKeys(n = 7, today = new Date()) {
  return Array.from({ length: n }, (_, i) =>
    new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - (n - 1 - i))).toISOString().slice(0, 10),
  )
}

/** Último check-up de saúde salvo em cada dia UTC. */
function healthByDay(): Map<string, HealthCheckIn> {
  const map = new Map<string, HealthCheckIn>()
  for (const c of loadCheckIns()) if (c.kind === 'health') map.set(c.at.slice(0, 10), c)
  return map
}

/**
 * Medidas de hoje com o histórico dos últimos 7 dias UTC. Para cada dia: o valor do check-up de saúde
 * salvo naquele dia, se houver; senão, o valor simulado da mesma posição. O último dia é hoje.
 */
export function getTodayVitals(today = new Date()): Vital[] {
  const days = lastDayKeys(7, today)
  const byDay = healthByDay()
  return vitalConfigs.map((c) => {
    const offset = c.history.length - days.length
    const history = days.map((d, i) => byDay.get(d)?.vitals[c.id] ?? c.history[offset + i])
    const todaySaved = byDay.get(days[days.length - 1])
    return toVital(c, history[history.length - 1], history, todaySaved?.vitals.bloodPressureDiastolic)
  })
}

const ORDER: Record<Status, number> = { baseline: 0, attention: 1, flagged: 2 }
const worst = (...s: Status[]) => s.reduce((a, b) => (ORDER[b] > ORDER[a] ? b : a), 'baseline' as Status)

const STATUS_TEXT: Record<Status, string> = {
  baseline: 'Within baseline',
  attention: 'Attention',
  flagged: 'Flagged for ground',
}

/** Estado de um grupo de medidas: o pior entre elas, com o detalhe da medida que o define. */
function group(list: Vital[]) {
  const status = worst(...list.map((x) => x.status))
  const lead = list.find((x) => x.status === status) ?? list[0]
  return { status, stateText: withDetail(status, `${lead.delta} ${lead.unit}`) }
}

/** Liga as medidas às regiões da figura do corpo. Peito: coração e respiração; tronco: temperatura e massa. */
export function getBodyRegions(vitals: Vital[]): BodyRegion[] {
  const v = Object.fromEntries(vitals.map((x) => [x.id, x])) as Record<VitalId, Vital>
  return [
    { id: 'head', name: 'Head · sleep', ...group([v.sleep]) },
    { id: 'chest', name: 'Chest · heart and lungs', ...group([v.heartRate, v.bloodPressure, v.spo2, v.respiratoryRate]) },
    { id: 'core', name: 'Core · temperature and mass', ...group([v.temperature, v.bodyMass]) },
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
