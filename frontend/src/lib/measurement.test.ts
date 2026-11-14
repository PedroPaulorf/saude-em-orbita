import { expect, test } from 'vitest'
import { assessmentFor, provenanceFor, methodLabel, describeAssessment } from './measurement'
import { getTodayVitals } from './health'
import type { MedicalObservation } from './medical-types'
import type { CheckInInput } from './storage'
import type { Profile } from './api'

const at = new Date().toISOString()
const assessment: MedicalObservation = { metric: 'sleep', value: 5.1, unit: 'h', observedAt: at, evaluatedAt: at,
  method: 'manual', quality: 'simulated', ruleVersion: 'demo-old', baselineVersion: 'a:old-baseline',
  baseline: 7.2, delta: -2.1, status: 'flagged', explanation: 'Saved rule explanation', retrospective: false, clinicalSource: null,
  rule: { direction: 'below', attention: 1, flagged: 2, unit: 'h', baseline: 7.2 } }
const record: CheckInInput = { clientId: 'record', crewId: 'a', sync: 'saved', at, vitals: { sleep: 5.1 }, observations: [assessment] }
const profile: Profile = { id: 'a', displayName: 'A', missionDay: 1, bodyModel: 'male', source: 'simulated', baseline: { sleep: 5.1, bloodPressureDiastolic: 70 } }

test('a saved assessment retains its baseline and state after the current profile changes', () => {
  const sleep = getTodayVitals(profile, [record]).find(v => v.id === 'sleep')!
  expect(sleep.baseline).toBe('7.2')
  expect(sleep.delta).toBe('−2.1')
  expect(sleep.status).toBe('flagged')
  expect(sleep.assessment).toBe(assessment)
  expect(sleep.rule).toBe('Saved rule explanation')
})

test('metadata comes from the matching observation and never from the configured instrument', () => {
  const sleep = getTodayVitals(profile, [record]).find(v => v.id === 'sleep')!
  expect(sleep.source).toBe('Manual entry')
  const legacy = getTodayVitals(profile, [{ ...record, observations: undefined }]).find(v => v.id === 'sleep')!
  expect(legacy.source).toBe('Collection method unknown')
  expect(legacy.assessment).toBeUndefined()
  expect(methodLabel({ method: 'simulated-device', quality: 'simulated' })).toBe('Simulated device')
})

test('mismatched values, timestamps and rejected records never borrow an assessment', () => {
  expect(assessmentFor({ ...record, vitals: { sleep: 6 } }, 'sleep')).toBeUndefined()
  expect(assessmentFor({ ...record, at: '2026-01-01T00:00:00Z' }, 'sleep')).toBeUndefined()
  expect(assessmentFor({ ...record, sync: 'rejected' }, 'sleep')).toBeUndefined()
  expect(assessmentFor(record, 'heartRate')).toBeUndefined()
  expect(getTodayVitals({ ...profile, id: 'b' }, [record]).every(v => !v.observed)).toBe(true)
})

test('retrospective and unavailable saved comparisons are preserved without using a newer baseline', () => {
  const old = { ...assessment, retrospective: true, baseline: null, delta: null, status: 'not-evaluated', ruleVersion: null, rule: null }
  const sleep = getTodayVitals(profile, [{ ...record, observations: [old] }]).find(v => v.id === 'sleep')!
  expect(sleep.comparable).toBe(false)
  expect(sleep.baseline).toBe('—')
  expect(sleep.assessment?.retrospective).toBe(true)
  expect(describeAssessment(old)).toMatch(/without a comparison/)
})

test('local records keep their provenance but have no archived evaluation', () => {
  const pending: CheckInInput = { ...record, sync: 'pending', observations: undefined, provenance: { sleep: { method: 'manual', quality: 'simulated' } } }
  const sleep = getTodayVitals(profile, [pending]).find(v => v.id === 'sleep')!
  expect(sleep.assessment).toBeUndefined()
  expect(sleep.status).toBe('baseline')
  expect(sleep.recordSync).toBe('pending')
  expect(provenanceFor(pending, 'sleep')?.method).toBe('manual')
  expect(describeAssessment(assessment)).toContain('7.2 h')
})
