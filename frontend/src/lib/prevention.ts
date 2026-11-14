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
import type { WaterLog } from '@/lib/water'
import type { Status, Vital, VitalId } from '@/types'

export type Side = 'below' | 'above'

export type SignDef =
  | { id: string; type: 'measure'; measure: VitalId; side: Side; days: number; label: string }
  | { id: string; type: 'selfReport'; question: string; atMost?: number; atLeast?: number; label: string }
  | { id: string; type: 'water'; missedDays: number; label: string }

export interface PlanStepDef {
  id: string
  type: 'auto' | 'manual'
  /** Só para passos auto: o que marca o passo sozinho. */
  rule?: 'bothCheckUps' | 'waterGoal'
  label: string
}

export interface PatternDef {
  id: string
  title: string
  summary: string
  hrpRisk: string
  source: string | null
  minSigns: number
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
  measure?: VitalId
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
  let n = 0
  for (let i = hist.length - 1; i >= 0; i--) {
    const delta = hist[i] - cfg.baseline
    const onSide = side === 'below' ? delta < 0 : delta > 0
    if (!onSide || evaluate(delta, cfg.rule) === 'baseline') break
    n++
  }
  return n
}

function measureSign(def: Extract<SignDef, { type: 'measure' }>, vitals: Vital[]): SignResult {
  const v = vitals.find((x) => x.id === def.measure)
  const cfg = vitalConfigs.find((c) => c.id === def.measure)
  if (!v || !cfg) return { def, state: 'unknown' }
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
  }
}

export function evaluatePattern(def: PatternDef, input: PreventionInput): PatternResult {
  const signs = def.signs.map((s) => evaluateSign(s, input))
  const presentSigns = signs.filter((s) => s.state === 'present')
  const active = presentSigns.length >= def.minSigns
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
