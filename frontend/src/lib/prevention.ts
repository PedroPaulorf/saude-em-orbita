/*
  Padrões de sinais precoces (plano v3, seção 4). Funções puras, no estilo de game.ts.

  REGRAS DE DEMONSTRAÇÃO, sem fonte clínica (data/conditions.json). Um padrão NÃO é diagnóstico:
  a tela mostra quantos sinais estão presentes e qual regra gerou cada um, e o padrão vai para o
  relatório do cirurgião de voo. Continuam três estados: um padrão usa "attention" ou "flagged".

  Cada sinal tem três resultados: presente, ausente ou desconhecido (sem check-in hoje, sem registro de
  água no dia). Desconhecido não conta como presente.
*/
import conditions from '@/data/conditions.json'
import { evaluate, vitalConfigs, type VitalConfig } from '@/lib/health'
import type { DayResult, MetricId } from '@/lib/monitor'
import type { WaterLog } from '@/lib/water'
import type { Status, Vital } from '@/types'

export type Side = 'below' | 'above'

/** required: o padrão só fica ativo com este sinal presente (ex.: desconforto no flanco na C16). */
export type SignDef = { required?: boolean } & (
  | { id: string; type: 'measure'; measure: MetricId; side: Side; days: number; label: string }
  | { id: string; type: 'symptom'; labels: string[]; label: string }
  | { id: string; type: 'cognitive'; label: string }
  | { id: string; type: 'selfReport'; question: string; atMost?: number; atLeast?: number; label: string }
  | { id: string; type: 'water'; missedDays: number; label: string })

export interface PlanStepDef {
  id: string
  type: 'auto' | 'manual'
  /** Só para passos auto: o que marca o passo sozinho. */
  rule?: 'bothCheckUps' | 'waterGoal'
  label: string
}

export interface PatternDef {
  id: string
  /** O texto seguro da pesquisa, inteiro (nunca o nome da condição sozinho). */
  title: string
  safeWording?: string
  /** Nome da condição na pesquisa; uso interno, não aparece sozinho na tela. */
  condition?: string
  summary: string
  hrpRisk: string
  source: string | null
  minSigns: number
  /** Só vale até este dia de voo (enjoo do início do voo). */
  missionDayMax?: number
  signs: SignDef[]
  plan: { days: number; stepsSource: string; steps: PlanStepDef[] } | null
}

export const PATTERNS = conditions.patterns as PatternDef[]

export type SignState = 'present' | 'absent' | 'unknown'

export interface SignResult {
  def: SignDef
  state: SignState
  /** Estado da medida hoje (sinal de medida), ou "attention" para autorrelato e água presentes. */
  status?: Status
  /** Texto com valor e regra: "Sleep 5.1 h · 2.1 h below baseline · 4 days". */
  detail?: string
  /** Medida ligada (para levar à região no Detailed stats). */
  measure?: MetricId
}

export interface PatternResult {
  def: PatternDef
  signs: SignResult[]
  present: number
  total: number
  active: boolean
  /** Pior estado entre os sinais presentes; "baseline" quando inativo. */
  status: Status
}

export interface PreventionInput {
  vitals: Vital[]
  /** Respostas do check-in comportamental de HOJE, ou null se ainda não houve. */
  behavioralToday: Record<string, number> | null
  water: WaterLog
  waterGoal: number
  /** Dias UTC (AAAA-MM-DD) dos últimos 7 dias, terminando hoje; mesma ordem de Vital.history. */
  days: string[]
}

const ORDER: Record<Status, number> = { baseline: 0, attention: 1, flagged: 2 }
const worst = (list: Status[]) => list.reduce<Status>((a, b) => (ORDER[b] > ORDER[a] ? b : a), 'baseline')

const MINUS = '−'
const num = (n: number, decimals: number) => n.toFixed(decimals).replace('-', MINUS)

/** Quantos dias seguidos, até hoje, a medida está fora da linha de base daquele lado. */
export function runLength(v: Vital, cfg: VitalConfig, side: Side): number {
  const hist = v.history ?? []
  if (!v.observed || !Number.isFinite(v.baselineValue)) return 0
  let n = 0
  for (let i = hist.length - 1; i >= 0; i--) {
    if (v.historyDays && i < hist.length - 1 && Date.parse(v.historyDays[i + 1]) - Date.parse(v.historyDays[i]) !== 86400000) break
    const delta = hist[i] - v.baselineValue!
    const onSide = side === 'below' ? delta < 0 : delta > 0
    if (!onSide || evaluate(delta, cfg.rule) === 'baseline') break
    n++
  }
  return n
}

function measureSign(def: Extract<SignDef, { type: 'measure' }>, vitals: Vital[]): SignResult {
  if (def.measure === 'urinations24h') return { def, state: 'unknown', detail: 'Counted by the monitor only' }
  const v = vitals.find((x) => x.id === def.measure)
  const cfg = vitalConfigs.find((c) => c.id === def.measure)
  if (!v || !cfg || !v.observed || !Number.isFinite(v.baselineValue)) return { def, state: 'unknown', detail: 'No measurement today' }
  const run = runLength(v, cfg, def.side)
  const today = (v.history ?? [])[(v.history?.length ?? 1) - 1] ?? cfg.baseline
  const gap = Math.abs(today - cfg.baseline)
  const parts = [`${v.label} ${v.value} ${v.unit}`]
  if (run > 0) {
    parts.push(`${num(gap, cfg.decimals)} ${v.unit} ${def.side} baseline`)
    if (run > 1) parts.push(`${run} days`)
  } else {
    parts.push('within baseline')
  }
  const present = run >= def.days
  return { def, state: present ? 'present' : 'absent', status: present ? v.status : undefined, detail: parts.join(' · '), measure: v.id }
}

function selfReportSign(def: Extract<SignDef, { type: 'selfReport' }>, today: Record<string, number> | null): SignResult {
  const answer = today?.[def.question]
  if (answer == null) return { def, state: 'unknown', detail: 'No data today' }
  const present = (def.atMost != null && answer <= def.atMost) || (def.atLeast != null && answer >= def.atLeast)
  return { def, state: present ? 'present' : 'absent', status: present ? 'attention' : undefined, detail: `You answered ${answer} of 5 today` }
}

function waterSign(def: Extract<SignDef, { type: 'water' }>, input: PreventionInput): SignResult {
  // Dias completos: os anteriores a hoje.
  const complete = input.days.slice(0, -1).slice(-def.missedDays)
  if (complete.some((d) => input.water[d] == null)) return { def, state: 'unknown', detail: 'No water log on those days' }
  const counts = complete.map((d) => input.water[d] ?? 0)
  const present = counts.every((n) => n < input.waterGoal)
  return {
    def,
    state: present ? 'present' : 'absent',
    status: present ? 'attention' : undefined,
    detail: `${counts.join(' and ')} of ${input.waterGoal} servings`,
  }
}

export function evaluateSign(def: SignDef, input: PreventionInput): SignResult {
  switch (def.type) {
    case 'measure':
      return measureSign(def, input.vitals)
    case 'selfReport':
      return selfReportSign(def, input.behavioralToday)
    case 'water':
      return waterSign(def, input)
    default:
      return { def, state: 'unknown', detail: 'Evaluated by the monitor' }
  }
}

export function evaluatePattern(def: PatternDef, input: PreventionInput, day?: number): PatternResult {
  return resultOf(def, def.signs.map((s) => evaluateSign(s, input)), day)
}

function resultOf(def: PatternDef, signs: SignResult[], day?: number): PatternResult {
  const presentSigns = signs.filter((s) => s.state === 'present')
  const active = presentSigns.length >= def.minSigns
    && signs.every((s) => !s.def.required || s.state === 'present')
    && (def.missionDayMax == null || day == null || day <= def.missionDayMax)
  return {
    def,
    signs,
    present: presentSigns.length,
    total: signs.length,
    active,
    status: active ? worst(presentSigns.map((s) => s.status ?? 'attention')) : 'baseline',
  }
}

/** Todos os padrões, ativos primeiro (sinalizados antes de atenção), depois por sinais presentes. */
export function evaluatePatterns(input: PreventionInput, patterns: PatternDef[] = PATTERNS): PatternResult[] {
  return patterns
    .map((p) => evaluatePattern(p, input))
    .sort((a, b) => Number(b.active) - Number(a.active) || ORDER[b.status] - ORDER[a.status] || b.present - a.present)
}

// ---------- padrões a partir do motor de monitoramento (monitor.ts) ----------

/**
 * Sinal de um padrão pelos sinais do motor: a medida conta contra a linha de base que o motor usa
 * (em voo, ou pré-voo nos primeiros dias), pelo lado e pelo número de dias pedidos.
 */
function monitorSign(def: SignDef, today: DayResult): SignResult {
  switch (def.type) {
    case 'measure': {
      if (!today.observed) return { def, state: 'unknown', detail: 'No measurement today' }
      const s = today.signals.find((x) => x.kind === 'measure' && x.metric === def.measure && x.side === def.side)
      const present = !!s && s.days >= def.days
      return { def, state: present ? 'present' : 'absent', status: present ? s!.status : undefined, measure: def.measure,
        detail: s ? `${s.label} ${s.text}${s.days > 1 ? ` · ${s.days} days` : ''}` : 'within baseline' }
    }
    case 'symptom': {
      const s = today.symptoms.filter((x) => def.labels.includes(x.label))
      return s.length
        ? { def, state: 'present', status: 'attention', detail: s.map((x) => `${x.label.replace(/-/g, ' ')} ${x.severity}/10`).join(', ') }
        : { def, state: 'absent', detail: 'not reported today' }
    }
    case 'cognitive': {
      if (!today.cognitiveTested) return { def, state: 'unknown', detail: 'No test today' }
      const s = today.signals.find((x) => x.kind === 'cognitive')
      return s ? { def, state: 'present', status: 'attention', detail: s.text } : { def, state: 'absent', detail: 'within your median' }
    }
    default:
      return { def, state: 'unknown', detail: 'No data today' }
  }
}

/** As condições da pesquisa avaliadas no dia do motor. Um padrão nunca muda o estado. */
export function patternsFromMonitor(today: DayResult, patterns: PatternDef[] = PATTERNS): PatternResult[] {
  return patterns
    .map((p) => resultOf(p, p.signs.map((s) => monitorSign(s, today)), today.day))
    .sort((a, b) => Number(b.active) - Number(a.active) || ORDER[b.status] - ORDER[a.status] || b.present - a.present)
}

