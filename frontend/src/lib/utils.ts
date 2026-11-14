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

/** Formata um horário ISO como "14 Nov 09:42 UTC". */
export function utcDateTime(iso: string | undefined | null) {
  if (!iso) return '—'
  return `${utcDay(iso)} ${utcTime(iso)}`
}
