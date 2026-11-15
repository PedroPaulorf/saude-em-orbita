/*
  Roteiro preventivo ("Preventive roadmap").

  Junta os sete parâmetros do check-up com as duas linhas de base (pré-voo e em voo, lib/baselines.ts),
  o relato de urina e fezes, o check-in comportamental, os padrões de sinais precoces e o clima espacial,
  e devolve passos de rotina em três horizontes: hoje, próximos 3 dias e esta semana.

  Dois motores, a mesma saída:
  - IA: com VITE_N8N_ROADMAP_WEBHOOK_URL, o contexto vai para o fluxo do n8n, que devolve o roteiro em JSON.
  - No aparelho: sem webhook, sem conexão ou com resposta inválida, as regras abaixo montam o roteiro.

  Em qualquer motor: SUGESTÃO, não diagnóstico. Cada passo diz o porquê com os números, o que é sinalizado
  vai para o cirurgião de voo, e as regras são de demonstração, sem fonte clínica.
*/
import { useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import { scopedStorageKey } from '@/lib/active-profile'
import { aiFailureMessage } from './ai-error'
import { baselinePairs, eliminationToday, fmtDelta, fmtNum, type BaselinePair, type ParamId } from '@/lib/baselines'
import { evaluate } from '@/lib/health'
import { ESCALATE_PROTOCOL, signalText, topSignals, type MonitorResult, type MonitorState } from '@/lib/monitor'
import type { PatternResult } from '@/lib/prevention'
import type { Profile } from '@/lib/api'
import type { CheckInInput } from '@/lib/storage'
import { isTodayUtc } from '@/lib/utils'
import type { Status, VitalId } from '@/types'

export const ROADMAP_URL = (import.meta.env.VITE_N8N_ROADMAP_WEBHOOK_URL ?? '').trim()
const TIMEOUT_MS = 30_000

// ---------- tipos ----------

export type StepKind = 'do' | 'watch' | 'ground'
export type PhaseId = 'today' | 'next-days' | 'week'

export interface RoadmapStep {
  id: string
  kind: StepKind
  text: string
  /** Porquê, com os números: "Sleep 5.1 h · in flight 6.4 h · pre-flight 7.2 h". */
  why: string
  param?: ParamId
  /** Id de risco do NASA HRP (data/hrp-risks.json). */
  risk?: string
  /** Passo com ação na própria tela (registrar água). */
  action?: 'water'
}

export interface RoadmapPhase {
  id: PhaseId
  title: string
  steps: RoadmapStep[]
}

export interface Signal {
  param: ParamId
  label: string
  status: Status
  /** "today": hoje longe de uma linha de base · "drift": em voo longe do pré-voo. */
  kind: 'today' | 'drift'
  text: string
}

export interface Roadmap {
  key: string
  engine: 'ai' | 'on-device'
  model?: string
  /** Por que o motor de IA não foi usado (sem webhook, sem rede, resposta inválida). */
  fallback?: string
  generatedAt: string
  headline: string
  summary: string
  signals: Signal[]
  phases: RoadmapPhase[]
  /** Há algo sinalizado para o cirurgião de voo. */
  ground: boolean
}

export interface RoadmapInput {
  missionDay: number
  pairs: BaselinePair[]
  elimination: { urine?: string; stool?: string }
  behavioral: Record<string, number> | null
  patterns: { id: string; title: string; status: Status }[]
  sepThisWeek: boolean
  water: { today: number; goal: number }
  checkupDoneToday: boolean
  /** Resultado do motor de monitoramento: a regra decide o estado; o roteiro só monta os passos. */
  monitor: { state: MonitorState; score: number; day: number; wording: string; reasons: string[]; signals: string[] } | null
}

// ---------- urina e fezes: opções do check-up ----------

export const URINE_OPTIONS = ['Clear or pale', 'Yellow', 'Dark yellow', 'Other'] as const
export const STOOL_OPTIONS = ['Normal for me', 'Hard or none today', 'Loose', 'Other'] as const

// ---------- entrada ----------

export function roadmapInput(args: {
  profile: Profile
  checkins: CheckInInput[]
  patterns: PatternResult[]
  sepThisWeek: boolean
  water: { today: number; goal: number }
  monitor?: MonitorResult | null
  today?: Date
}): RoadmapInput {
  const { profile, checkins, today = new Date() } = args
  const behavioral = checkins.filter((c) => c.sync !== 'rejected' && c.behavioral && Object.keys(c.behavioral).length).at(-1)
  const pairs = baselinePairs(profile, checkins, today)
  return {
    missionDay: profile.missionDay,
    pairs,
    elimination: eliminationToday(checkins, today),
    behavioral: behavioral && isTodayUtc(behavioral.at) ? behavioral.behavioral! : null,
    patterns: args.patterns.filter((p) => p.active).slice(0, 2).map((p) => ({ id: p.def.id, title: p.def.title, status: p.status })),
    sepThisWeek: args.sepThisWeek,
    water: args.water,
    checkupDoneToday: pairs.some((p) => p.today != null) || !!eliminationToday(checkins, today).urine,
    monitor: args.monitor
      ? { state: args.monitor.state, score: args.monitor.score, day: args.monitor.day, wording: args.monitor.wording, reasons: args.monitor.reasons,
          signals: topSignals(args.monitor, 3).map(signalText) }
      : null,
  }
}

// ---------- biblioteca de passos (REGRAS DE DEMONSTRAÇÃO) ----------

type Dir = 'above' | 'below'
interface Advice {
  headline: string
  today: string
  next: string
  week: string
  risk: string
  action?: 'water'
}

const ADVICE: Partial<Record<`${VitalId}:${Dir}`, Advice>> = {
  'sleep:below': {
    headline: 'Protect your sleep tonight',
    today: 'Dim the lights and put screens away one hour before your sleep period.',
    next: 'Start your sleep period at the same time for the next 3 nights.',
    week: 'If sleep stays short, ask your flight surgeon to review your work schedule.',
    risk: 'inadequate-sleep-and-irregular-schedules',
  },
  'heartRate:above': {
    headline: 'Ease the load on your heart today',
    today: 'Drink a water serving now and rest between demanding tasks.',
    next: 'Measure resting heart rate at the same time each morning, before exercise.',
    week: 'Keep your cardio sessions at the planned intensity, not higher.',
    risk: 'cardiovascular-adaptations',
    action: 'water',
  },
  'heartRate:below': {
    headline: 'Re-check your resting heart rate',
    today: 'Re-measure after waking, before coffee and exercise.',
    next: 'Notice any dizziness when you move fast or stand in a foot restraint.',
    week: 'Keep your scheduled exercise sessions.',
    risk: 'cardiovascular-adaptations',
  },
  'bloodPressure:above': {
    headline: 'Re-check your blood pressure',
    today: 'Re-measure after 5 minutes of quiet seated rest.',
    next: 'Measure at the same time of day for the next 3 days.',
    week: 'Keep salty snacks to what your menu plans.',
    risk: 'cardiovascular-adaptations',
  },
  'bloodPressure:below': {
    headline: 'Keep fluids up before effort',
    today: 'Drink a water serving before your exercise session.',
    next: 'Move slowly after long rest periods for the next 3 days.',
    week: 'Keep the countermeasure exercise on schedule.',
    risk: 'cardiovascular-adaptations',
    action: 'water',
  },
  'spo2:below': {
    headline: 'Re-check your oxygen saturation',
    today: 'Re-measure after 5 minutes at rest, with the sensor still and your hand warm.',
    next: 'Check the cabin O₂ and CO₂ readings with your crew.',
    week: 'Your flight surgeon reviews every low reading.',
    risk: 'hypoxia',
  },
  'respiratoryRate:above': {
    headline: 'Re-count your breathing at rest',
    today: 'Count your breaths for one full minute while seated and calm.',
    next: 'Note any shortness of breath so your flight surgeon can see it.',
    week: 'Check the cabin CO₂ readings with your crew.',
    risk: 'hypoxia',
  },
  'respiratoryRate:below': {
    headline: 'Re-count your breathing at rest',
    today: 'Count your breaths for one full minute while seated and calm.',
    next: 'Count at the same time each day for 3 days.',
    week: 'Your flight surgeon reviews the trend.',
    risk: 'hypoxia',
  },
  'temperature:above': {
    headline: 'Re-check your temperature',
    today: 'Re-measure in one hour and drink a water serving.',
    next: 'Log any symptom on the body map so your flight surgeon sees it.',
    week: 'Wash hands before meals and keep shared surfaces clean.',
    risk: 'altered-immune-system-responses',
    action: 'water',
  },
  'temperature:below': {
    headline: 'Re-check your temperature',
    today: 'Re-measure in one hour, away from air vents.',
    next: 'Dress warmer if your module feels cold.',
    week: 'Your flight surgeon reviews the trend.',
    risk: 'altered-immune-system-responses',
  },
}

/**
 * Passos por condição da pesquisa NEXUS-Med (plano do assistente, seção 8), tirados das ações
 * recomendadas da planilha. Só rotina: nada de remédio, dose ou diagnóstico. "ground" vai ao solo.
 */
interface ConditionAdvice extends Advice { weekKind?: StepKind }
const HYDRATION: ConditionAdvice = {
  headline: 'Hydration first today',
  today: 'Reach your water goal and log your urinations in the check-up.',
  next: 'Weigh in each morning with the same routine.',
  week: 'If your urinations stay low, tell your flight surgeon.',
  weekKind: 'ground',
  risk: 'inadequate-food-and-nutrition',
  action: 'water',
}
const SLEEP_HEADACHE: ConditionAdvice = {
  headline: 'Protect your sleep period',
  today: 'Dim the lights before the sleep period and check the cabin CO₂ with your crew.',
  next: 'Keep the same sleep period start for the next 3 nights.',
  week: 'Ask your flight surgeon to review your work schedule.',
  risk: 'inadequate-sleep-and-irregular-schedules',
}
export const CONDITION_ADVICE: Record<string, ConditionAdvice> = {
  C12: HYDRATION,
  C06: { ...HYDRATION, headline: 'Ease into flight: fluids and rest', risk: 'altered-sensorimotor-and-vestibular-function' },
  C16: {
    headline: 'Keep fluids steady and log your urine',
    today: 'Log your urinations and urine color in the check-up.',
    next: 'Keep the water goal every day.',
    week: 'Ground review if the flank discomfort continues.',
    weekKind: 'ground',
    risk: 'inadequate-food-and-nutrition',
    action: 'water',
  },
  C18: SLEEP_HEADACHE,
  C05: { ...SLEEP_HEADACHE, headline: 'Ease the load and protect your sleep' },
  C09: {
    headline: 'Rest and re-measure today',
    today: 'Repeat today’s measurements and rest between tasks.',
    next: 'Measure your temperature morning and evening.',
    week: 'Ground review of your measurements and symptoms.',
    weekKind: 'ground',
    risk: 'altered-immune-system-responses',
  },
}

/** Contramedida que a semana lembra quando a medida em voo se afastou do pré-voo. */
const DRIFT_KEEP: Partial<Record<VitalId, string>> = {
  heartRate: 'your cardio and resistance sessions',
  bloodPressure: 'your cardio and resistance sessions',
  sleep: 'a regular sleep schedule',
  spo2: 'the daily cabin air checks',
  respiratoryRate: 'the daily cabin air checks',
  temperature: 'your daily check-up',
}

const ORDER: Record<Status, number> = { baseline: 0, attention: 1, flagged: 2 }

function why(p: BaselinePair) {
  const n = (v?: number) => fmtNum(v, p.decimals)
  const parts = [`${p.label} ${p.todayText ?? n(p.today)} ${p.unit}`]
  if (p.inflight != null) parts.push(`in flight ${n(p.inflight)}`)
  if (p.preflight != null) parts.push(`pre-flight ${n(p.preflight)}`)
  return parts.join(' · ')
}

// ---------- motor no aparelho ----------

export function buildOnDevice(input: RoadmapInput, key = roadmapKey(input), now = new Date()): Roadmap {
  const today: RoadmapStep[] = []
  const next: RoadmapStep[] = []
  const week: RoadmapStep[] = []
  /** Adaptação ao voo (em voo longe do pré-voo): é o assunto da semana, entra antes. */
  const drifts: RoadmapStep[] = []
  const signals: Signal[] = []
  const headlines: { rank: number; text: string }[] = []

  for (const p of input.pairs) {
    const c = p.config
    // Hoje contra o pré-voo (a regra que o resto do app já usa) e contra o em voo.
    if (p.today != null) {
      const vsPre = p.preflight != null ? p.today - p.preflight : NaN
      const vsIn = p.inflight != null ? p.today - p.inflight : NaN
      const stPre = Number.isFinite(vsPre) ? evaluate(vsPre, c.rule) : 'baseline'
      const stIn = Number.isFinite(vsIn) ? evaluate(vsIn, c.rule) : 'baseline'
      const status: Status = ORDER[stPre] >= ORDER[stIn] ? stPre : stIn
      if (status !== 'baseline') {
        const delta = ORDER[stPre] >= ORDER[stIn] ? vsPre : vsIn
        const dir: Dir = delta > 0 ? 'above' : 'below'
        const ref = ORDER[stPre] >= ORDER[stIn] ? 'pre-flight' : 'in-flight'
        signals.push({ param: p.id, label: p.label, status, kind: 'today', text: `${fmtDelta(delta, p.decimals)} ${p.unit} vs ${ref}` })
        const a = ADVICE[`${p.id}:${dir}`]
        if (a) {
          headlines.push({ rank: ORDER[status] * 10 + 5, text: a.headline })
          // Sinalizado vem antes de atenção: com poucos passos por fase, o mais sério fica.
          const put = <T,>(list: T[], item: T) => (status === 'flagged' ? list.unshift(item) : list.push(item))
          put(today, { id: `${p.id}-today`, kind: 'do' as const, text: a.today, why: why(p), param: p.id, risk: a.risk, action: a.action })
          put(next, { id: `${p.id}-next`, kind: 'do' as const, text: a.next, why: why(p), param: p.id, risk: a.risk })
          put(week, { id: `${p.id}-week`, kind: 'do' as const, text: a.week, why: why(p), param: p.id, risk: a.risk })
        }
        if (status === 'flagged') {
          today.unshift({
            id: `${p.id}-ground`,
            kind: 'ground',
            text: `Send today's report: ${p.label.toLowerCase()} is flagged for your flight surgeon.`,
            why: `${why(p)} · rule: ${fmtNum(c.rule.flagged, c.decimals)} ${c.unit} or more away from baseline`,
            param: p.id,
          })
        }
      }
    }
    // Em voo contra o pré-voo: adaptação lenta, entra na semana.
    if (p.inflight != null && p.preflight != null) {
      const drift = p.inflight - p.preflight
      if (evaluate(drift, c.rule) !== 'baseline') {
        signals.push({ param: p.id, label: p.label, status: 'attention', kind: 'drift', text: `in flight ${fmtDelta(drift, p.decimals)} ${p.unit} vs pre-flight` })
        headlines.push({ rank: 3, text: `Your ${p.label.toLowerCase()} is adapting to flight` })
        drifts.push({
          id: `${p.id}-drift`,
          kind: 'watch',
          text: `In flight, your ${p.label.toLowerCase()} settled ${fmtDelta(drift, p.decimals)} ${p.unit} from pre-flight. Keep ${DRIFT_KEEP[p.id] ?? 'your routine'}.`,
          why: `Median of ${p.inflightDays} days in flight ${fmtNum(p.inflight, p.decimals)} · pre-flight ${fmtNum(p.preflight, p.decimals)}`,
          param: p.id,
        })
      }
    }
  }

  // Urina e fezes (relato, sem escala clínica).
  const { urine, stool } = input.elimination
  if (urine === 'Dark yellow') {
    signals.push({ param: 'elimination', label: 'Urine', status: 'attention', kind: 'today', text: 'darker than pale' })
    headlines.push({ rank: 8, text: 'Drink steadily today' })
    today.push({ id: 'urine-today', kind: 'do', text: 'Drink one water serving each waking hour today.', why: `You reported dark yellow urine · water today ${input.water.today} of ${input.water.goal}`, param: 'elimination', risk: 'inadequate-food-and-nutrition', action: 'water' })
    next.push({ id: 'urine-next', kind: 'watch', text: 'Look at your urine color in each check-up.', why: 'Self-report, not a lab test', param: 'elimination' })
  }
  if (stool === 'Hard or none today') {
    signals.push({ param: 'elimination', label: 'Stool', status: 'attention', kind: 'today', text: 'hard or none' })
    today.push({ id: 'stool-hard', kind: 'do', text: 'Add fluids and the high-fiber items on your menu.', why: 'You reported hard stool or none today', param: 'elimination', risk: 'inadequate-food-and-nutrition' })
  }
  if (stool === 'Loose') {
    signals.push({ param: 'elimination', label: 'Stool', status: 'attention', kind: 'today', text: 'loose' })
    today.push({ id: 'stool-loose', kind: 'do', text: 'Replace fluids: one extra water serving after each loose stool.', why: 'You reported loose stool today', param: 'elimination', risk: 'host-microorganism-interactions', action: 'water' })
    next.push({ id: 'stool-loose-next', kind: 'ground', text: 'Tell your flight surgeon if it continues tomorrow.', why: 'Self-report', param: 'elimination' })
  }

  // Saúde comportamental (autorrelato, sem pontuação).
  const b = input.behavioral
  if (b && ((b.stress ?? 0) >= 4 || (b.mood ?? 5) <= 2)) {
    headlines.push({ rank: 7, text: 'Make room to recover today' })
    today.push({ id: 'mood-today', kind: 'do', text: 'Take your scheduled relaxation time; a private call home can help.', why: `You answered mood ${b.mood ?? '—'} and stress ${b.stress ?? '—'} of 5`, risk: 'behavioral-changes-and-psychiatric-disorders' })
    next.push({ id: 'mood-next', kind: 'watch', text: 'Do the mood check each morning. It is not scored.', why: 'Self-report; it does not replace your psychologist', risk: 'behavioral-changes-and-psychiatric-disorders' })
  }

  // Condições da pesquisa compatíveis: passos da seção 8, na frente dos passos por medida.
  const m = input.monitor
  const monitorWhy = m ? `${m.signals.join(' · ') || m.wording} · rule state ${m.state.toLowerCase()}` : ''
  const condToday: RoadmapStep[] = [], condNext: RoadmapStep[] = [], condWeek: RoadmapStep[] = []
  for (const pat of input.patterns) {
    const a = CONDITION_ADVICE[pat.id]
    // Os números do motor; a frase segura da condição já está no cartão do padrão.
    const why = monitorWhy || pat.title
    if (!a) {
      week.push({ id: `pattern-${pat.id}`, kind: 'ground', text: `Early-sign pattern active: ${pat.title} Your flight surgeon reviews it.`, why: 'Several signs on the same day · see the rules' })
      continue
    }
    headlines.push({ rank: 30, text: a.headline })
    condToday.push({ id: `${pat.id}-today`, kind: 'do', text: a.today, why, risk: a.risk, action: a.action })
    condNext.push({ id: `${pat.id}-next`, kind: 'do', text: a.next, why, risk: a.risk })
    condWeek.push({ id: `${pat.id}-week`, kind: a.weekKind ?? 'do', text: a.week, why, risk: a.risk })
  }
  // Por estado: WATCH pede repetir e relatar; PERSISTENT CHANGE pede reduzir a carga e repetir todo dia.
  const stateToday: RoadmapStep[] = [], stateNext: RoadmapStep[] = []
  if (m?.state === 'WATCH') {
    stateToday.push(
      { id: 'watch-repeat', kind: 'do', text: 'Repeat the measurement that changed, at rest.', why: monitorWhy },
      { id: 'watch-symptoms', kind: 'do', text: 'Complete the symptom check-in on the body map.', why: 'A change from your personal baseline was detected' },
    )
  }
  if (m?.state === 'PERSISTENT CHANGE') {
    headlines.push({ rank: 25, text: 'Ease the load and confirm the change' })
    stateToday.push({ id: 'persistent-workload', kind: 'do', text: 'Ask to reduce non-critical workload today.', why: monitorWhy })
    stateNext.push({ id: 'persistent-daily', kind: 'watch', text: 'Repeat the check-up every day, at the same time.', why: 'Several measurements are moving away from your personal baseline' })
  }
  today.unshift(...(m?.state === 'WATCH' ? [...stateToday, ...condToday] : [...condToday, ...stateToday]))
  next.unshift(...condNext, ...stateNext)
  week.unshift(...condWeek)

  // Clima espacial (DONKI informa eventos, não a dose recebida).
  if (input.sepThisWeek) {
    next.push({ id: 'sep', kind: 'watch', text: 'Review your radiation shelter location with your crew.', why: 'NASA DONKI reported a solar particle event this week. It reports events, not your dose.', risk: 'radiation-induced-cancers' })
  }

  // Sem nada fora: manutenção.
  if (!input.checkupDoneToday) {
    today.unshift({ id: 'do-checkup', kind: 'do', text: 'Do your 2-minute check-up so the roadmap can compare today.', why: 'No measures recorded today' })
  }
  if (today.filter((s) => s.kind !== 'ground').length === 0) {
    today.push({ id: 'keep-exercise', kind: 'do', text: 'Keep your exercise session on schedule.', why: 'All measures within both baselines', risk: 'reduced-cardiorespiratory-and-musculoskeletal-fitness' })
  }
  if (!today.some((s) => s.action === 'water') && input.water.today < input.water.goal) {
    today.push({ id: 'water', kind: 'do', text: `Reach your water goal: ${input.water.goal} servings.`, why: `${input.water.today} of ${input.water.goal} servings so far`, action: 'water', risk: 'inadequate-food-and-nutrition' })
  }
  const watched = [...new Set(signals.map((s) => s.label.toLowerCase()))]
  next.push({ id: 'checkup-daily', kind: 'watch', text: watched.length ? `Check-up every morning, same time: watch ${watched.join(', ')}.` : 'Check-up every morning, at the same time.', why: 'Same time each day makes the comparison fair' })
  week.splice(condWeek.length, 0, ...drifts)
  if (week.length === 0) {
    week.push({ id: 'steady', kind: 'do', text: 'Your measures hold steady in flight. Keep the routine.', why: 'In flight close to pre-flight for every measure' })
  }

  const ground = today.some((s) => s.kind === 'ground') || input.patterns.some((p) => p.status === 'flagged') || m?.state === 'ESCALATE'
  const top = headlines.sort((a, b) => b.rank - a.rank)[0]
  const n = new Set(signals.filter((s) => s.kind === 'today').map((s) => s.param)).size
  // ESCALATE: sem passos de rotina; só o protocolo (a tela mostra o texto fixo, sem IA).
  if (m?.state === 'ESCALATE') {
    return {
      key, engine: 'on-device', generatedAt: now.toISOString(), headline: m.wording, summary: ESCALATE_PROTOCOL,
      signals: signals.sort((a, b) => ORDER[b.status] - ORDER[a.status]),
      phases: [
        { id: 'today', title: 'Today', steps: [{ id: 'escalate', kind: 'ground', text: ESCALATE_PROTOCOL, why: m.reasons.join(' · ') }] },
        { id: 'next-days', title: 'Next 3 days', steps: [] },
        { id: 'week', title: 'This week', steps: [] },
      ],
      ground: true,
    }
  }
  return {
    key,
    engine: 'on-device',
    generatedAt: now.toISOString(),
    headline: !input.checkupDoneToday ? 'Start with today’s check-up' : top?.text ?? 'Stay on course',
    summary: !input.checkupDoneToday
      ? 'Do the check-up first. The roadmap compares today with your baselines.'
      : n
        ? `${n} ${n === 1 ? 'measure is' : 'measures are'} off your baselines. A few routine steps keep it small.`
        : 'Everything within your baselines. Keep the routine.',
    signals: signals.sort((a, b) => ORDER[b.status] - ORDER[a.status]),
    phases: [
      { id: 'today', title: 'Today', steps: dedupe(today).slice(0, 3) },
      { id: 'next-days', title: 'Next 3 days', steps: dedupe(next).slice(0, 2) },
      { id: 'week', title: 'This week', steps: dedupe(week).slice(0, 2) },
    ],
    ground,
  }
}

/** Um passo por texto: duas medidas podem pedir a mesma coisa. */
function dedupe(steps: RoadmapStep[]) {
  const seen = new Set<string>()
  return steps.filter((s) => (seen.has(s.text) ? false : (seen.add(s.text), true)))
}

/** Chave do roteiro: muda quando a entrada muda (novo check-up, água, padrão). */
export function roadmapKey(input: RoadmapInput) {
  const text = JSON.stringify({ ...input, pairs: input.pairs.map(({ config: _c, ...p }) => p) })
  let h = 0
  for (let i = 0; i < text.length; i++) h = (Math.imul(31, h) + text.charCodeAt(i)) | 0
  return `${new Date().toISOString().slice(0, 10)}:${(h >>> 0).toString(36)}`
}

// ---------- motor de IA (n8n) ----------

export const AI_INSTRUCTIONS = [
  'You write a preventive routine roadmap for an astronaut, in plain English, second person, short sentences.',
  'Compare each measure today with BOTH baselines: pre-flight (before launch) and in-flight (median of recent mission days).',
  'Suggest routine actions only (sleep, fluids, exercise schedule, re-measuring, telling the flight surgeon). Never diagnose, never name a disease, never suggest medication or doses.',
  'Anything flagged goes to the flight surgeon as a "ground" step. Every step has a "why" that quotes the numbers.',
  'The monitoring state, score and signals come from the rule in the context ("monitor"). Never change or contradict them, never call the score a probability or a percentage, and never write steps when the state is ESCALATE.',
  'When research patterns are active, use their safe wording exactly as given and keep the routine steps of "conditionSteps".',
  'Return ONLY JSON: {"headline": string, "summary": string, "phases": [{"id": "today"|"next-days"|"week", "title": string, "steps": [{"id": string, "kind": "do"|"watch"|"ground", "text": string, "why": string, "param"?: string, "risk"?: string}]}]}.',
  'Use at most 4 steps today and 3 in each other phase. "risk" must be an id from the NASA HRP list in the context.',
].join(' ')

function aiContext(input: RoadmapInput) {
  return {
    missionDay: input.missionDay,
    dataNotice: 'Simulated health data. Demonstration rules, no clinical source.',
    measures: input.pairs.map((p) => ({ id: p.id, label: p.label, unit: p.unit, today: p.todayText ?? null, preflight: p.preflight ?? null, inflight: p.inflight ?? null, inflightDays: p.inflightDays, rule: p.config.rule })),
    elimination: input.elimination,
    behavioral: input.behavioral,
    monitor: input.monitor,
    activePatterns: input.patterns,
    conditionSteps: Object.fromEntries(input.patterns.filter((p) => CONDITION_ADVICE[p.id]).map((p) => [p.id, CONDITION_ADVICE[p.id]])),
    solarParticleEventThisWeek: input.sepThisWeek,
    water: input.water,
    hrpRisks: ['cardiovascular-adaptations', 'hypoxia', 'inadequate-sleep-and-irregular-schedules', 'inadequate-food-and-nutrition', 'altered-immune-system-responses', 'host-microorganism-interactions', 'behavioral-changes-and-psychiatric-disorders', 'reduced-cardiorespiratory-and-musculoskeletal-fitness', 'radiation-induced-cancers'],
  }
}

/** Lê a resposta da IA; devolve null se não tiver o formato pedido. */
export function parseAiRoadmap(body: unknown): Pick<Roadmap, 'headline' | 'summary' | 'phases'> & { model?: string } | null {
  let data = body
  if (typeof data === 'string') {
    const m = /\{[\s\S]*\}/.exec(data)
    try { data = m ? JSON.parse(m[0]) : null } catch { return null }
  }
  if (Array.isArray(data)) data = data[0]
  const o = data as Record<string, unknown> | null
  if (o && typeof o.output === 'string') return parseAiRoadmap(o.output)
  if (!o || typeof o.headline !== 'string' || !Array.isArray(o.phases)) return null
  const ids: PhaseId[] = ['today', 'next-days', 'week']
  const phases = ids.map((id) => {
    const raw = (o.phases as Record<string, unknown>[]).find((p) => p?.id === id)
    const steps = Array.isArray(raw?.steps) ? (raw!.steps as Record<string, unknown>[]) : []
    return {
      id,
      title: typeof raw?.title === 'string' ? raw.title : id === 'today' ? 'Today' : id === 'next-days' ? 'Next 3 days' : 'This week',
      steps: steps
        .filter((s) => typeof s?.text === 'string')
        .slice(0, id === 'today' ? 4 : 3)
        .map((s, i) => ({
          id: typeof s.id === 'string' ? s.id : `${id}-${i}`,
          kind: (['do', 'watch', 'ground'].includes(s.kind as string) ? s.kind : 'do') as StepKind,
          text: s.text as string,
          why: typeof s.why === 'string' ? s.why : '',
          param: typeof s.param === 'string' ? (s.param as ParamId) : undefined,
          risk: typeof s.risk === 'string' ? s.risk : undefined,
        })),
    }
  })
  if (phases.every((p) => p.steps.length === 0)) return null
  return { headline: o.headline, summary: typeof o.summary === 'string' ? o.summary : '', phases, model: typeof o.model === 'string' ? o.model : undefined }
}

export async function buildWithAi(input: RoadmapInput, base: Roadmap): Promise<Roadmap> {
  if (!ROADMAP_URL) return { ...base, fallback: 'AI not connected in this demo' }
  if (typeof navigator !== 'undefined' && !navigator.onLine) return { ...base, fallback: 'No ground link right now' }
  try {
    const res = await fetch(ROADMAP_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode: 'roadmap', instructions: AI_INSTRUCTIONS, context: aiContext(input) }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
    if (!res.ok) return { ...base, fallback: aiFailureMessage(new Error(`HTTP ${res.status}`)) }
    const text = await res.text()
    let body: unknown = text
    try { body = JSON.parse(text) } catch { /* texto puro */ }
    const ai = parseAiRoadmap(body)
    if (!ai) return { ...base, fallback: aiFailureMessage(new Error('Invalid roadmap')) }
    // Sinais e "ground" continuam vindo das regras: a IA escreve os passos, não decide o que é sinalizado.
    return { ...base, ...ai, engine: 'ai', fallback: undefined, generatedAt: new Date().toISOString(), ground: base.ground || ai.phases.some((p) => p.steps.some((s) => s.kind === 'ground')) }
  } catch (error) {
    return { ...base, fallback: aiFailureMessage(error) }
  }
}

// ---------- cache e passos feitos ----------

const CACHE_KEY = 'health7:roadmap:v1'
const DONE_KEY = 'health7:roadmap-done:v1'

function readJson<T>(key: string, fallback: T): T {
  try {
    const k = scopedStorageKey(key)
    return (k ? (JSON.parse(localStorage.getItem(k) ?? 'null') as T) : null) ?? fallback
  } catch {
    return fallback
  }
}
function writeJson(key: string, value: unknown) {
  try {
    const k = scopedStorageKey(key)
    if (k) localStorage.setItem(k, JSON.stringify(value))
  } catch { /* sem espaço: vale só nesta visita */ }
}

/** Roteiro de hoje: usa o guardado se a entrada não mudou; senão monta no aparelho e, com IA, troca pela resposta dela. */
export function useRoadmap(input: RoadmapInput) {
  const key = useMemo(() => roadmapKey(input), [input])
  const [nonce, setNonce] = useState(0)
  const [state, setState] = useState<{ roadmap: Roadmap; loading: boolean }>(() => {
    const cached = readJson<Roadmap | null>(CACHE_KEY, null)
    return cached?.key === key ? { roadmap: cached, loading: false } : { roadmap: buildOnDevice(input, key), loading: !!ROADMAP_URL }
  })

  useEffect(() => {
    const cached = readJson<Roadmap | null>(CACHE_KEY, null)
    if (nonce === 0 && cached?.key === key) {
      setState({ roadmap: cached, loading: false })
      return
    }
    const base = buildOnDevice(input, key)
    let alive = true
    setState({ roadmap: base, loading: !!ROADMAP_URL })
    void buildWithAi(input, base).then((r) => {
      if (!alive) return
      writeJson(CACHE_KEY, r)
      setState({ roadmap: r, loading: false })
    })
    return () => { alive = false }
    // input muda junto com key
    // oxlint-disable-next-line react/exhaustive-deps
  }, [key, nonce])

  return { ...state, regenerate: () => setNonce((n) => n + 1) }
}

const doneListeners = new Set<() => void>()
let doneCache: { raw: string; value: Record<string, string[]> } = { raw: '', value: {} }
function loadDone(): Record<string, string[]> {
  const value = readJson<Record<string, string[]>>(DONE_KEY, {})
  const raw = JSON.stringify(value)
  if (raw !== doneCache.raw) doneCache = { raw, value }
  return doneCache.value
}

const subscribeDone = (cb: () => void) => {
  doneListeners.add(cb)
  return () => { doneListeners.delete(cb) }
}

/** Todos os passos marcados, por dia UTC (o jogo conta os pontos de prevenção a partir daqui). */
export function useDoneLog(): Record<string, string[]> {
  return useSyncExternalStore(subscribeDone, loadDone, loadDone)
}

/** Passos de hoje marcados como feitos, por dia UTC. */
export function useDoneSteps(day = new Date().toISOString().slice(0, 10)) {
  const all = useDoneLog()
  const done = all[day] ?? []
  function toggle(id: string) {
    const current = loadDone()
    const list = current[day] ?? []
    writeJson(DONE_KEY, { ...current, [day]: list.includes(id) ? list.filter((x) => x !== id) : [...list, id] })
    doneListeners.forEach((l) => l())
  }
  return { done, toggle }
}
