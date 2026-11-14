import type { CheckIn } from './storage'
import type { VitalId } from '@/types'
export interface Profile {
  id: string
  displayName: string
  missionDay: number
  bodyModel: 'male' | 'female'
  /** 'synthetic-nexus': tripulante fictício da pesquisa NEXUS-Med (npm run import:nexus). */
  source: 'simulated' | 'synthetic-nexus'
  baseline: Partial<Record<VitalId, number>> & { bloodPressureDiastolic: number; urinations24h?: number }
  scenario?: string
  nexus?: { crewId: string; role: string; anchorDate: string; todayDay: number; notice: string }
}
export interface SymptomEvent { id: string; at: string; receivedAt: string; type: 'start' | 'evolution' | 'resolution'; severity?: number; note?: string }
export interface Symptom {
  id: string; at: string; onsetAt?: string; label: string; bodyPart: string; severity: number; note?: string
  status: 'active' | 'resolved'; events: SymptomEvent[]; lastObservation?: SymptomEvent; eventsTruncated?: boolean
}
export interface History<T> { items: T[]; from: string; to: string; truncated: boolean; eventsTruncated?: boolean }
export class ApiError extends Error {
  status: number
  constructor(message: string, status = 0) { super(message); this.status = status }
  get retryable() { return this.status === 0 || this.status === 408 || this.status === 429 || this.status >= 500 }
}
export function apiBase(configured?: string, location = window.location) {
  const hostname=location.hostname.replace(/^\[|\]$/g,'')
  return (configured || `${location.protocol}//${hostname.includes(':') ? `[${hostname}]` : hostname}:3001`).replace(/\/$/, '') + '/api/v1'
}
export async function apiRequest<T>(path: string, body?: unknown, signal?: AbortSignal, expectedCrew?: string): Promise<T> {
  const timeout = AbortSignal.timeout(12000)
  try {
    const response = await fetch(apiBase(import.meta.env.VITE_API_URL) + path, {
      method: body === undefined ? 'GET' : 'POST', credentials: 'include',
      headers: { ...(body === undefined ? {} : { 'Content-Type': 'application/json', 'X-Requested-With': 'Health7' }), ...(expectedCrew ? { 'X-Health7-Crew': expectedCrew } : {}) },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
    })
    if (!response.ok) {
      const data = await response.json().catch(() => ({}))
      throw new ApiError(response.status === 401 ? 'Your session expired. Sign in again.' : data.message || `Request failed (${response.status}).`, response.status)
    }
    return response.status === 204 ? undefined as T : await response.json() as T
  } catch (error) {
    if (error instanceof ApiError) throw error
    if (signal?.aborted) throw error
    throw new ApiError(timeout.aborted ? 'The server took too long. Your pending records stay on this device.' : 'Cannot reach the server. Your pending records stay on this device.')
  }
}
export const checkInPayload = (c: CheckIn) => ({ clientId: c.clientId, at: c.at, source: c.source, vitals: c.vitals, behavioral: c.behavioral,
  ...(c.healthDetails ? { healthDetails: c.healthDetails } : {}), ...(c.provenance ? { provenance: c.provenance } : {}) })

export function createClientId(cryptoApi:Crypto=crypto):string {
  if(cryptoApi.randomUUID)return cryptoApi.randomUUID()
  const bytes=cryptoApi.getRandomValues(new Uint8Array(16))
  bytes[6]=(bytes[6]&15)|64
  bytes[8]=(bytes[8]&63)|128
  const hex=Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('')
  return [hex.slice(0,8),hex.slice(8,12),hex.slice(12,16),hex.slice(16,20),hex.slice(20)].join('-')
}
