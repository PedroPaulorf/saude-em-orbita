import { describe, expect, it } from 'vitest'
import condicoes from '../../../dados/derivados/condicoes.json'
import { monitor } from '@/lib/monitor'
import { fixture } from '@/lib/nexus.fixture'
import { buildNotes } from '@/lib/notes'
import { companionLines } from '@/lib/companion'
import { PATTERNS, patternsFromMonitor } from '@/lib/prevention'

const activeOn = (crewId: string, day: number) => patternsFromMonitor(monitor(fixture(crewId, day))).filter((p) => p.active).map((p) => p.def.id)

describe('the six NEXUS-Med conditions replace the three old patterns', () => {
  it('are the research conditions, titled with the safe wording unchanged', () => {
    expect(PATTERNS.map((p) => p.id).sort()).toEqual(condicoes.items.map((c) => c.id).sort())
    for (const c of condicoes.items) {
      const p = PATTERNS.find((x) => x.id === c.id)!
      expect(p.title).toBe(c.safeWording)
      expect(p.safeWording).toBe(c.safeWording)
    }
    expect(PATTERNS.some((p) => ['sleep-debt', 'low-intake', 'reduced-oxygenation'].includes(p.id))).toBe(false)
  })

  it('match the research cases on the day each account opens', () => {
    expect(activeOn('NX-06', 14)).toContain('C09')
    expect(activeOn('NX-04', 19)).toEqual(['C12'])
    expect(activeOn('NX-04', 20)).toEqual(expect.arrayContaining(['C12', 'C16']))
    expect(activeOn('NX-03', 14)).toEqual(expect.arrayContaining(['C18', 'C05']))
    expect(activeOn('NX-01', 2)).toEqual(['C06'])
    expect(activeOn('NX-02', 30)).toEqual([])
  })

  it('need their required sign: no renal pattern without flank discomfort, no early-flight pattern late in the flight', () => {
    const day19 = patternsFromMonitor(monitor(fixture('NX-04', 19))).find((p) => p.def.id === 'C16')!
    expect(day19.active).toBe(false)
    expect(day19.signs.find((s) => s.def.id === 'flank')!.state).toBe('absent')
    const late = monitor(fixture('NX-01', 2))
    expect(patternsFromMonitor({ ...late, day: 20 }).find((p) => p.def.id === 'C06')!.active).toBe(false)
  })
})

describe('home note and companion line follow the monitor state', () => {
  const base = { vitals: [], healthDoneToday: true, water: { servings: 8, goal: 8 } }
  it('adds a state note with the two main signals, and none when stable', () => {
    const notes = buildNotes({ ...base, monitor: { state: 'PERSISTENT CHANGE', score: 50, signals: ['urinations −3 per day', 'heart rate +7 bpm'] } })
    expect(notes[0]).toEqual(expect.objectContaining({ id: 'monitor-state', status: 'attention', text: 'Persistent change · score 50: urinations −3 per day; heart rate +7 bpm.' }))
    expect(buildNotes({ ...base, monitor: { state: 'STABLE', score: 0, signals: [] } }).some((n) => n.id === 'monitor-state')).toBe(false)
  })

  it('turns the first companion line into the notice when the state rises', () => {
    const args = { name: 'NX-04', vitals: [], healthDone: true, moodDone: true, water: 8, waterGoal: 8 }
    expect(companionLines({ ...args, change: { state: 'WATCH', rose: true, topic: 'hydration' } })[0].text).toBe('I noticed a change in your hydration. Want to talk about it?')
    expect(companionLines({ ...args, change: { state: 'ESCALATE', rose: true, topic: 'breathing and temperature' } })[0].text).toMatch(/medical review/)
    expect(companionLines(args)[0].text).toBe('Need help, astronaut?')
  })
})
