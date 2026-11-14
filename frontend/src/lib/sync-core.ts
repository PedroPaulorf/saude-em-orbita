/** Persistent outbox protocol. Payloads stay identical after a lost response or reload. */
export interface ApiCheckIn {
  clientId: string; at: string; source: 'simulated'
  vitals: Record<string, number>; behavioral: Record<string, number>
  provenance?: Record<string, { method: 'manual' | 'simulated-device' | 'unknown'; quality: 'simulated' | 'unknown' }>
}
export interface Observation {
  metric: string; value: number; unit: string; observedAt: string
  method: string; quality: string; ruleVersion: string | null; baselineVersion: string | null
  status: string; explanation: string; clinicalSource: null
}
export interface OutboxEntry {
  payload: ApiCheckIn
  state: 'pending' | 'synced' | 'conflict' | 'rejected'
  error?: string; receivedAt?: string; observations?: Observation[]
}

export async function deliver(entry: OutboxEntry, send: (payload: ApiCheckIn) => Promise<Response>): Promise<OutboxEntry> {
  try {
    const response = await send(entry.payload)
    if (response.status === 200 || response.status === 201) {
      const body = await response.json()
      if (body.clientId !== entry.payload.clientId || typeof body.receivedAt !== 'string' || !Array.isArray(body.observations))
        throw new Error('Invalid acknowledgment')
      return { payload: entry.payload, state: 'synced', receivedAt: body.receivedAt, observations: body.observations }
    }
    if (response.status === 409) return { ...entry, state: 'conflict', error: 'Identifier conflict. Record retained for review.' }
    if (response.status >= 400 && response.status < 500 && response.status !== 408 && response.status !== 429)
      return { ...entry, state: 'rejected', error: `Server rejected this record (HTTP ${response.status}). Check configuration and data, then retry.` }
    return { ...entry, state: 'pending', error: `Server unavailable (HTTP ${response.status}). Will retry.` }
  } catch {
    return { ...entry, state: 'pending', error: 'No acknowledgment. Record retained for retry.' }
  }
}
