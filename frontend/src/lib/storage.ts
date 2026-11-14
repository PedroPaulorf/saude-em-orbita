import type { VitalId } from '@/types'
export interface CheckIn {
  clientId: string
  at: string
  source: 'simulated'
  vitals: Partial<Record<VitalId, number>> & { bloodPressureDiastolic?: number }
  behavioral: Record<string, number>
  id?: string
  crewId?: string
  receivedAt?: string
  sync?: 'pending' | 'saved' | 'rejected'
  syncError?: string
}
const key = (crewId: string) => `health7:checkins:v2:${encodeURIComponent(crewId)}`
export function loadCheckIns(crewId: string): CheckIn[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(key(crewId)) ?? '[]')
    return Array.isArray(parsed) ? parsed.filter(x => x && typeof x.clientId === 'string' && typeof x.at === 'string' && x.vitals && x.behavioral) : []
  } catch { return [] }
}
function write(crewId: string, records: CheckIn[]) {
  try { localStorage.setItem(key(crewId), JSON.stringify(records)) }
  catch { throw new Error('Could not save on this device. Free storage or allow browser storage, then try again.') }
}
export function saveCheckIn(crewId: string, checkIn: CheckIn) {
  const all = loadCheckIns(crewId)
  if (all.some(c => c.clientId === checkIn.clientId)) return
  write(crewId, [...all, { ...checkIn, sync: 'pending' }])
}
export function replaceCheckIns(crewId: string, server: CheckIn[]) {
  const merged = new Map(loadCheckIns(crewId).map(c => [c.clientId, c]))
  server.forEach(c => merged.set(c.clientId, { ...c, sync: 'saved' }))
  write(crewId, [...merged.values()].sort((a, b) => a.at.localeCompare(b.at)))
}
export function rejectCheckIn(crewId: string, clientId: string, syncError: string) {
  write(crewId, loadCheckIns(crewId).map(c => c.clientId === clientId ? { ...c, sync: 'rejected', syncError } : c))
}
export const latestCheckIn = (crewId: string) => loadCheckIns(crewId).at(-1) ?? null


export function cacheCheckIns(crewId:string, server:CheckIn[]) {
  const pending=loadCheckIns(crewId).filter(c=>c.sync!=='saved')
  const byId=new Map([...pending,...server.map(c=>({...c,sync:'saved' as const}))].map(c=>[c.clientId,c]))
  write(crewId,[...byId.values()].sort((a,b)=>a.at.localeCompare(b.at)))
}
