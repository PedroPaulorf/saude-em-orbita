import { expect, test } from 'vitest'
import { getTodayVitals, getBodyRegions, symptomsForRegion, normalizeRegion } from './health'
import type { Profile, Symptom } from './api'
const profile: Profile = { id: 'a', displayName: 'A', missionDay: 1, bodyModel: 'female', source: 'simulated', baseline: { sleep: 8, heartRate: 60, bloodPressure: 110, bloodPressureDiastolic: 70, temperature: 36.5 } }
test('empty history never becomes simulated observations or normal body regions', () => {
  const vitals = getTodayVitals(profile, [])
  expect(vitals.every(v => v.observed === false && v.value === '—')).toBe(true)
  expect(getBodyRegions(vitals).every(r => r.stateText === 'No measurement recorded')).toBe(true)
})
test('uses individual baseline and matches both sides of symptom mapping', () => {
  const vitals = getTodayVitals(profile, [{ clientId: 'a', at: new Date().toISOString(), source: 'simulated', vitals: { sleep: 6 }, behavioral: {} }])
  expect(vitals.find(v => v.id === 'sleep')?.baseline).toBe('8.0')
  const symptoms = [{ bodyPart: 'left-arm' }, { bodyPart: 'right-arm' }, { bodyPart: 'general' }] as Symptom[]
  expect(symptomsForRegion(symptoms, 'leftArm').map(s => s.bodyPart)).toEqual(['left-arm'])
  expect(symptomsForRegion(symptoms, 'core')).toEqual([])
})

test('unknown and prototype property region names fall back safely',()=>{
  expect(normalizeRegion('constructor')).toBe('head')
  expect(normalizeRegion('toString')).toBe('head')
  expect(normalizeRegion('leftArm')).toBe('leftArm')
})

test('rejected records do not become observations or baseline flags',()=>{
  const vitals=getTodayVitals(profile,[{clientId:'a',at:new Date().toISOString(),source:'simulated',vitals:{sleep:1},behavioral:{},sync:'rejected'}])
  expect(vitals.every(v=>v.observed===false)).toBe(true)
})
