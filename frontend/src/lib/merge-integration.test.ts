import { beforeEach, expect, test } from 'vitest'
import { setActiveProfile } from './active-profile'
import type { Profile } from './api'
import { applyScenario, SCENARIOS } from './demo'
import { getTodayVitals, vitalConfigs } from './health'
import { savePlans, loadPlans } from './plans'
import { runLength } from './prevention'
import { trendSentence, historyRows } from './progress'
import { dailyPoints, summarize } from './game'
import { crewBoard } from './progress'
import { parseMeasure } from './checkin'
import { loadCheckIns, normalizeCheckIn, replaceCheckIns } from './storage'
import { loadWater } from './water'

const profile = (id: string): Profile => ({ id, displayName: id, missionDay: 1, bodyModel: 'female', source: 'simulated', baseline: { sleep: 8, heartRate: 60, bloodPressure: 110, bloodPressureDiastolic: 70, temperature: 36.5 } })
beforeEach(() => {
  const data = new Map<string, string>()
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => data.set(key, value) } })
  setActiveProfile(null)
})

test('combined server records count both check-ups once, and rejected records count neither', () => {
  const combined = normalizeCheckIn({ clientId: 'combined', at: '2026-11-14T10:00:00Z', vitals: { sleep: 7 }, behavioral: { rest: 3 } })
  expect(combined.kind).toBe('combined')
  expect(historyRows([combined]).map(row => row.kind).sort()).toEqual(['behavioral', 'health'])
  const points = dailyPoints([combined], {})[0]
  expect(points.healthDone && points.behavioralDone).toBe(true)
  expect(dailyPoints([{ ...combined, sync: 'rejected' }], {})).toEqual([])
})

test('missing dates break a consecutive-day pattern and keep graph dates aligned', () => {
  const own = profile('a')
  setActiveProfile(own)
  const records = ['2026-11-11', '2026-11-13', '2026-11-14'].map((day, i) => normalizeCheckIn({ clientId: String(i), at: day + 'T12:00:00Z', vitals: { sleep: 5 } }))
  replaceCheckIns('a', records)
  const sleep = getTodayVitals(new Date('2026-11-14T20:00:00Z')).find(v => v.id === 'sleep')!
  expect(sleep.historyDays).toEqual(['2026-11-11', '2026-11-13', '2026-11-14'])
  expect(runLength(sleep, vitalConfigs.find(c => c.id === 'sleep')!, 'below')).toBe(2)
  expect(trendSentence(sleep)).toBe('Below your baseline for 2 days in a row.')
})

test('missing device baseline does not create a comparison or invented history', () => {
  const vitals = getTodayVitals(profile('a'), [normalizeCheckIn({ at: new Date().toISOString(), vitals: { spo2: 97 } })])
  const oxygen = vitals.find(v => v.id === 'spo2')!
  expect(oxygen.observed).toBe(true)
  expect(oxygen.delta).toBe('—')
  expect(oxygen.baselineValue).toBeUndefined()
  expect(trendSentence(oxygen)).toMatch(/No personal baseline/)
  expect(vitals.find(v => v.id === 'bodyMass')?.history).toEqual([])
})

test('plans and their in-memory cache belong only to the active account', () => {
  setActiveProfile(profile('a'))
  savePlans([{ id: 'plan-a', patternId: 'fatigue', startedDay: '2026-11-14', days: 5, done: {} }])
  expect(loadPlans()).toHaveLength(1)
  setActiveProfile(profile('b'))
  expect(loadPlans()).toEqual([])
  setActiveProfile(null)
  expect(loadPlans()).toEqual([])
  setActiveProfile(profile('a'))
  expect(loadPlans()[0].id).toBe('plan-a')
})

test('demo scenarios queue records for their owner without erasing server history', () => {
  const scenario = SCENARIOS.find(s => s.health?.length)!
  setActiveProfile(profile('a'))
  replaceCheckIns('a', [normalizeCheckIn({ clientId: 'existing', at: '2026-11-13T06:00:00Z', vitals: { sleep: 8 } })])
  applyScenario(scenario.id)
  expect(loadCheckIns('a').some(record => record.clientId === 'existing' && record.sync === 'saved')).toBe(true)
  expect(loadCheckIns('a').some(record => record.sync === 'pending')).toBe(true)
  expect(localStorage.getItem('health7:checkins:v2')).toBeNull()
  setActiveProfile(profile('b'))
  expect(loadCheckIns()).toEqual([])
  expect(loadPlans()).toEqual([])
  expect(loadWater()).toEqual({})
})

test('manual numeric limits match the server, including a valid zero hours of sleep', () => {
  expect(parseMeasure('sleep', '25')).toBeNull()
  expect(parseMeasure('sleep', '0')).toEqual({ value: 0 })
  expect(parseMeasure('heartRate', '1001')).toBeNull()
})

test('the signed-in crew replaces its simulated leaderboard counterpart', () => {
  setActiveProfile(profile('crew-03'))
  const board = crewBoard(summarize([], {}))
  expect(board.rows.filter(row => row.id === 'crew-03')).toHaveLength(1)
  expect(board.rows.find(row => row.id === 'crew-03')?.you).toBe(true)
})
