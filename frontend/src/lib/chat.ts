/*
  Chat do companheiro (plano v2, seção 8). O front só envia a mensagem com o contexto do dia e
  mostra a resposta; a personalidade e os limites ficam no nó AI Agent do fluxo do n8n.

  - Conversa no localStorage ("health7:chat:v1"), com um sessionId criado na primeira mensagem.
    A memória do agente no n8n usa esse sessionId.
  - A conversa NÃO entra no relatório para o solo.
  - Sem VITE_N8N_CHAT_WEBHOOK_URL: modo de demonstração, com respostas prontas marcadas "Demo reply".
*/
import { useSyncExternalStore } from 'react'
import { getActiveCrewId, scopedStorageKey } from '@/lib/active-profile'
import { indicators, type DonkiSnapshot, type SpaceWeatherSource } from '@/lib/donki'
import type { GameSummary } from '@/lib/game'
import { crew, getTodayVitals } from '@/lib/health'
import { activePlan, loadPlans } from '@/lib/plans'
import { loadCognitive } from '@/lib/cognitive'
import { monitor, signalText, topSignals } from '@/lib/monitor'
import { patternsFromMonitor } from '@/lib/prevention'
import { radiationSummary } from '@/lib/radiation'
import { latestCheckIn, loadCheckIns } from '@/lib/storage'
import { session } from '@/lib/session'
import { isTodayUtc } from '@/lib/utils'
import { loadWater, WATER_GOAL } from '@/lib/water'

export const WEBHOOK_URL = (import.meta.env.VITE_N8N_CHAT_WEBHOOK_URL ?? '').trim()
export const DEMO_MODE = WEBHOOK_URL === ''
export const TIMEOUT_MS = 45_000
export const OFFLINE_TEXT = 'Your companion needs a ground link right now. Your check-ups still work offline.'

const KEY = 'health7:chat:v1'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  text: string
  at: string
  /** Resposta pronta do modo de demonstração. */
  demo?: boolean
  /** Falha no lugar da resposta; guarda a mensagem para "Try again". */
  error?: { retryOf: string }
}

interface ChatState {
  sessionId: string | null
  messages: ChatMessage[]
  pending: boolean
}

// ---------- estado (localStorage + assinantes) ----------

function load(): ChatState {
  try {
    const key = scopedStorageKey(KEY)
    const raw = JSON.parse((key ? localStorage.getItem(key) : null) ?? 'null') as Partial<ChatState> | null
    return { sessionId: raw?.sessionId ?? null, messages: Array.isArray(raw?.messages) ? raw!.messages : [], pending: false }
  } catch {
    return { sessionId: null, messages: [], pending: false }
  }
}

let state: ChatState = { sessionId: null, messages: [], pending: false }
let owner: string | undefined
const listeners = new Set<() => void>()

function currentState() {
  const active = getActiveCrewId()
  if (owner !== active) { owner = active; state = load() }
  return state
}

function set(next: Partial<ChatState>) {
  currentState()
  const key = scopedStorageKey(KEY)
  if (!key) return
  state = { ...state, ...next }
  try {
    localStorage.setItem(key, JSON.stringify({ sessionId: state.sessionId, messages: state.messages }))
  } catch {
    // sem espaço: a conversa vale só nesta visita
  }
  listeners.forEach((l) => l())
}

export function useChat(): ChatState {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
    currentState,
    currentState,
  )
}

export function clearConversation() {
  set({ sessionId: null, messages: [], pending: false })
}

const uid = () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`)

// ---------- contexto enviado ao n8n ----------

export interface WeatherContext {
  snapshot: DonkiSnapshot
  source: SpaceWeatherSource
}

/** O contexto do dia (plano v2, "Contrato com o n8n"). Serve para o companheiro ser atento, não para avaliar a saúde. */
export function buildContext(game: GameSummary, weather?: WeatherContext) {
  const behavioral = latestCheckIn('behavioral')
  const ind = weather ? indicators(weather.snapshot) : null
  return {
    crew: { id: crew.id, displayName: crew.displayName, missionDay: crew.missionDay },
    dataNotice: 'Simulated health data. Demonstration rules, no clinical source.',
    vitals: getTodayVitals().map((v) => ({
      id: v.id,
      label: v.label,
      value: v.value,
      unit: v.unit,
      baseline: v.baseline,
      delta: v.delta,
      status: v.status,
      ...(v.rule ? { rule: v.rule } : {}),
    })),
    behavioral: behavioral && isTodayUtc(behavioral.at) ? behavioral.behavioral : null,
    routine: {
      healthCheckUpDone: game.today.healthDone,
      behavioralCheckInDone: game.today.behavioralDone,
      waterServings: game.today.water,
      waterGoal: WATER_GOAL,
      streakDays: game.streakDays,
      rank: game.rank.name,
      pointsToday: game.today.total,
    },
    prevention: preventionContext(),
    spaceWeather: ind
      ? {
          sepCount: ind.sep.count,
          strongestFlare: ind.flr.strongest?.classType ?? null,
          maxKp: ind.gst.kpMax,
          windowDays: 7,
          fetchedAt: weather!.snapshot.fetchedAt,
          source: weather!.source,
        }
      : null,
  }
}

/**
 * Padrões ativos, plano em andamento e dose da missão (plano v3, seção 9). Para o companheiro
 * incentivar o plano; o prompt do n8n proíbe explicar o padrão como doença ou comentar risco.
 */
function preventionContext() {
  const water = loadWater()
  // A regra decide: o estado e os sinais vão prontos; a IA explica e não pode mudá-los.
  const snap = session.getSnapshot()
  const result = snap.profile
    ? monitor({ profile: snap.profile, checkins: snap.checkins, symptoms: snap.symptoms, cognitive: loadCognitive(), environment: snap.environment })
    : null
  const patterns = result ? patternsFromMonitor(result).filter((p) => p.active).slice(0, 2) : []
  const plan = activePlan(loadPlans(), { checkIns: loadCheckIns(), water, waterGoal: WATER_GOAL })
  const rad = radiationSummary()
  return {
    monitor: result
      ? { state: result.state, score: result.score, scoreMeaning: 'Change intensity from 0 to 100, not a probability', missionDay: result.day,
          wording: result.wording, action: result.action, reasons: result.reasons, signals: topSignals(result, 4).map(signalText),
          environment: result.environment?.items ?? [], ruleVersion: result.ruleVersion, notice: result.notice }
      : null,
    patterns: patterns.map((p) => ({ id: p.def.id, safeWording: p.def.title, signsPresent: p.present, signsTotal: p.total, status: p.status })),
    plan: plan?.today
      ? { pattern: plan.pattern.title, day: plan.dayNumber, days: plan.plan.days, stepsDoneToday: plan.today.doneCount, stepsToday: plan.today.steps.length }
      : null,
    radiation: { missionTotal: rad.missionTotal, unit: rad.unit, simulated: true },
  }
}

// ---------- resposta ----------

/**
 * Lê a resposta do n8n de forma tolerante: o AI Agent devolve o texto em "output", e o formato muda
 * conforme o nó de resposta. Aceita reply, output, text ou message, num objeto ou no primeiro item
 * de uma lista, e também texto puro.
 */
export function parseReply(body: string): string | null {
  const text = body.trim()
  if (!text) return null
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch {
    return text // texto puro
  }
  const pick = (v: unknown): string | null => {
    if (typeof v === 'string') return v.trim() || null
    if (Array.isArray(v)) return v.length ? pick(v[0]) : null
    if (v && typeof v === 'object') {
      const o = v as Record<string, unknown>
      for (const k of ['reply', 'output', 'text', 'message']) {
        const found = pick(o[k])
        if (found) return found
      }
      if (o.json) return pick(o.json) // item do n8n: { json: {...} }
    }
    return null
  }
  return pick(data)
}

// ---------- modo de demonstração ----------

const HEALTH_WORDS = /\b(pain|hurts?|headache|dizzy|nause|sick|ill|fever|medic|pill|dose|symptom|bleed|vomit)\b/i
const DISTRESS_WORDS = /\b(hurt myself|kill myself|end it|suicid|hopeless|can'?t go on|no way out|self[- ]harm)\b/i

/** Respostas prontas, calorosas e sem orientação médica, para desenvolver e gravar sem o fluxo. */
export function demoReply(message: string, context: ReturnType<typeof buildContext>, turn: number): string {
  if (DISTRESS_WORDS.test(message)) {
    return "I'm really glad you told me, and I'm taking it seriously. Please reach a crewmate and your flight surgeon right now. You don't have to carry this alone. I'm here with you while you do."
  }
  if (HEALTH_WORDS.test(message)) {
    return "That sounds like one for your flight surgeon, and it's worth telling them today. I can't advise on health, but I'm happy to keep you company while you reach out."
  }
  const m = message.toLowerCase()
  const plan = context.prevention.plan
  if (plan && (m.includes('plan') || m.includes('my day'))) {
    return plan.stepsDoneToday > 0
      ? `You're on day ${plan.day} of your plan, with ${plan.stepsDoneToday} of ${plan.stepsToday} steps done today. That's real effort. How did today go for you?`
      : `You're on day ${plan.day} of ${plan.days} of your plan. Today's steps are still open, no rush. How is your day going so far?`
  }
  if (m.includes('my day')) {
    const sleep = context.vitals.find((v) => v.id === 'sleep')
    return sleep && sleep.status !== 'baseline'
      ? "I'd love to hear about it. I noticed you logged less sleep than usual. How are you feeling today, honestly?"
      : "I'd love to hear about it. What was the best part of today, even if it was something small?"
  }
  if (m.includes('unwind') || m.includes('sleep')) {
    return "Let's slow things down together. What usually helps you switch off at the end of a shift: music, a few quiet minutes at the window, writing something down?"
  }
  if (m.includes('miss') || m.includes('home')) {
    return "That makes a lot of sense, being this far away for this long. Who or what are you missing most right now?"
  }
  const generic = [
    'Thanks for telling me. How are you feeling about it right now?',
    "I'm listening. What's been on your mind the most today?",
    'That sounds like a lot. What would make the rest of today a little easier?',
  ]
  return generic[turn % generic.length]
}

// ---------- envio ----------

async function fetchReply(payload: object): Promise<string> {
  const res = await fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const reply = parseReply(await res.text())
  if (!reply) throw new Error('Empty reply')
  return reply
}

/** Envia uma mensagem (ou repete a que falhou). Atualiza o estado com a resposta, a falha ou a resposta de demonstração. */
export async function send(text: string, context: ReturnType<typeof buildContext>, opts: { retryOf?: string } = {}) {
  currentState()
  const requestOwner = owner
  if (!requestOwner || context.crew.id !== requestOwner) return
  const message = text.trim()
  if (!message || state.pending) return
  const sessionId = state.sessionId ?? uid()
  let messages = state.messages
  if (opts.retryOf) {
    // tira a mensagem de erro; a pergunta da pessoa continua na lista
    messages = messages.filter((m) => m.error?.retryOf !== opts.retryOf)
  } else {
    messages = [...messages, { id: uid(), role: 'user', text: message, at: new Date().toISOString() }]
  }
  set({ sessionId, messages, pending: true })
  const userId = opts.retryOf ?? messages[messages.length - 1].id

  try {
    let reply: string
    let demo = false
    if (DEMO_MODE) {
      await new Promise((r) => setTimeout(r, 900))
      reply = demoReply(message, context, state.messages.filter((m) => m.role === 'assistant').length)
      demo = true
    } else {
      reply = await fetchReply({ sessionId, message, context })
    }
    currentState()
    if (owner !== requestOwner || state.sessionId !== sessionId || !state.pending) return
    set({ pending: false, messages: [...state.messages, { id: uid(), role: 'assistant', text: reply, at: new Date().toISOString(), demo }] })
  } catch (err) {
    currentState()
    if (owner !== requestOwner || state.sessionId !== sessionId || !state.pending) return
    const timedOut = err instanceof DOMException && (err.name === 'TimeoutError' || err.name === 'AbortError')
    // fetch rejeita com TypeError quando não há rede (ou o CORS bloqueia)
    const network = err instanceof TypeError
    set({
      pending: false,
      messages: [
        ...state.messages,
        {
          id: uid(),
          role: 'assistant',
          text: timedOut
            ? 'Your companion took too long to answer.'
            : network
              ? OFFLINE_TEXT
              : "Your companion couldn't answer right now.",
          at: new Date().toISOString(),
          error: { retryOf: userId },
        },
      ],
    })
  }
}

// ---------- conexão ----------

function subscribeOnline(cb: () => void) {
  window.addEventListener('online', cb)
  window.addEventListener('offline', cb)
  return () => {
    window.removeEventListener('online', cb)
    window.removeEventListener('offline', cb)
  }
}

/** navigator.onLine, reativo. */
export function useOnline() {
  return useSyncExternalStore(subscribeOnline, () => navigator.onLine, () => true)
}
