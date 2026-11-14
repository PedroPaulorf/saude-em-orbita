/*
  Dados da tela Progress (plano v2, 7.4): tendências de 7 dias, histórico de check-ups com os pontos
  e a tripulação simulada. Tudo derivado dos registros e de simulated.json.
*/
import { GAME, type GameSummary } from '@/lib/game'
import { crew, evaluate, vitalConfigs, type VitalConfig } from '@/lib/health'
import type { CheckIn } from '@/lib/storage'
import type { Status, Vital } from '@/types'

/** Os 7 dias (UTC) que terminam hoje, como "08 Nov". */
export function lastSevenDays(today = new Date()) {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - (6 - i)))
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', timeZone: 'UTC' })
  })
}

/** Estado de cada dia do histórico, pela mesma regra de demonstração do app. */
export function dayStatuses(v: Vital): Status[] {
  const cfg = vitalConfigs.find((c) => c.id === v.id) as VitalConfig
  return (v.history ?? []).map((x) => evaluate(x - (v.baselineValue ?? cfg.baseline), cfg.rule))
}

/** "Below your baseline for 4 days in a row." — conta os dias seguidos, até hoje, fora da linha de base do mesmo lado. */
export function trendSentence(v: Vital): string {
  const hist = v.history ?? []
  if (!hist.length) return 'No measurements recorded in this window.'
  if (!v.observed) return 'No measurement today. Earlier observations are shown by their recorded date.'
  if (!Number.isFinite(v.baselineValue)) return 'No personal baseline is available for comparison.'
  const statuses = dayStatuses(v)
  if (statuses.every((s) => s === 'baseline')) return `Within your baseline for the last ${hist.length} days.`
  if (statuses[statuses.length - 1] === 'baseline') return 'Within your baseline today.'
  const side = (x: number) => (x < v.baselineValue! ? 'below' : 'above')
  const todaySide = side(hist[hist.length - 1])
  let n = 0
  for (let i = hist.length - 1; i >= 0 && statuses[i] !== 'baseline' && side(hist[i]) === todaySide; i--) {
    if (v.historyDays && i < hist.length - 1 && Date.parse(v.historyDays[i + 1]) - Date.parse(v.historyDays[i]) !== 86400000) break
    n++
  }
  const what = todaySide === 'below' ? 'Below' : 'Above'
  return n === 1 ? `${what} your baseline today.` : `${what} your baseline for ${n} days in a row.`
}

export interface HistoryRow {
  id: string
  at: string
  kind: CheckIn['kind'] | 'plan'
  /** Medidas fora da linha de base (só no check-up de saúde). */
  offCount: number | null
  points: number
}

/** Check-ups salvos, do mais novo para o mais antigo. Só o primeiro de cada tipo no dia ganha pontos. */
export function historyRows(checkIns: CheckIn[]): HistoryRow[] {
  const seen = new Set<string>()
  const rows = checkIns.filter(c => c.sync !== 'rejected').flatMap(c => c.kind === 'combined' ? [{ ...c, kind: 'health' as const }, { ...c, kind: 'behavioral' as const }] : [c]).map((c, i) => {
    const key = `${c.at.slice(0, 10)}:${c.kind}`
    const first = !seen.has(key)
    seen.add(key)
    let offCount: number | null = null
    if (c.kind === 'health' && vitalConfigs.some(cfg => c.vitals[cfg.id] != null && Number.isFinite(cfg.baseline))) {
      offCount = vitalConfigs.filter((cfg) => {
        const value = c.vitals[cfg.id]
        return value != null && evaluate(value - cfg.baseline, cfg.rule) !== 'baseline'
      }).length
    }
    const points = first ? (c.kind === 'health' ? GAME.points.healthCheckUp : GAME.points.behavioralCheckIn) : 0
    return { id: `${c.at}-${c.kind}-${i}`, at: c.at, kind: c.kind, offCount, points }
  })
  return rows.reverse()
}

export interface CrewRow {
  id: string
  displayName: string
  weekPoints: number
  routineDoneToday: boolean
  you: boolean
}

/** Tripulação desta semana (colegas SIMULADOS) com a pessoa incluída, e a meta coletiva de hoje. */
export function crewBoard(game: GameSummary) {
  const todayKey = game.today.day
  const weekStart = new Date(`${todayKey}T00:00:00Z`)
  weekStart.setUTCDate(weekStart.getUTCDate() - 6)
  const myWeek =
    GAME.weekPointsBeforeToday +
    game.days.filter((d) => d.day >= weekStart.toISOString().slice(0, 10)).reduce((s, d) => s + d.total, 0)
  const rows: CrewRow[] = [
    ...GAME.crew.filter(c => c.id !== crew.id).map((c) => ({ ...c, you: false })),
    { id: crew.id, displayName: crew.displayName, weekPoints: myWeek, routineDoneToday: game.today.fullRoutine, you: true },
  ].sort((a, b) => b.weekPoints - a.weekPoints)
  const done = rows.filter((r) => r.routineDoneToday).length
  return { rows, done, total: rows.length }
}
