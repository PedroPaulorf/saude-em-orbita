import { useSyncExternalStore } from 'react'
import type { VitalId } from '@/types'
import { getActiveCrewId, scopedStorageKey, subscribeActiveProfile } from './active-profile'
import { createClientId } from './api'
import type { MedicalObservation, Provenance } from './medical-types'
import simulated from '@/data/simulated.json'

export type CheckInKind = 'health' | 'behavioral' | 'combined'
type Vitals = Partial<Record<VitalId, number>> & { bloodPressureDiastolic?: number }
export interface CheckIn {
  clientId: string
  kind: CheckInKind
  at: string
  source: 'simulated'
  vitals: Vitals
  behavioral: Record<string, number>
  healthDetails?: { urine?: string; stool?: string }
  provenance?: Record<string, Provenance>
  observations?: MedicalObservation[]
  id?: string
  crewId?: string
  receivedAt?: string
  sync?: 'pending' | 'saved' | 'rejected'
  syncError?: string
}
export type CheckInInput = Omit<CheckIn, 'clientId' | 'kind' | 'source' | 'vitals' | 'behavioral'> & {
  clientId?: string; kind?: CheckInKind; source?: 'simulated'; vitals?: Vitals; behavioral?: Record<string, number>
}
export type HealthCheckIn = CheckInInput & { kind: 'health'; vitals: Vitals }
export type BehavioralCheckIn = CheckInInput & { kind: 'behavioral'; behavioral: Record<string, number> }
export const hasHealthAnswers = (record: Pick<CheckInInput, 'vitals' | 'healthDetails'>) => Object.keys(record.vitals ?? {}).length > 0 || Object.keys(record.healthDetails ?? {}).length > 0

const key = (crewId?: string) => scopedStorageKey('health7:checkins:v2', crewId)
let version = 0
const listeners = new Set<() => void>()
function changed() { version++; listeners.forEach(listener => listener()) }
subscribeActiveProfile(changed)

/** Backend records have no kind; derive it from the domains actually present. */
export function normalizeCheckIn(record: CheckInInput): CheckIn {
  const vitals = record.vitals ?? {}, behavioral = record.behavioral ?? {}
  const health = hasHealthAnswers(record), behavior = Object.keys(behavioral).length > 0
  const kind = health && behavior ? 'combined' : health ? 'health' : behavior ? 'behavioral' : record.kind ?? 'health'
  return { ...record, clientId: record.clientId ?? createClientId(), kind, source: record.source ?? 'simulated', vitals, behavioral }
}
export function loadCheckIns(crewId = getActiveCrewId()): CheckIn[] {
  const storageKey = key(crewId)
  if (!storageKey) return []
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(storageKey) ?? '[]')
    if (!Array.isArray(parsed)) return []
    return parsed.filter((r): r is CheckInInput => !!r && typeof r === 'object' && typeof r.clientId === 'string' && typeof r.at === 'string')
      .filter(r => !r.crewId || r.crewId === crewId)
      .map(normalizeCheckIn).sort((a, b) => a.at.localeCompare(b.at))
  } catch { return [] }
}
function write(crewId: string | undefined, records: CheckIn[]) {
  const storageKey = key(crewId)
  if (!storageKey) throw new Error('Sign in before saving a check-in.')
  try {
    const current = localStorage.getItem(storageKey)
    if (current !== null && !Array.isArray(JSON.parse(current))) throw new Error('Invalid stored history')
    localStorage.setItem(storageKey, JSON.stringify(records))
  }
  catch { throw new Error('Could not save on this device. Free storage or allow browser storage, then try again.') }
  changed()
}
export function saveCheckIn(record: CheckInInput): void
export function saveCheckIn(crewId: string, record: CheckInInput): void
export function saveCheckIn(ownerOrRecord: string | CheckInInput, input?: CheckInInput) {
  const crewId = typeof ownerOrRecord === 'string' ? ownerOrRecord : getActiveCrewId()
  const record = normalizeCheckIn(typeof ownerOrRecord === 'string' ? input! : ownerOrRecord)
  if (record.crewId && record.crewId !== crewId) throw new Error('This check-in belongs to a different account.')
  const all = loadCheckIns(crewId)
  if (all.some(c => c.clientId === record.clientId)) return
  const provenance: Record<string, Provenance> = record.provenance ?? Object.fromEntries(Object.keys(record.vitals).map(id => {
    const config = simulated.vitals.find(v => v.id === (id === 'bloodPressureDiastolic' ? 'bloodPressure' : id))
    return [id, { method: config?.input === 'device' ? 'simulated-device' : 'manual', quality: 'simulated' }]
  }))
  write(crewId, [...all, { ...record, ...(Object.keys(provenance).length ? { provenance } : {}), sync: 'pending' }])
}
export function replaceCheckIns(crewId: string, server: CheckInInput[]) {
  const merged = new Map(loadCheckIns(crewId).map(c => [c.clientId, c]))
  server.filter(c => !c.crewId || c.crewId === crewId).forEach(c => {
    const normalized = normalizeCheckIn(c)
    merged.set(normalized.clientId, { ...normalized, sync: 'saved' })
  })
  write(crewId, [...merged.values()].sort((a, b) => a.at.localeCompare(b.at)))
}
export function rejectCheckIn(crewId: string, clientId: string, syncError: string) {
  write(crewId, loadCheckIns(crewId).map(c => c.clientId === clientId ? { ...c, sync: 'rejected', syncError } : c))
}
export function latestCheckIn(kind: 'health' | 'behavioral'): CheckIn | null {
  return loadCheckIns().filter(c => c.sync !== 'rejected' && (c.kind === kind || c.kind === 'combined')).at(-1) ?? null
}
export function latestAny(crewId = getActiveCrewId()): CheckIn | null {
  return loadCheckIns(crewId).filter(c => c.sync !== 'rejected').at(-1) ?? null
}
export function clearCheckIns(crewId = getActiveCrewId()) { write(crewId, []) }
export function cacheCheckIns(crewId: string, server: CheckInInput[]) {
  const pending = loadCheckIns(crewId).filter(c => c.sync !== 'saved')
  const saved = server.filter(c => !c.crewId || c.crewId === crewId).map(c => ({ ...normalizeCheckIn(c), sync: 'saved' as const }))
  const byId = new Map([...pending, ...saved].map(c => [c.clientId, c]))
  write(crewId, [...byId.values()].sort((a, b) => a.at.localeCompare(b.at)))
}
export function useCheckInsVersion() {
  return useSyncExternalStore(listener => {
    listeners.add(listener)
    if (typeof window !== 'undefined') window.addEventListener('storage', listener)
    return () => { listeners.delete(listener); if (typeof window !== 'undefined') window.removeEventListener('storage', listener) }
  }, () => version, () => 0)
}
