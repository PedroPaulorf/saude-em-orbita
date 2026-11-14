import type { Profile } from './api'

// Runtime identity only: a cached record can never select the signed-in account.
let activeProfile: Profile | null = null
const listeners = new Set<() => void>()
export const getActiveProfile = () => activeProfile
export const getActiveCrewId = () => activeProfile?.id
export function setActiveProfile(profile: Profile | null) {
  activeProfile = profile
  listeners.forEach(listener => listener())
}
export function subscribeActiveProfile(listener: () => void) {
  listeners.add(listener)
  return () => { listeners.delete(listener) }
}
export function scopedStorageKey(base: string, crewId = getActiveCrewId()): string | null {
  return crewId ? `${base}:${encodeURIComponent(crewId)}` : null
}
