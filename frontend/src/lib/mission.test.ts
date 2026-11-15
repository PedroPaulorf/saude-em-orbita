import { beforeEach, describe, expect, it } from 'vitest'
import { getMission, MISSIONS, missionById, setMission } from './mission'

describe('mission', () => {
  beforeEach(() => {
    const data = new Map<string, string>()
    Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
      getItem: (key: string) => data.get(key) ?? null,
      setItem: (key: string, value: string) => data.set(key, value),
      removeItem: (key: string) => data.delete(key),
    } })
  })

  it('has three missions with unique ids and a duration', () => {
    expect(MISSIONS).toHaveLength(3)
    expect(new Set(MISSIONS.map((m) => m.id)).size).toBe(3)
    for (const m of MISSIONS) expect(m.durationDays).toBeGreaterThan(0)
  })

  it('stores the choice per account', () => {
    expect(getMission('crew-02')).toBeNull()
    setMission('crew-02', 'mars')
    expect(getMission('crew-02')?.id).toBe('mars')
    expect(getMission('crew-03')).toBeNull()
    setMission('crew-02', null)
    expect(getMission('crew-02')).toBeNull()
  })

  it('ignores unknown ids', () => {
    expect(missionById('pluto')).toBeNull()
  })
})
