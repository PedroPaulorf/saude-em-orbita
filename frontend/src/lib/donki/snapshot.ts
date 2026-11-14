/*
  O que o Health7 usa do DONKI (tabela "O que o Health 7 precisa" da nota do cofre):

  | Indicador                          | Endpoint                     |
  | Alerta principal ligado à radiação | /get/SEP                     |
  | Contexto: erupções fortes          | /get/FLR (filtramos >= M)    |
  | Contexto: tempestades magnéticas   | /get/GST (índice Kp)         |
  | Texto do alerta original           | /get/notifications?type=SEP  |

  Pedimos FLR com class=ALL e filtramos no app: class=M devolve só M e
  deixaria as erupções X de fora (conferido em 2026-11-14).

  Sem aliases (@/...): também roda no Node, no script de snapshot.
*/
import {
  donki,
  flareRank,
  kpMax,
  linkedType,
  notificationSummary,
  type DateWindow,
  type Notification,
  type SEP,
} from './api.ts'

/** Só os campos que o app mostra. É o formato guardado no cache e no JSON do repositório. */
export interface DonkiSnapshot {
  window: DateWindow
  fetchedAt: string
  sep: {
    id: string
    time: string
    link?: string
    instruments: string[]
    /** Tipos dos eventos ligados, lidos do activityID (ex.: ["FLR", "CME"]). */
    linked: string[]
    /** Primeiro alerta enviado pelo DONKI sobre este SEP. */
    alert?: { id: string; issued: string; url: string; summary: string }
  }[]
  flr: { id: string; classType: string; peakTime: string; link?: string }[]
  gst: { id: string; startTime: string; kp: number; link?: string }[]
}

function alertFor(sep: SEP, notifications: Notification[]): NonNullable<DonkiSnapshot['sep'][number]['alert']> | undefined {
  const sorted = [...notifications].sort((a, b) => Date.parse(a.messageIssueTime) - Date.parse(b.messageIssueTime))
  const match = sorted.find((n) => n.messageBody.includes(sep.sepID))
  if (match) {
    return { id: match.messageID, issued: match.messageIssueTime, url: match.messageURL, summary: notificationSummary(match.messageBody) }
  }
  // Sem a notificação completa, ao menos o link do primeiro alerta enviado.
  const sent = sep.sentNotifications?.[0]
  return sent ? { id: sent.messageID, issued: sent.messageIssueTime, url: sent.messageURL, summary: '' } : undefined
}

/** Consulta os quatro endpoints e reduz ao formato do app. */
export async function fetchSnapshot(window: DateWindow, signal?: AbortSignal): Promise<DonkiSnapshot> {
  const [sep, flr, gst] = await Promise.all([
    donki.sep(window, {}, signal),
    donki.flr(window, { class: 'ALL' }, signal),
    donki.gst(window, {}, signal),
  ])
  // O corpo das notificações é pesado: só buscamos quando há SEP.
  const notifications = sep.length ? await donki.notifications(window, { type: 'SEP' }, signal) : []

  return {
    window,
    fetchedAt: new Date().toISOString(),
    sep: sep.map((e) => ({
      id: e.sepID,
      time: e.eventTime,
      link: e.link,
      instruments: (e.instruments ?? []).map((i) => i.displayName),
      linked: [...new Set((e.linkedEvents ?? []).map((l) => linkedType(l.activityID)))],
      alert: alertFor(e, notifications),
    })),
    flr: flr
      .filter((e) => e.classType && e.peakTime)
      .map((e) => ({ id: e.flrID, classType: e.classType!, peakTime: e.peakTime!, link: e.link })),
    gst: gst.map((e) => ({ id: e.gstID, startTime: e.startTime, kp: kpMax(e), link: e.link })),
  }
}

// ---------- indicadores ----------

const latestBy = <T,>(list: T[], time: (x: T) => string) =>
  list.reduce<T | undefined>((m, x) => (!m || Date.parse(time(x)) > Date.parse(time(m)) ? x : m), undefined)

type SepRecord = DonkiSnapshot['sep'][number]

/** Registros de modelos de previsão (instrumento "MODEL: ..."), não detecções. */
export const isModelSep = (e: SepRecord) => e.instruments.length > 0 && e.instruments.every((i) => i.startsWith('MODEL:'))

/**
 * O registro a destacar: a primeira detecção (não modelo) do episódio mais recente,
 * de preferência com alerta. É ela que dispara o alerta original do DONKI.
 */
function featuredSep(list: SepRecord[]): SepRecord | undefined {
  const latest = latestBy(list, (e) => e.time)
  if (!latest) return undefined
  const sameDay = list
    .filter((e) => e.time.slice(0, 10) === latest.time.slice(0, 10))
    .sort((a, b) => Date.parse(a.time) - Date.parse(b.time))
  const detected = sameDay.filter((e) => !isModelSep(e))
  return detected.find((e) => e.alert?.summary) ?? detected[0] ?? sameDay[0]
}

export interface Indicators {
  sep: { count: number; modelCount: number; featured?: SepRecord }
  flr: { count: number; strongCount: number; strongest?: DonkiSnapshot['flr'][number] }
  gst: { count: number; kpMax: number | null; latest?: DonkiSnapshot['gst'][number] }
}

/** Erupção "forte" no app: classe M ou X. É um corte do app, não um critério da NASA. */
export const isStrongFlare = (classType: string) => /^[MX]/.test(classType)

export function indicators(s: DonkiSnapshot): Indicators {
  return {
    sep: { count: s.sep.length, modelCount: s.sep.filter(isModelSep).length, featured: featuredSep(s.sep) },
    flr: {
      count: s.flr.length,
      strongCount: s.flr.filter((e) => isStrongFlare(e.classType)).length,
      strongest: s.flr.reduce<DonkiSnapshot['flr'][number] | undefined>(
        (m, e) => (!m || flareRank(e.classType) > flareRank(m.classType) ? e : m),
        undefined,
      ),
    },
    gst: {
      count: s.gst.length,
      kpMax: s.gst.length ? Math.max(...s.gst.map((g) => g.kp)) : null,
      latest: latestBy(s.gst, (g) => g.startTime),
    },
  }
}
