import { expect, test } from 'vitest'
import { baselinePairs } from './baselines'
import { buildOnDevice, parseAiRoadmap, roadmapInput } from './roadmap'
import type { Profile } from './api'
import type { CheckInInput } from './storage'
import { monitor } from './monitor'
import { fixture } from './nexus.fixture'
import { patternsFromMonitor } from './prevention'

const profile: Profile = { id: 'a', displayName: 'A', missionDay: 47, bodyModel: 'male', source: 'simulated',
  baseline: { heartRate: 62, bloodPressure: 116, bloodPressureDiastolic: 74, sleep: 7.2, temperature: 36.6, spo2: 97, respiratoryRate: 14 } }
const now = new Date('2026-11-14T08:00:00Z')
const day = (n: number) => new Date(now.getTime() - n * 86400000).toISOString()
const health = (n: number, vitals: CheckInInput['vitals'], healthDetails?: CheckInInput['healthDetails']): CheckInInput =>
  ({ clientId: `h${n}`, at: day(n), vitals, behavioral: {}, healthDetails })

test('in-flight baseline is the median of past days and needs 3 of them', () => {
  const two = baselinePairs(profile, [health(1, { heartRate: 66 }), health(2, { heartRate: 68 })], now)
  expect(two.find((p) => p.id === 'heartRate')?.inflight).toBeUndefined()
  const three = baselinePairs(profile, [health(1, { heartRate: 66 }), health(2, { heartRate: 70 }), health(3, { heartRate: 68 }), health(0, { heartRate: 90 })], now)
  const hr = three.find((p) => p.id === 'heartRate')!
  expect(hr.inflight).toBe(68)
  expect(hr.today).toBe(90)
  expect(hr.preflight).toBe(62)
})

test('roadmap asks for the check-up first when nothing is recorded today', () => {
  const input = roadmapInput({ profile, checkins: [], patterns: [], sepThisWeek: false, water: { today: 0, goal: 8 }, today: now })
  const r = buildOnDevice(input, 'k', now)
  expect(r.phases[0].steps[0].id).toBe('do-checkup')
  expect(r.engine).toBe('on-device')
})

test('short sleep, drift and dark urine become steps with numbers in the why', () => {
  const checkins = [
    health(3, { sleep: 6.2, heartRate: 67 }), health(2, { sleep: 6.0, heartRate: 68 }), health(1, { sleep: 6.1, heartRate: 68 }),
    health(0, { sleep: 5.0, heartRate: 69 }, { urine: 'Dark yellow' }),
  ]
  const r = buildOnDevice(roadmapInput({ profile, checkins, patterns: [], sepThisWeek: false, water: { today: 2, goal: 8 }, today: now }), 'k', now)
  const all = r.phases.flatMap((p) => p.steps)
  expect(r.headline).toBe('Protect your sleep tonight')
  expect(all.find((s) => s.id === 'sleep-today')?.why).toMatch(/Sleep 5\.0 h · in flight 6\.1 · pre-flight 7\.2/)
  expect(all.some((s) => s.id === 'heartRate-drift')).toBe(true)
  expect(r.signals.some((s) => s.label === 'Urine')).toBe(true)
  // sono 2.2 h abaixo do pré-voo: sinalizado, então o aviso ao solo e o passo do sono vêm primeiro
  expect(r.ground).toBe(true)
  expect(r.phases[0].steps.map((s) => s.id).slice(0, 2)).toEqual(['sleep-ground', 'sleep-today'])
  expect(r.phases[0].steps.length).toBeLessThanOrEqual(3)
})

test('AI answer is accepted only in the roadmap shape', () => {
  expect(parseAiRoadmap({ output: 'not json' })).toBeNull()
  const ok = parseAiRoadmap({ output: '```json {"headline":"H","summary":"S","phases":[{"id":"today","steps":[{"text":"Drink","kind":"do"}]}]} ```' })
  expect(ok?.headline).toBe('H')
  expect(ok?.phases[0].steps[0].text).toBe('Drink')
})

// ---------- roteiro com o motor de monitoramento (NEXUS-Med) ----------

const nexus = (crewId: string, todayDay: number) => {
  const f = fixture(crewId, todayDay)
  const result = monitor(f)
  const p: Profile = { ...profile, missionDay: todayDay, baseline: { bloodPressureDiastolic: 70, ...f.profile.baseline } }
  const input = roadmapInput({ profile: p, checkins: f.checkins, patterns: patternsFromMonitor(result), sepThisWeek: false, water: { today: 2, goal: 8 }, monitor: result, today: f.today })
  return { input, roadmap: buildOnDevice(input, 'k', f.today!) }
}
const ids = (r: ReturnType<typeof buildOnDevice>, phase: number) => r.phases[phase].steps.map((s) => s.id)

test('NX-04 on day 19: hydration steps of the research condition, plus the persistent-change step', () => {
  const { input, roadmap } = nexus('NX-04', 19)
  expect(input.monitor?.state).toBe('PERSISTENT CHANGE')
  expect(roadmap.headline).toBe('Hydration first today')
  expect(ids(roadmap, 0).slice(0, 2)).toEqual(['C12-today', 'persistent-workload'])
  expect(roadmap.phases[0].steps[0]).toEqual(expect.objectContaining({ action: 'water', text: 'Reach your water goal and log your urinations in the check-up.' }))
  expect(roadmap.phases[0].steps[0].why).toMatch(/urinations −3 per day vs in-flight 6/)
  expect(ids(roadmap, 1)).toEqual(['C12-next', 'persistent-daily'])
  expect(roadmap.phases[2].steps[0]).toEqual(expect.objectContaining({ id: 'C12-week', kind: 'ground' }))
})

test('NX-06 on day 14: ESCALATE leaves only the fixed protocol, no routine steps', () => {
  const { roadmap } = nexus('NX-06', 14)
  expect(roadmap.ground).toBe(true)
  expect(roadmap.phases.flatMap((p) => p.steps).map((s) => s.id)).toEqual(['escalate'])
  expect(roadmap.phases[0].steps[0].text).toMatch(/according to mission protocol/)
})

test('WATCH puts repeat-and-report on top; STABLE keeps the normal routine without condition steps', () => {
  const watch = nexus('NX-01', 2).roadmap
  expect(ids(watch, 0).slice(0, 3)).toEqual(['watch-repeat', 'watch-symptoms', 'C06-today'])
  const stable = nexus('NX-02', 30)
  expect(stable.input.monitor?.state).toBe('STABLE')
  expect(stable.roadmap.phases.flatMap((p) => p.steps).some((s) => /^C\d\d-|^watch-|^persistent-/.test(s.id))).toBe(false)
})
