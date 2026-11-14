/*
  Motor de monitoramento (plano do assistente, seção 7). A REGRA DECIDE, a IA explica.

  Compara cada medida com a linha de base da pessoa, dia após dia, e devolve um dos quatro estados
  da pesquisa NEXUS-Med (STABLE, WATCH, PERSISTENT CHANGE, ESCALATE), um score de 0 a 100 e os sinais
  que formaram os dois. O score é INTENSIDADE da mudança: nunca probabilidade, nunca porcentagem.
  O estado vem da regra (persistência e número de medidas fora), não do score.

  Função pura, sem React, no estilo de roadmap.ts e baselines.ts: roda no aparelho, sem conexão.

  Linhas de base (baselines.ts):
  - pré-voo: o valor do perfil;
  - em voo: mediana dos últimos 14 dias, a partir de 3, sem os dias em que AQUELA medida estava fora
    junto com outra medida ou com sintoma (uma mudança "em várias frentes"). Sem isso a mediana absorve
    a mudança enquanto ela dura e o motor a "esquece" no meio. Uma medida que se afasta sozinha, sem
    sintoma, é adaptação ao voo (a perda de massa, por exemplo) e entra. Uma mudança que dura a janela
    inteira (14 dias) vira a nova linha de base.
  Hoje contra a linha de base de referência (em voo, ou pré-voo enquanto não há 3 dias) conta para o
  estado; em voo contra pré-voo é adaptação ao voo e aparece só como contexto ("drift").

  REGRA DE DEMONSTRAÇÃO, valores ancorados em dados publicados de voo espacial. Sem fonte clínica.
*/
import { INFLIGHT_MIN_DAYS, INFLIGHT_WINDOW_DAYS, median } from '@/lib/baselines'
import { configForProfile, evaluate } from '@/lib/health'
import type { CognitiveResult } from '@/lib/cognitive'
import type { Profile, Symptom } from '@/lib/api'
import type { CheckInInput } from '@/lib/storage'
import type { Status, VitalId } from '@/types'

export const MONITOR_RULE_VERSION = 'health7-nexus-2026-11-14-v1'
export const MONITOR_NOTICE = 'Demonstration rule · values anchored in published spaceflight data'

export type MonitorState = 'STABLE' | 'WATCH' | 'PERSISTENT CHANGE' | 'ESCALATE'
export const STATES: MonitorState[] = ['STABLE', 'WATCH', 'PERSISTENT CHANGE', 'ESCALATE']

/** Guia de alertas da pesquisa (aba 05_Alert_Guide), sem reescrever. */
export const STATE_GUIDE: Record<MonitorState, { meaning: string; wording: string; action: string }> = {
  STABLE: { meaning: 'Within expected personal variability', wording: 'Measurements are within your expected personal range.', action: 'Continue routine monitoring.' },
  WATCH: { meaning: 'Meaningful change; may be adaptation or transient', wording: 'A change from your personal baseline was detected.', action: 'Repeat measurement; complete symptom check-in; review context.' },
  'PERSISTENT CHANGE': { meaning: 'Multivariable change that deserves review', wording: 'Several measurements are moving away from your personal baseline.', action: 'Repeat/confirm; reduce non-critical workload; open action card.' },
  ESCALATE: { meaning: 'Pattern or symptom requires medical review', wording: 'Current changes require medical evaluation.', action: 'Escalate to CMO / ground support according to mission protocol.' },
}
/** Texto fixo do protocolo em ESCALATE. Não passa pela IA. */
export const ESCALATE_PROTOCOL = 'Escalate to Crew Medical Officer / ground medical support according to mission protocol.'

/** As três cores do app para os quatro estados: WATCH e PERSISTENT CHANGE usam a de atenção. */
export const STATE_STATUS: Record<MonitorState, Status> = { STABLE: 'baseline', WATCH: 'attention', 'PERSISTENT CHANGE': 'attention', ESCALATE: 'flagged' }
export const STATE_LABEL: Record<MonitorState, string> = { STABLE: 'Stable', WATCH: 'Watch', 'PERSISTENT CHANGE': 'Persistent change', ESCALATE: 'Escalate' }
export const stateRank = (s: MonitorState) => STATES.indexOf(s)

export type MetricId = VitalId | 'urinations24h'
/** Medidas do motor. Altura fica fora: o alongamento da coluna em microgravidade é esperado. */
export const METRICS: MetricId[] = ['heartRate', 'bloodPressure', 'sleep', 'temperature', 'spo2', 'respiratoryRate', 'bodyMass', 'urinations24h']

export interface MetricRule { direction: 'above' | 'below' | 'both'; attention: number; flagged: number }
/** Limiar novo, de demonstração: micções em 24 h abaixo da linha de base. Os outros vêm de medical.ts. */
export const URINATIONS_RULE: MetricRule = { direction: 'below', attention: 2, flagged: 3 }
/** Testes cognitivos: pior que a própria mediana (reflexo 15% mais lento, ou 2 acertos a menos no Stroop). */
export const COGNITIVE_RULE = { reactionSlowerBy: 0.15, stroopFewerCorrect: 2 }
/** score = min(100, 8 × pontos das medidas + 6 × sintomas + 4 × dias de persistência). */
export const SCORE_WEIGHTS = { measurePoint: 8, symptom: 6, persistenceDay: 4 }
/** Dias 1 a 3 de voo: mudança é esperada; o estado não passa de WATCH, salvo red flag. */
export const ADAPTATION_DAYS = 3
/** Sintomas que, sozinhos, pedem revisão médica (lista de demonstração). */
export const RED_FLAG_SYMPTOMS = ['shortness-of-breath', 'chest-pain', 'neurologic-symptoms', 'visual-changes', 'fainting']
export const SEVERE_HEADACHE = 7

const LABEL: Record<MetricId, string> = {
  heartRate: 'Heart rate', bloodPressure: 'Blood pressure', sleep: 'Sleep', temperature: 'Temperature', spo2: 'Oxygen saturation',
  respiratoryRate: 'Respiratory rate', bodyMass: 'Body mass', urinations24h: 'Urinations',
}
const UNIT: Partial<Record<MetricId, string>> = { urinations24h: 'per day' }
const DECIMALS: Partial<Record<MetricId, number>> = { urinations24h: 0 }
const POINTS: Record<Status, number> = { baseline: 0, attention: 1, flagged: 2 }
const DAY_MS = 86400000

// ---------- tipos ----------

export interface EnvironmentRecord { at: string; temperatureC?: number; relativeHumidityPct?: number; co2Ppm?: number; radiationDoseMgyDay?: number }

export interface MonitorInput {
  profile: { missionDay: number; baseline: Partial<Record<MetricId, number>> }
  checkins: CheckInInput[]
  symptoms?: Symptom[]
  cognitive?: CognitiveResult[]
  environment?: EnvironmentRecord[]
  /** Dia avaliado (UTC). Padrão: agora. */
  today?: Date
}

export interface MonitorSignal {
  id: string
  kind: 'measure' | 'symptom' | 'cognitive' | 'red-flag' | 'drift'
  label: string
  status: Status
  /** "+11 bpm vs in-flight 70", "reported today, 4/10". */
  text: string
  metric?: MetricId
  side?: 'above' | 'below'
  /** Dias seguidos com o sinal, até hoje. */
  days: number
  /** Pontos no score (medidas: 1 atenção, 2 sinalizado). */
  points: number
}

export interface DayResult {
  date: string
  /** Dia da missão. */
  day: number
  state: MonitorState
  /** Intensidade de 0 a 100. Não é probabilidade. */
  score: number
  signals: MonitorSignal[]
  /** Medidas fora da linha de base hoje (inclui teste cognitivo). */
  measuresOff: number
  symptoms: { label: string; severity: number }[]
  redFlag: boolean
  adaptationWindow: boolean
  /** Há check-up neste dia? */
  observed: boolean
  /** Por que o estado é este, em frases curtas. */
  reasons: string[]
}

export interface MonitorResult extends DayResult {
  wording: string
  action: string
  meaning: string
  environment: { load: number; items: string[] } | null
  ruleVersion: string
  notice: string
  history: DayResult[]
}

// ---------- utilidades ----------

const dayKey = (ms: number) => new Date(ms).toISOString().slice(0, 10)
const keyMs = (key: string) => Date.parse(`${key}T00:00:00Z`)
const signed = (n: number, decimals: number) => `${n > 0 ? '+' : n < 0 ? '−' : '±'}${Math.abs(n).toFixed(decimals)}`

function rulesFor(profile: MonitorInput['profile']) {
  const configs = configForProfile(profile as Profile)
  const out = {} as Record<MetricId, { rule: MetricRule; unit: string; decimals: number }>
  for (const id of METRICS) {
    const c = configs.find((x) => x.id === id)
    out[id] = c ? { rule: c.rule, unit: c.unit, decimals: c.decimals } : { rule: URINATIONS_RULE, unit: UNIT[id] ?? '', decimals: DECIMALS[id] ?? 0 }
  }
  return out
}

function valueOf(record: CheckInInput, id: MetricId): number | undefined {
  const v = id === 'urinations24h' ? record.healthDetails?.urinations24h : record.vitals?.[id]
  return typeof v === 'number' && Number.isFinite(v) ? v : undefined
}

/** Sintomas relatados em cada dia: início e evolução de cada episódio (a resolução encerra). */
function symptomsByDay(symptoms: Symptom[]) {
  const map = new Map<string, Map<string, number>>()
  const put = (at: string, label: string, severity: number) => {
    const day = at.slice(0, 10)
    const list = map.get(day) ?? new Map<string, number>()
    list.set(label, Math.max(list.get(label) ?? 0, severity))
    map.set(day, list)
  }
  for (const s of symptoms) {
    const events = s.events?.length ? s.events : [{ at: s.at, type: 'start' as const, severity: s.severity }]
    if (!events.some((e) => e.type === 'start')) put(s.at, s.label, s.severity)
    for (const e of events) if (e.type !== 'resolution') put(e.at, s.label, e.severity ?? s.severity)
  }
  return map
}

function cognitiveSignal(results: CognitiveResult[], date: string): MonitorSignal | null {
  const sorted = [...results].sort((a, b) => a.at.localeCompare(b.at))
  const today = sorted.filter((r) => r.at.slice(0, 10) === date).at(-1)
  if (!today) return null
  const past = sorted.filter((r) => r.at.slice(0, 10) < date)
  const reactions = past.map((r) => r.reaction?.median).filter((x): x is number => Number.isFinite(x))
  const stroops = past.map((r) => r.stroop?.correct).filter((x): x is number => Number.isFinite(x))
  const parts: string[] = []
  if (today.reaction && reactions.length >= INFLIGHT_MIN_DAYS) {
    const base = median(reactions)
    if (today.reaction.median >= base * (1 + COGNITIVE_RULE.reactionSlowerBy)) parts.push(`reaction ${Math.round(today.reaction.median)} ms vs your median ${Math.round(base)} ms`)
  }
  if (today.stroop && stroops.length >= INFLIGHT_MIN_DAYS) {
    const base = median(stroops)
    if (today.stroop.correct <= base - COGNITIVE_RULE.stroopFewerCorrect) parts.push(`attention ${today.stroop.correct} correct vs your median ${base}`)
  }
  return parts.length ? { id: 'cognitive', kind: 'cognitive', label: 'Cognitive tests', status: 'attention', text: parts.join(' · '), days: 1, points: 1 } : null
}

/** Carga de ambiente, fórmula da planilha: 1 ponto por item fora. Contexto, não entra no score. */
export function environmentLoad(e: EnvironmentRecord) {
  const items: string[] = []
  if ((e.co2Ppm ?? 0) >= 3500) items.push(`Cabin CO₂ ${Math.round(e.co2Ppm!)} ppm`)
  if ((e.radiationDoseMgyDay ?? 0) >= 0.25) items.push(`Radiation ${e.radiationDoseMgyDay} mGy today`)
  if (e.temperatureC != null && (e.temperatureC < 21 || e.temperatureC > 27)) items.push(`Cabin temperature ${e.temperatureC.toFixed(1)} °C`)
  if (e.relativeHumidityPct != null && (e.relativeHumidityPct < 25 || e.relativeHumidityPct > 60)) items.push(`Cabin humidity ${Math.round(e.relativeHumidityPct)}%`)
  return { load: items.length, items }
}

// ---------- motor ----------

/** Um resultado por dia, do primeiro registro até hoje. Causal: cada dia só vê o passado. */
export function monitorSeries(input: MonitorInput): DayResult[] {
  const today = input.today ?? new Date()
  const todayKey = dayKey(today.getTime())
  const records = input.checkins.filter((r) => r.sync !== 'rejected' && r.at.slice(0, 10) <= todayKey).sort((a, b) => a.at.localeCompare(b.at))
  const symptoms = symptomsByDay((input.symptoms ?? []).filter((s) => s.at.slice(0, 10) <= todayKey))
  const firstKey = [records[0]?.at.slice(0, 10), ...symptoms.keys()].filter(Boolean).sort()[0]
  if (!firstKey) return []
  const rules = rulesFor(input.profile)

  // Último valor de cada dia por medida, e red flag do check-up.
  const values = new Map<string, Partial<Record<MetricId, number>>>()
  const redFlagDays = new Set<string>()
  for (const r of records) {
    const d = r.at.slice(0, 10)
    const row = values.get(d) ?? {}
    for (const id of METRICS) {
      const v = valueOf(r, id)
      if (v != null) row[id] = v
    }
    values.set(d, row)
    if (r.healthDetails?.redFlag === true) redFlagDays.add(d)
  }

  // Estado de cada medida por dia, com a linha de base em voo robusta.
  const stable = Object.fromEntries(METRICS.map((id) => [id, new Map<string, number>()])) as Record<MetricId, Map<string, number>>
  const inflightPrev = {} as Partial<Record<MetricId, number>>
  const offRun = Object.fromEntries(METRICS.map((id) => [id, 0])) as Record<MetricId, number>
  const results: DayResult[] = []
  let prevQualifies = false
  let changeRun = 0

  for (let ms = keyMs(firstKey); ms <= keyMs(todayKey); ms += DAY_MS) {
    const date = dayKey(ms)
    const day = input.profile.missionDay - Math.round((keyMs(todayKey) - ms) / DAY_MS)
    const row = values.get(date) ?? {}
    const windowKeys = Array.from({ length: INFLIGHT_WINDOW_DAYS }, (_, i) => dayKey(ms - (INFLIGHT_WINDOW_DAYS - i) * DAY_MS))
    const signals: MonitorSignal[] = []
    const off = {} as Partial<Record<MetricId, { status: Status; delta: number }>>

    for (const id of METRICS) {
      const { rule, unit, decimals } = rules[id]
      const preflight = input.profile.baseline[id]
      const stableVals = windowKeys.map((k) => stable[id].get(k)).filter((x): x is number => x != null)
      const allVals = windowKeys.map((k) => values.get(k)?.[id]).filter((x): x is number => x != null)
      const inflight = stableVals.length >= INFLIGHT_MIN_DAYS ? median(stableVals)
        : offRun[id] >= INFLIGHT_WINDOW_DAYS && allVals.length >= INFLIGHT_MIN_DAYS ? median(allVals) : inflightPrev[id]
      inflightPrev[id] = inflight
      const reference = inflight ?? (Number.isFinite(preflight) ? preflight : undefined)
      const value = row[id]
      if (inflight != null && preflight != null && Number.isFinite(preflight) && evaluate(inflight - preflight, rule) !== 'baseline') {
        signals.push({ id: `${id}-drift`, kind: 'drift', label: LABEL[id], status: 'attention', metric: id, side: inflight > preflight ? 'above' : 'below',
          text: `in flight ${signed(inflight - preflight, decimals)} ${unit} vs pre-flight`, days: 0, points: 0 })
      }
      if (value == null || reference == null) { if (value == null) offRun[id] = 0; continue }
      const delta = value - reference
      const status = evaluate(delta, rule)
      if (status === 'baseline') { offRun[id] = 0; continue }
      offRun[id]++
      off[id] = { status, delta }
      signals.push({ id, kind: 'measure', label: LABEL[id], status, metric: id, side: delta > 0 ? 'above' : 'below',
        text: `${signed(delta, decimals)} ${unit} vs ${inflight != null ? 'in-flight' : 'pre-flight'} ${reference.toFixed(decimals)}`.replace('  ', ' '),
        days: offRun[id], points: POINTS[status] })
    }

    const cognitive = date === todayKey ? cognitiveSignal(input.cognitive ?? [], date) : null
    if (cognitive) signals.push(cognitive)

    const reported = [...(symptoms.get(date) ?? new Map<string, number>())].map(([label, severity]) => ({ label, severity }))
    for (const s of reported) {
      const run = (() => { let n = 0; for (let k = ms; symptoms.get(dayKey(k))?.has(s.label); k -= DAY_MS) n++; return n })()
      signals.push({ id: `symptom-${s.label}`, kind: 'symptom', label: s.label.replace(/-/g, ' '), status: 'attention', text: `reported, ${s.severity}/10`, days: run, points: 0 })
    }

    // Red flag: resposta "sim" no check-up, sintoma de alerta, ou SpO₂ sinalizada com febre.
    const fever = off.temperature?.status === 'flagged' && off.temperature.delta > 0
    const labels = new Set(reported.map((s) => s.label))
    const redReasons: string[] = []
    if (redFlagDays.has(date)) redReasons.push('Red flag answered in the check-up')
    for (const l of RED_FLAG_SYMPTOMS) if (labels.has(l)) redReasons.push(`Alert symptom reported: ${l.replace(/-/g, ' ')}`)
    if (labels.has('flank-discomfort') && fever) redReasons.push('Flank discomfort with temperature well above baseline')
    if (reported.some((s) => s.label === 'headache' && s.severity >= SEVERE_HEADACHE)) redReasons.push('Severe headache reported')
    if (off.spo2?.status === 'flagged' && fever) redReasons.push('Oxygen saturation flagged with temperature well above baseline')
    const redFlag = redReasons.length > 0
    if (redFlag) signals.unshift({ id: 'red-flag', kind: 'red-flag', label: 'Red flag', status: 'flagged', text: redReasons.join(' · '), days: 1, points: 0 })

    const measuresOff = signals.filter((s) => s.kind === 'measure' || s.kind === 'cognitive').length
    const qualifies = measuresOff >= 2 || (measuresOff >= 1 && reported.length >= 1)
    // Entra na linha de base em voo: medida estável, ou fora sozinha, sem sintoma (adaptação ao voo,
    // como a perda de massa). Fica de fora só a medida fora num dia de mudança em várias frentes.
    for (const id of METRICS) if (row[id] != null && (!off[id] || !qualifies)) stable[id].set(date, row[id]!)
    const change = measuresOff >= 1 || reported.length >= 1
    changeRun = change ? changeRun + 1 : 0
    const adaptationWindow = day >= 1 && day <= ADAPTATION_DAYS
    const reasons: string[] = []
    let state: MonitorState
    if (redFlag) { state = 'ESCALATE'; reasons.push(...redReasons) }
    else if (qualifies && prevQualifies && !adaptationWindow) {
      state = 'PERSISTENT CHANGE'
      reasons.push(measuresOff >= 2 ? `${measuresOff} measures off your baseline for 2 days or more` : 'A measure off your baseline with symptoms, for 2 days or more')
    } else if (change) {
      state = 'WATCH'
      reasons.push(measuresOff ? `${measuresOff} ${measuresOff === 1 ? 'measure' : 'measures'} off your baseline today` : 'Symptom reported today')
      if (qualifies && prevQualifies && adaptationWindow) reasons.push(`Flight days 1 to ${ADAPTATION_DAYS}: changes are expected, the state stays at Watch`)
    } else { state = 'STABLE'; reasons.push(values.has(date) ? 'All measures within your baselines' : 'No check-up on this day') }
    prevQualifies = qualifies

    const points = signals.reduce((n, s) => n + s.points, 0)
    const persistence = change ? changeRun - 1 : 0
    const score = Math.min(100, Math.round(SCORE_WEIGHTS.measurePoint * points + SCORE_WEIGHTS.symptom * reported.length + SCORE_WEIGHTS.persistenceDay * persistence))
    const order = { 'red-flag': 0, measure: 1, cognitive: 2, symptom: 3, drift: 4 }
    signals.sort((a, b) => order[a.kind] - order[b.kind] || b.points - a.points || b.days - a.days)
    results.push({ date, day, state, score, signals, measuresOff, symptoms: reported, redFlag, adaptationWindow, observed: values.has(date), reasons })
  }
  return results
}

/** Resultado de hoje, com o texto da pesquisa para o estado. */
export function monitor(input: MonitorInput): MonitorResult {
  const today = input.today ?? new Date()
  const todayKey = dayKey(today.getTime())
  const history = monitorSeries(input)
  const last = history.at(-1)
  const current: DayResult = last?.date === todayKey ? last : {
    date: todayKey, day: input.profile.missionDay, state: 'STABLE', score: 0, signals: [], measuresOff: 0, symptoms: [], redFlag: false,
    adaptationWindow: input.profile.missionDay <= ADAPTATION_DAYS, observed: false, reasons: ['No check-up on this day'],
  }
  const env = (input.environment ?? []).filter((e) => e.at.slice(0, 10) === todayKey).sort((a, b) => a.at.localeCompare(b.at)).at(-1)
  const guide = STATE_GUIDE[current.state]
  return { ...current, ...guide, environment: env ? environmentLoad(env) : null, ruleVersion: MONITOR_RULE_VERSION, notice: MONITOR_NOTICE, history }
}

/** Os dois sinais principais, para notas e frases curtas ("Urinations −3 per day · Heart rate +7 bpm"). */
export function topSignals(result: Pick<DayResult, 'signals'>, n = 2) {
  return result.signals.filter((s) => s.kind !== 'drift').slice(0, n)
}
