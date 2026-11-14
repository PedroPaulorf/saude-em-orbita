/*
  Textos e agrupamentos de apresentação usados por mais de uma tela.
  Ficam fora dos componentes para o fast refresh do Vite funcionar.
*/
import { Check, Radio, TrendingUp, type LucideIcon } from 'lucide-react'
import type { SpaceWeatherState } from '@/lib/donki'
import { ago, utcDateTime, utcDay } from '@/lib/utils'
import type { BodyRegionId, Connection, Status, Vital } from '@/types'

/** Os três estados de uma medida: ícone, palavra e classes do selo. Não crie um quarto. */
export const STATUS: Record<Status, { text: string; Icon: LucideIcon; className: string }> = {
  // Estado calmo: sem caixa, texto de apoio com check.
  baseline: { text: 'Within baseline', Icon: Check, className: 'text-ink-soft' },
  attention: { text: 'Attention', Icon: TrendingUp, className: 'bg-attention-tint text-brand px-2' },
  flagged: { text: 'Flagged for ground', Icon: Radio, className: 'bg-flag-tint text-flag-ink px-2' },
}

export const REGION_NAMES: Record<BodyRegionId, string> = {
  head: 'Head',
  chest: 'Chest',
  core: 'Core',
  leftArm: 'Left arm',
  rightArm: 'Right arm',
  leftLeg: 'Left leg',
  rightLeg: 'Right leg',
}

/** "2 measures differ from your baseline" ou "All measures within your baseline". */
export function summarySentence(vitals: Vital[]) {
  if (vitals.every(v => v.observed === false)) return 'No measurements recorded today'
  const n = vitals.filter((v) => v.observed !== false && v.status !== 'baseline').length
  if (n === 0) return vitals.some(v => v.observed === false) ? 'Some measurements are missing today' : 'All measures within your baseline'
  return `${n} ${n === 1 ? 'measure differs' : 'measures differ'} from your baseline`
}

/** Itens do relatório para o solo: só medidas em atenção ou sinalizadas, as sinalizadas primeiro. */
export function reportItems(vitals: Vital[]) {
  return vitals
    .filter((v) => v.observed !== false && v.status !== 'baseline')
    .sort((a, b) => (a.status === b.status ? 0 : a.status === 'flagged' ? -1 : 1))
}

/** Estado do envio do relatório. */
export function sendState(connection: Connection) {
  if (connection === 'queued') return 'Queued on this device'
  if (connection === 'online') return 'Saved to server · ground delivery not connected'
  return "Waiting for today's check-up"
}

/** "5 Sep" ou "10 Sep 2026", a partir de AAAA-MM-DD. */
export function dayLabel(date: string, withYear = false) {
  const day = utcDay(`${date}T00:00:00Z`).replace(/^0/, '')
  return withYear ? `${day} ${date.slice(0, 4)}` : day
}

/** Idade e origem do dado do DONKI (plano v2, seção 9). O cartão não promete "agora". */
export function dataAge(state: SpaceWeatherState) {
  const at = state.snapshot.fetchedAt
  switch (state.source) {
    case 'live':
      return `Live · synced ${ago(at)}`
    case 'cache':
      return `Last ground sync · ${utcDateTime(at)}`
    case 'bundled':
      return `Stored copy · ${utcDateTime(at)}`
    case 'history':
      return `Past event · ${dayLabel(state.snapshot.window.startDate, true)}`
  }
}
