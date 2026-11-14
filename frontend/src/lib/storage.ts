/*
  Armazenamento local (decisão de 2026-11-14): tudo fica no localStorage, em JSON.
  Sem servidor; funciona sem conexão. Os dados ficam só neste navegador.

  v2 (plano do front-end v2, 7.2): o check-up de saúde e o check-in comportamental são
  registros separados, com `kind`, na chave "health7:checkins:v2".
  Na primeira leitura, o que houver em "health7:checkins:v1" (saúde e comportamento juntos)
  é migrado: cada registro antigo vira dois. A chave v1 fica onde está, sem ser apagada.
*/
import { useSyncExternalStore } from 'react'
import type { VitalId } from '@/types'

const KEY = 'health7:checkins:v2'
const KEY_V1 = 'health7:checkins:v1'

export type CheckInKind = 'health' | 'behavioral'

export interface HealthCheckIn {
  kind: 'health'
  /** Horário ISO do envio. */
  at: string
  vitals: Partial<Record<VitalId, number>> & { bloodPressureDiastolic?: number }
}

export interface BehavioralCheckIn {
  kind: 'behavioral'
  at: string
  /** Autorrelato de 1 a 5, por pergunta. Sem pontuação somada. */
  behavioral: Record<string, number>
}

export type CheckIn = HealthCheckIn | BehavioralCheckIn
type OfKind<K extends CheckInKind> = Extract<CheckIn, { kind: K }>

/** Formato v1: um registro com as duas partes. */
interface CheckInV1 {
  at: string
  vitals?: HealthCheckIn['vitals']
  behavioral?: Record<string, number>
}

function read(key: string): unknown[] | null {
  try {
    const raw = localStorage.getItem(key)
    if (raw == null) return null
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

// Avisa quem mostra dados derivados dos registros (cabeçalho, Home) quando algo é salvo.
let version = 0
const listeners = new Set<() => void>()

function write(list: CheckIn[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list))
  } catch {
    // Sem espaço ou bloqueado: o app segue sem salvar.
  }
  version++
  listeners.forEach((l) => l())
}

/** Número que muda a cada gravação; use para recalcular o que depende dos registros. */
export function useCheckInsVersion() {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
    () => version,
    () => 0,
  )
}

/** Cada registro v1 vira um de saúde e um comportamental (só as partes preenchidas). */
export function migrateV1(old: CheckInV1[]): CheckIn[] {
  const out: CheckIn[] = []
  for (const r of old) {
    if (!r || typeof r.at !== 'string') continue
    if (r.vitals && Object.keys(r.vitals).length) out.push({ kind: 'health', at: r.at, vitals: r.vitals })
    if (r.behavioral && Object.keys(r.behavioral).length) out.push({ kind: 'behavioral', at: r.at, behavioral: r.behavioral })
  }
  return out
}

/** Todos os registros, do mais antigo para o mais novo. */
export function loadCheckIns(): CheckIn[] {
  const v2 = read(KEY)
  if (v2) return v2.filter((r): r is CheckIn => !!r && typeof r === 'object' && 'kind' in r && 'at' in r)
  const v1 = read(KEY_V1)
  if (!v1?.length) return []
  const migrated = migrateV1(v1 as CheckInV1[])
  write(migrated)
  return migrated
}

/** Último registro de um tipo. */
export function latestCheckIn<K extends CheckInKind>(kind: K): OfKind<K> | null {
  const all = loadCheckIns()
  for (let i = all.length - 1; i >= 0; i--) if (all[i].kind === kind) return all[i] as OfKind<K>
  return null
}

/** Último registro de qualquer tipo. */
export function latestAny(): CheckIn | null {
  const all = loadCheckIns()
  return all.length ? all[all.length - 1] : null
}

export function saveCheckIn(checkIn: CheckIn) {
  write([...loadCheckIns(), checkIn])
}

/** Apaga os registros. Grava uma lista vazia (e não remove a chave) para o v1 não ser migrado de novo. */
export function clearCheckIns() {
  write([])
}
