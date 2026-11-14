/*
  Armazenamento local (decisão de 2026-11-14): tudo fica no localStorage, em JSON.
  Sem servidor; funciona sem conexão. Os dados ficam só neste navegador.
*/
import type { VitalId } from '@/types'

const KEY = 'health7:checkins:v1'

export interface CheckIn {
  /** Horário ISO do envio. */
  at: string
  vitals: Partial<Record<VitalId, number>> & { bloodPressureDiastolic?: number }
  /** Autorrelato de 1 a 5, por pergunta. Sem pontuação somada. */
  behavioral: Record<string, number>
}

export function loadCheckIns(): CheckIn[] {
  try {
    const raw = localStorage.getItem(KEY)
    const parsed: unknown = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? (parsed as CheckIn[]) : []
  } catch {
    return []
  }
}

export function latestCheckIn(): CheckIn | null {
  const all = loadCheckIns()
  return all.length ? all[all.length - 1] : null
}

export function saveCheckIn(checkIn: CheckIn) {
  try {
    localStorage.setItem(KEY, JSON.stringify([...loadCheckIns(), checkIn]))
  } catch {
    // Sem espaço ou bloqueado: o app segue sem salvar.
  }
}

export function clearCheckIns() {
  try {
    localStorage.removeItem(KEY)
  } catch {
    // ignorado
  }
}
