import { useEffect, useSyncExternalStore } from 'react'
import { loadCheckIns, prepareOutbox, updateOutbox, useCheckInsVersion } from '@/lib/storage'
import { deliver, type ApiCheckIn, type Observation } from './sync-core'

const API_URL = (import.meta.env.VITE_HEALTH_API_URL ?? '').trim().replace(/\/$/, '')
const API_KEY = (import.meta.env.VITE_HEALTH_API_KEY ?? '').trim()
export const API_CONFIGURED = !!API_URL && !!API_KEY
export const CREW_ID = 'crew-02'
const listeners = new Set<() => void>()
let state = { running: false, error: '', checked: false }
let flight: Promise<void> | null = null
const publish = (next: Partial<typeof state>) => { state = { ...state, ...next }; listeners.forEach((cb) => cb()) }

export function medicalRequest(path: string, init: RequestInit = {}) {
  return fetch(`${API_URL}/api/v1${path}`, { ...init,
    headers: { 'Content-Type': 'application/json', 'X-API-Key': API_KEY }, signal: AbortSignal.timeout(10_000) })
}

export function syncNow() {
  if (!API_CONFIGURED) return Promise.resolve()
  if (flight) return flight
  flight = (async () => {
    publish({ running: true, error: '' })
    try {
      prepareOutbox()
      const pending = loadCheckIns().flatMap((r) => r.sync?.state === 'pending' ? [r.sync] : [])
      for (const entry of pending) {
        // A demonstration reset may have removed this record while another request was in flight.
        if (!loadCheckIns().some((r) => r.sync?.payload.clientId === entry.payload.clientId)) continue
        const next = await deliver(entry, (payload) => medicalRequest(`/crew/${CREW_ID}/checkins`, { method: 'POST', body: JSON.stringify(payload) }))
        updateOutbox(entry.payload.clientId, next)
        if (next.state === 'pending') { publish({ error: next.error }); break }
      }
      publish({ checked: true })
    } catch (error) { publish({ error: error instanceof Error ? error.message : 'Synchronization failed.' }) }
    finally { publish({ running: false }); flight = null }
  })().finally(() => { flight = null })
  return flight
}

/** Mounted once by App: start, reconnect, new record and bounded periodic retries. */
export function useMedicalSync() {
  useCheckInsVersion()
  const current = useSyncExternalStore((cb) => { listeners.add(cb); return () => listeners.delete(cb) }, () => state)
  useEffect(() => {
    void syncNow()
    const run = () => { void syncNow() }
    window.addEventListener('online', run)
    window.addEventListener('health7:outbox', run)
    const timer = window.setInterval(run, 30_000)
    return () => { clearInterval(timer); window.removeEventListener('online', run); window.removeEventListener('health7:outbox', run) }
  }, [])
  return current
}

export function retryRejected() {
  for (const r of loadCheckIns()) if (r.sync?.state === 'rejected') updateOutbox(r.sync.payload.clientId, { ...r.sync, state: 'pending', error: undefined })
  return syncNow()
}

export interface ServerCheckIn extends ApiCheckIn { id: string; receivedAt: string; observations: Observation[] }
export async function serverHistory(): Promise<ServerCheckIn[]> {
  const response = await medicalRequest(`/crew/${CREW_ID}/checkins?limit=20`)
  if (!response.ok) throw new Error(`Could not load server history (HTTP ${response.status}).`)
  return (await response.json()).items
}
