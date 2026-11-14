import { describe, expect, it } from 'vitest'
import tripulantes from '../../../dados/derivados/tripulantes.json'
import diario from '../../../dados/derivados/diario.json'
import gabarito from '../../../dados/derivados/gabarito.json'
import estados from '../../../dados/derivados/estados.json'
import medical from '../../../backend/src/medical.ts?raw'
import type { Profile, Symptom } from '@/lib/api'
import { configForProfile } from '@/lib/health'
import type { CheckInInput } from '@/lib/storage'
import { MONITOR_RULE_VERSION, monitor, monitorSeries, SCORE_WEIGHTS, STATE_GUIDE, STATES, URINATIONS_RULE, type DayResult, type MonitorInput, type MonitorState } from '@/lib/monitor'

/*
  Calibração do motor contra a pesquisa NEXUS-Med (dados/derivados, gerado por dados/scripts/exportar.py).
  O gabarito (alert_state) foi rotulado à mão, por caso: o motor NÃO é ajustado para decorá-lo.
  Os critérios de "pronto" são os da seção 7 do plano; a tabela de concordância está em dados/README.md.
*/
const crew: { crewId: string; baseline: Record<string, number> }[] = tripulantes.items
const diary: { crewId: string; day: number; vitals: Record<string, number>; urinations24h: number; stools24h: number; redFlag: boolean; symptoms: { label: string; bodyPart: string; severity: number }[] }[] = diario.items
const answers = gabarito.items as { crewId: string; day: number; alertState: MonitorState; healthChangeScore: number }[]

const START = Date.parse('2026-10-01T00:00:00Z')
const dateOf = (day: number) => new Date(START + (day - 1) * 86400000).toISOString().slice(0, 10)

/** As mesmas entradas que `npm run import:nexus` grava: um check-up por dia e um episódio de sintoma por rótulo. */
export function fixture(crewId: string, todayDay = 30): MonitorInput {
  const c = crew.find((x) => x.crewId === crewId)!
  const days = diary.filter((d) => d.crewId === crewId && d.day <= todayDay).sort((a, b) => a.day - b.day)
  const checkins: CheckInInput[] = days.map((d) => ({
    clientId: `nexus-${crewId}-d${d.day}`, at: `${dateOf(d.day)}T06:00:00.000Z`, vitals: d.vitals, behavioral: {},
    healthDetails: { urinations24h: d.urinations24h, stools24h: d.stools24h, ...(d.redFlag ? { redFlag: true } : {}) },
    sync: 'saved',
  }))
  const symptoms: Symptom[] = []
  const active = new Map<string, Symptom>()
  for (const d of days) {
    const at = `${dateOf(d.day)}T06:05:00.000Z`
    for (const [label, s] of [...active]) if (!d.symptoms.some((x) => x.label === label)) {
      s.events.push({ id: `${s.id}-r`, at, receivedAt: at, type: 'resolution' }); s.status = 'resolved'; active.delete(label)
    }
    for (const x of d.symptoms) {
      const open = active.get(x.label)
      if (open) open.events.push({ id: `${open.id}-${d.day}`, at, receivedAt: at, type: 'evolution', severity: x.severity })
      else {
        const s: Symptom = { id: `${crewId}-${x.label}-${d.day}`, at, label: x.label, bodyPart: x.bodyPart, severity: x.severity, status: 'active',
          events: [{ id: `${crewId}-${x.label}-${d.day}-s`, at, receivedAt: at, type: 'start', severity: x.severity }] }
        symptoms.push(s); active.set(x.label, s)
      }
    }
  }
  const { heightCm: _h, ...baseline } = c.baseline
  return { profile: { missionDay: todayDay, baseline }, checkins, symptoms, today: new Date(`${dateOf(todayDay)}T12:00:00Z`) }
}

const series = Object.fromEntries(crew.map((c) => [c.crewId, monitorSeries(fixture(c.crewId))])) as Record<string, DayResult[]>
const stateOn = (crewId: string, day: number) => series[crewId].find((d) => d.day === day)!.state
const daysIn = (crewId: string, from: number, to: number, state: MonitorState) =>
  series[crewId].filter((d) => d.day >= from && d.day <= to && d.state === state).length

describe('monitor calibration against the NEXUS-Med answer key', () => {
  it('covers 30 flight days for each of the six crew members', () => {
    expect(Object.values(series).map((s) => s.length)).toEqual([30, 30, 30, 30, 30, 30])
    expect(series['NX-04'].map((d) => d.day)).toEqual(Array.from({ length: 30 }, (_, i) => i + 1))
  })

  it('NX-06 reaches ESCALATE on day 14 and leaves it during recovery', () => {
    expect(stateOn('NX-06', 14)).toBe('ESCALATE')
    expect(series['NX-06'].filter((d) => d.day > 14 && d.state === 'ESCALATE')).toEqual([])
    expect(series['NX-06'].filter((d) => d.day >= 23).every((d) => d.state === 'STABLE')).toBe(true)
  })

  it('NX-04 is in PERSISTENT CHANGE on at least 3 of days 19 to 23', () => {
    expect(daysIn('NX-04', 19, 23, 'PERSISTENT CHANGE')).toBeGreaterThanOrEqual(3)
  })

  it('NX-03 is in PERSISTENT CHANGE on at least 3 of days 12 to 17, without escalation', () => {
    expect(daysIn('NX-03', 12, 17, 'PERSISTENT CHANGE')).toBeGreaterThanOrEqual(3)
    expect(series['NX-03'].some((d) => d.state === 'ESCALATE')).toBe(false)
  })

  it('NX-02 (athlete bradycardia) never goes above WATCH, and only inside the adaptation window', () => {
    for (const d of series['NX-02']) {
      expect(['STABLE', 'WATCH']).toContain(d.state)
      if (d.day > 3) expect(d.state).toBe('STABLE')
    }
  })

  it('no crew member escalates without a red flag, and the adaptation window caps days 1 to 3 at WATCH', () => {
    for (const s of Object.values(series)) for (const d of s) {
      if (d.state === 'ESCALATE') expect(d.redFlag).toBe(true)
      if (d.day <= 3) expect(['STABLE', 'WATCH']).toContain(d.state)
    }
  })

  it('the score is an intensity between 0 and 100, rising with the change', () => {
    for (const s of Object.values(series)) for (const d of s) {
      expect(d.score).toBeGreaterThanOrEqual(0)
      expect(d.score).toBeLessThanOrEqual(100)
    }
    const nx06 = series['NX-06']
    expect(nx06.find((d) => d.day === 14)!.score).toBeGreaterThan(nx06.find((d) => d.day === 5)!.score)
  })

  it('matches the documented agreement table (dados/README.md)', () => {
    // Linhas: gabarito; colunas: motor. Mudou a regra, atualize a tabela no README e a versão da regra.
    const matrix = Object.fromEntries(STATES.map((a) => [a, Object.fromEntries(STATES.map((b) => [b, 0]))]))
    for (const a of answers) matrix[a.alertState][stateOn(a.crewId, a.day)]++
    expect(matrix).toEqual(AGREEMENT)
  })
})

describe('monitor on a single day', () => {
  it('only uses the data up to the "today" of the account (NX-04 imported on day 19)', () => {
    const r = monitor(fixture('NX-04', 19))
    expect(r.day).toBe(19)
    expect(r.history).toHaveLength(19)
    expect(r.state).toBe('PERSISTENT CHANGE')
    expect(r.wording).toBe('Several measurements are moving away from your personal baseline.')
    expect(r.ruleVersion).toBe('health7-nexus-2026-11-14-v1')
    expect(r.signals.filter((s) => s.kind === 'measure').map((s) => s.metric)).toEqual(expect.arrayContaining(['urinations24h', 'heartRate']))
  })

  it('ESCALATE carries the fixed protocol action and the red flag as the first signal', () => {
    const r = monitor(fixture('NX-06', 14))
    expect(r.state).toBe('ESCALATE')
    expect(r.action).toBe('Escalate to CMO / ground support according to mission protocol.')
    expect(r.signals[0].kind).toBe('red-flag')
  })

  it('without a check-up today the state is STABLE and marked as not observed', () => {
    const input = fixture('NX-02', 10)
    const r = monitor({ ...input, today: new Date(Date.parse(input.today!.toISOString()) + 86400000), profile: { ...input.profile, missionDay: 11 } })
    expect(r.observed).toBe(false)
    expect(r.state).toBe('STABLE')
  })

  it('an alert symptom escalates on its own; a rejected record is ignored', () => {
    const input = fixture('NX-02', 10)
    const at = input.checkins.at(-1)!.at
    const symptom: Symptom = { id: 's', at, label: 'shortness-of-breath', bodyPart: 'chest', severity: 5, status: 'active', events: [] }
    expect(monitor({ ...input, symptoms: [symptom] }).state).toBe('ESCALATE')
    const rejected = { ...input.checkins.at(-1)!, clientId: 'x', vitals: { heartRate: 120 }, sync: 'rejected' as const }
    expect(monitor({ ...input, checkins: [...input.checkins, rejected] }).state).toBe('STABLE')
  })

  it('environment is context only and uses the spreadsheet formula', () => {
    const input = fixture('NX-02', 10)
    const at = input.checkins.at(-1)!.at
    const r = monitor({ ...input, environment: [{ at, co2Ppm: 3600, radiationDoseMgyDay: 0.3, temperatureC: 24, relativeHumidityPct: 70 }] })
    expect(r.environment).toEqual({ load: 3, items: ['Cabin CO₂ 3600 ppm', 'Radiation 0.3 mGy today', 'Cabin humidity 70%'] })
    expect(r.state).toBe('STABLE')
    expect(r.score).toBe(0)
  })
})

/** Concordância por estado nos 180 dias (gabarito × motor). Explicada em dados/README.md. */
const AGREEMENT: Record<MonitorState, Record<MonitorState, number>> = {
  STABLE: { STABLE: 134, WATCH: 10, 'PERSISTENT CHANGE': 2, ESCALATE: 0 },
  WATCH: { STABLE: 0, WATCH: 8, 'PERSISTENT CHANGE': 7, ESCALATE: 0 },
  'PERSISTENT CHANGE': { STABLE: 0, WATCH: 0, 'PERSISTENT CHANGE': 16, ESCALATE: 0 },
  ESCALATE: { STABLE: 0, WATCH: 0, 'PERSISTENT CHANGE': 2, ESCALATE: 1 },
}

describe('monitor rule stays in sync with its sources', () => {
  it('uses the per-measure thresholds of backend/src/medical.ts', () => {
    const configs = configForProfile({ baseline: {} } as Profile)
    for (const id of ['heartRate', 'bloodPressure', 'sleep', 'temperature', 'spo2', 'respiratoryRate', 'bodyMass'] as const) {
      const m = new RegExp(`${id}: \\{ unit: '[^']*', attention: ([\\d.]+), flagged: ([\\d.]+), direction: '(\\w+)' \\}`).exec(medical)
      expect(m, id).not.toBeNull()
      const rule = configs.find((c) => c.id === id)!.rule
      expect({ attention: rule.attention, flagged: rule.flagged, direction: rule.direction }, id).toEqual({ attention: Number(m![1]), flagged: Number(m![2]), direction: m![3] })
    }
  })

  it('shows the research wording for each state, unchanged (dados/derivados/estados.json)', () => {
    const states = estados.items as { state: MonitorState; meaning: string; wording: string; action: string }[]
    expect(Object.keys(STATE_GUIDE)).toEqual(states.map((s) => s.state))
    for (const s of states) expect(STATE_GUIDE[s.state]).toEqual({ meaning: s.meaning, wording: s.wording, action: s.action })
  })

  it('is registered by the server under the same version and weights', () => {
    expect(medical).toContain(`MONITOR_RULE_VERSION = '${MONITOR_RULE_VERSION}'`)
    expect(medical).toContain(`scoreWeights: { measurePoint: ${SCORE_WEIGHTS.measurePoint}, symptom: ${SCORE_WEIGHTS.symptom}, persistenceDay: ${SCORE_WEIGHTS.persistenceDay} }`)
    expect(medical).toContain(`urinations24h: { unit: 'per day', attention: ${URINATIONS_RULE.attention}, flagged: ${URINATIONS_RULE.flagged}, direction: '${URINATIONS_RULE.direction}' }`)
  })
})
