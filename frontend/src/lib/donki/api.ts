/*
  Cliente da API pública do NASA DONKI (DONKI-API v2.0).
  Referência: cofre/03 Pesquisa/DONKI - documentação da API.md

  - Só GET, sem chave, CORS liberado: dá para chamar direto do navegador.
  - Janela máxima de 60 dias por chamada, contando o primeiro e o último dia
    (a API responde HTTP 400 acima disso). Sempre mandamos startDate e endDate.
  - Corpo vazio ou [] quando não há eventos: é resultado válido, não erro.
  - Horários em UTC (terminam em Z).

  Este arquivo não usa aliases (@/...) para poder ser importado também pelo
  script de snapshot (scripts/build-donki-snapshot.ts), que roda no Node.
*/

export const DONKI_BASE = 'https://ccmc.gsfc.nasa.gov/DONKI-API'
export const DONKI_PAGE = 'https://ccmc.gsfc.nasa.gov/tools/DONKI/'
export const DONKI_API_DOCS = 'https://ccmc.gsfc.nasa.gov/DONKI/api/'
export const MAX_WINDOW_DAYS = 60

/** Datas no formato AAAA-MM-DD. */
export interface DateWindow {
  startDate: string
  endDate: string
}

// ---------- registros ----------

export interface Instrument {
  displayName: string
}
export interface LinkedEvent {
  /** Padrão AAAA-MM-DDThh:mm:ss-TIPO-NNN, por exemplo 2026-09-05T15:04:00-FLR-001. */
  activityID: string
}
export interface SentNotification {
  messageID: string
  messageIssueTime: string
  messageURL: string
}
interface EventBase {
  link?: string
  instruments?: Instrument[] | null
  linkedEvents?: LinkedEvent[] | null
  sentNotifications?: SentNotification[] | null
  submissionTime?: string
  versionId?: number
}

/** Partículas solares energéticas: o evento do DONKI mais ligado à radiação que chega à tripulação. */
export interface SEP extends EventBase {
  sepID: string
  eventTime: string
}

/** Erupção solar, com classe A, B, C, M ou X (X é a mais forte). */
export interface FLR extends EventBase {
  flrID: string
  catalog?: string
  beginTime?: string
  peakTime?: string
  endTime?: string | null
  classType?: string
  sourceLocation?: string
  activeRegionNum?: number | null
  note?: string
}

/** Tempestade geomagnética, medida pelo índice Kp (0 a 9). */
export interface GST extends EventBase {
  gstID: string
  startTime: string
  allKpIndex?: { observedTime: string; kpIndex: number; source: string }[] | null
}

/** Aumento de elétrons no cinturão de radiação externo. */
export interface RBE extends EventBase {
  rbeID: string
  eventTime: string
}

/** Alerta ou relatório em texto, em inglês. messageBody é longo: use notificationSummary(). */
export interface Notification {
  messageType: string
  messageID: string
  messageURL: string
  messageIssueTime: string
  messageBody: string
}

/** Registros que o app ainda não usa (CME, IPS, MPC, HSS, WSA-Enlil): campos livres. */
export type DonkiRecord = Record<string, unknown>

// ---------- parâmetros ----------

export type NotificationType = 'FLR' | 'SEP' | 'CME' | 'IPS' | 'MPC' | 'GST' | 'RBE' | 'REPORT' | 'ALL'
/** class=M devolve só M e class=X só X (conferido em 2026-11-14). ALL devolve todas. */
export type FlareClass = 'ALL' | 'A' | 'B' | 'C' | 'M' | 'X'

interface Common {
  catalog?: string
  version?: string
}
interface CmeOptions extends Common {
  mostAccurateOnly?: boolean
  completeEntryOnly?: boolean
  speed?: number
  halfAngle?: number
  keyword?: string
  feature?: string
}

type Params = Record<string, string | number | boolean | undefined>

// ---------- requisição ----------

export class DonkiError extends Error {
  readonly status?: number
  constructor(message: string, status?: number) {
    super(message)
    this.name = 'DonkiError'
    this.status = status
  }
}

/** AAAA-MM-DD em UTC. */
export const isoDate = (d: Date) => d.toISOString().slice(0, 10)

/** Janela que termina hoje e cobre `days` dias contando hoje. */
export function lastDays(days: number, today = new Date()): DateWindow {
  const start = new Date(today.getTime() - (days - 1) * 86_400_000)
  return { startDate: isoDate(start), endDate: isoDate(today) }
}

/** Dias da janela, contando o primeiro e o último. */
export function windowDays({ startDate, endDate }: DateWindow) {
  return Math.round((Date.parse(endDate) - Date.parse(startDate)) / 86_400_000) + 1
}

function assertWindow(w: DateWindow) {
  const days = windowDays(w)
  if (!Number.isFinite(days) || days < 1) throw new DonkiError(`Invalid date window ${w.startDate}..${w.endDate}`)
  if (days > MAX_WINDOW_DAYS) throw new DonkiError(`Date window of ${days} days; DONKI accepts up to ${MAX_WINDOW_DAYS}`)
}

function url(resource: string, params: Params) {
  const u = new URL(`${DONKI_BASE}/get/${resource}`)
  for (const [k, v] of Object.entries(params)) if (v !== undefined) u.searchParams.set(k, String(v))
  return u.toString()
}

async function getText(resource: string, params: Params, signal?: AbortSignal) {
  const r = await fetch(url(resource, params), { signal })
  const text = await r.text()
  if (!r.ok) throw new DonkiError(`${resource}: HTTP ${r.status}${text ? ` (${text.slice(0, 120)})` : ''}`, r.status)
  return text
}

async function getList<T>(resource: string, w: DateWindow, params: Params, signal?: AbortSignal): Promise<T[]> {
  assertWindow(w)
  const text = await getText(resource, { ...w, ...params }, signal)
  if (!text.trim()) return [] // corpo vazio quando não há eventos
  const data: unknown = JSON.parse(text)
  return Array.isArray(data) ? (data as T[]) : []
}

// ---------- endpoints ----------

/** Todos os endpoints da documentação. Assinatura: (janela, opções?, signal?). */
export const donki = {
  notifications: (w: DateWindow, o: { type?: NotificationType } = {}, s?: AbortSignal) =>
    getList<Notification>('notifications', w, o, s),
  sep: (w: DateWindow, o: Common = {}, s?: AbortSignal) => getList<SEP>('SEP', w, { ...o }, s),
  flr: (w: DateWindow, o: Common & { class?: FlareClass } = {}, s?: AbortSignal) => getList<FLR>('FLR', w, { ...o }, s),
  gst: (w: DateWindow, o: Common = {}, s?: AbortSignal) => getList<GST>('GST', w, { ...o }, s),
  rbe: (w: DateWindow, o: Common = {}, s?: AbortSignal) => getList<RBE>('RBE', w, { ...o }, s),
  cme: (w: DateWindow, o: CmeOptions = {}, s?: AbortSignal) => getList<DonkiRecord>('CME', w, { ...o }, s),
  cmeAnalysis: (w: DateWindow, o: CmeOptions = {}, s?: AbortSignal) => getList<DonkiRecord>('CMEAnalysis', w, { ...o }, s),
  /** Uma linha de texto por análise. */
  cmeAnalysisText: (w: DateWindow, o: CmeOptions = {}, s?: AbortSignal) => {
    assertWindow(w)
    return getText('CMEAnalysis.txt', { ...w, ...o }, s)
  },
  /** Endereço da página do DONKI para uma CME (a API devolve a URL em texto puro). */
  cmeUrl: async (activityID: string, s?: AbortSignal) => (await getText('CME/url', { activityID }, s)).trim(),
  mpc: (w: DateWindow, o: Common = {}, s?: AbortSignal) => getList<DonkiRecord>('MPC', w, { ...o }, s),
  ips: (w: DateWindow, o: Common & { location?: string } = {}, s?: AbortSignal) => getList<DonkiRecord>('IPS', w, { ...o }, s),
  hss: (w: DateWindow, o: Common = {}, s?: AbortSignal) => getList<DonkiRecord>('HSS', w, { ...o }, s),
  wsaEnlilSimulations: (w: DateWindow, s?: AbortSignal) => getList<DonkiRecord>('WSAEnlilSimulations', w, {}, s),
}

// ---------- leitura dos campos ----------

/** Tipo de um evento ligado, lido do activityID (FLR, CME, SEP...). */
export function linkedType(activityID: string) {
  return /-(FLR|CME|SEP|GST|IPS|MPC|HSS|RBE)-\d+$/.exec(activityID)?.[1] ?? 'event'
}

/** Só a seção "## Summary:" do messageBody, sem cabeçalho nem texto legal. */
export function notificationSummary(body: string) {
  const m = /##\s*Summary:\s*([\s\S]*?)(?=\n##|\n\s*Community Coordinated Modeling Center Database Of Notifications, Knowledge, Information \(CCMC DONKI\) Disclaimer|$)/i.exec(
    body,
  )
  return (m?.[1] ?? '').replace(/\s+/g, ' ').trim()
}

/** Ordena classes de erupção: X > M > C > B > A, e o número dentro da classe (M2.4 > M1.1). */
export function flareRank(classType?: string) {
  const letter = ({ X: 4, M: 3, C: 2, B: 1, A: 0 } as Record<string, number>)[(classType ?? '')[0]] ?? 0
  return letter * 1000 + (parseFloat((classType ?? '').slice(1)) || 0)
}

export const kpMax = (g: GST) => Math.max(0, ...(g.allKpIndex ?? []).map((k) => k.kpIndex))
