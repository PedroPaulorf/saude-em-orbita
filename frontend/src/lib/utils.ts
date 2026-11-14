import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/** Junta classes condicionais e resolve conflitos do Tailwind (padrão do shadcn/ui). */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Formata um horário ISO como "09:42 UTC". */
export function utcTime(iso: string | undefined | null) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return `${d.toISOString().slice(11, 16)} UTC`
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** Formata uma data ISO como "05 Sep" (UTC). */
export function utcDay(iso: string | undefined | null) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return `${String(d.getUTCDate()).padStart(2, '0')} ${MONTHS[d.getUTCMonth()]}`
}

/** "just now", "2 min ago", "3 h ago"; acima de um dia, a data. */
export function ago(iso: string | undefined | null, now = Date.now()) {
  if (!iso) return '—'
  const t = Date.parse(iso)
  if (Number.isNaN(t)) return '—'
  const min = Math.round((now - t) / 60_000)
  if (min < 1) return 'just now'
  if (min < 60) return `${min} min ago`
  if (min < 24 * 60) return `${Math.round(min / 60)} h ago`
  return utcDay(iso)
}

/** Dia UTC (AAAA-MM-DD) de um horário ISO é hoje? */
export function isTodayUtc(iso: string | undefined | null) {
  return !!iso && iso.slice(0, 10) === new Date().toISOString().slice(0, 10)
}

/** Formata um horário ISO como "14 Nov 09:42 UTC". */
export function utcDateTime(iso: string | undefined | null) {
  if (!iso) return '—'
  return `${utcDay(iso)} ${utcTime(iso)}`
}
