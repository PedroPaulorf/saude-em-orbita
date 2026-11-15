import { describe, expect, it } from 'vitest'
import { dailyPoints, GAME, MAX_DAY_POINTS, nextRank, rankFor, summarize } from './game'
import { planPointsByDay, type StoredPlan } from './plans'
import { crewBoard } from './progress'
import type { CheckIn } from './storage'
import { msToNextUtcDay } from './use-utc-day'

const P = GAME.points
let n = 0
const health = (day: string, extra: Partial<CheckIn> = {}): CheckIn => ({
  clientId: `h${n++}`, kind: 'health', at: `${day}T07:30:00.000Z`, source: 'simulated', vitals: { heartRate: 62 }, behavioral: {}, ...extra,
})
const behavioral = (day: string): CheckIn => ({
  clientId: `b${n++}`, kind: 'behavioral', at: `${day}T07:40:00.000Z`, source: 'simulated', vitals: {}, behavioral: { mood: 3 },
})
const both = (...days: string[]) => days.flatMap((d) => [health(d), behavioral(d)])

describe('daily points', () => {
  it('gives each check-up once per day, water up to the goal, the full-routine bonus and the streak', () => {
    const [day] = dailyPoints([...both('2026-11-10'), health('2026-11-10')], { '2026-11-10': GAME.waterGoal + 4 })
    expect(day.points).toEqual({ health: P.healthCheckUp, behavioral: P.behavioralCheckIn, water: GAME.waterGoal * P.waterServing, bonus: P.fullRoutineBonus, streak: P.streakPerDay, plan: 0, prevention: 0 })
    expect(day.routineTotal).toBeLessThanOrEqual(MAX_DAY_POINTS)
  })

  it('gives prevention points per objective done, up to the daily cap, even on a day without check-ups', () => {
    const [day] = dailyPoints([], {}, [], { '2026-11-10': ['a', 'b'] })
    expect(day.points.prevention).toBe(2 * P.preventionStep)
    expect(day.total).toBe(2 * P.preventionStep)
    const [capped] = dailyPoints([], {}, [], { '2026-11-10': ['a', 'b', 'c', 'd', 'e'] })
    expect(capped.points.prevention).toBe(P.preventionStepsPerDay * P.preventionStep)
    expect(summarize([], {}, '2026-11-10', [], { '2026-11-10': ['a'] }).today.points.prevention).toBe(P.preventionStep)
  })

  it('ignores rejected records', () => {
    const days = dailyPoints([health('2026-11-10', { sync: 'rejected' })], {})
    expect(days[0]?.total ?? 0).toBe(0)
  })

  it('caps the streak points and restarts the streak after a missed day', () => {
    const days = dailyPoints(both('2026-11-01', '2026-11-02', '2026-11-03', '2026-11-04', '2026-11-05', '2026-11-06', '2026-11-08'), {})
    const byDay = new Map(days.map((d) => [d.day, d]))
    expect(byDay.get('2026-11-06')!.streak).toBe(6)
    expect(byDay.get('2026-11-06')!.points.streak).toBe(P.streakMaxPerDay)
    expect(byDay.get('2026-11-08')!.streak).toBe(1)
  })
})

describe('summary and ranks', () => {
  it('adds every day to the starting points and keeps yesterday’s streak until today is done', () => {
    const g = summarize(both('2026-11-12', '2026-11-13'), {}, '2026-11-14')
    expect(g.totalPoints).toBe(GAME.startingPoints + g.days.reduce((s, d) => s + d.total, 0))
    expect(g.today.total).toBe(0)
    expect(g.streakDays).toBe(2)
  })

  it('switches rank exactly at the minimum', () => {
    expect(rankFor(2999).name).toBe('Flight Engineer')
    expect(rankFor(3000).name).toBe('Pilot')
    expect(nextRank(3000)?.name).toBe('Commander')
    expect(nextRank(5000)).toBeNull()
  })
})

describe('back-to-baseline plan points', () => {
  const plan: StoredPlan = { id: 'p', patternId: 'C18', startedDay: '2026-11-10', days: 5, done: {} }
  const steps = ['sleep-period', 'lights', 'co2']
  const ctx = { checkIns: [], water: {}, waterGoal: GAME.waterGoal }

  it('pays per marked step, a bonus for a complete day and the completion on the last day', () => {
    const done = Object.fromEntries(['2026-11-10', '2026-11-14'].map((d) => [d, steps]))
    const pts = planPointsByDay([{ ...plan, done }], ctx, P)
    expect(pts.get('2026-11-10')).toEqual({ steps: 3 * P.planStep, dayBonus: P.planDayComplete, completion: 0 })
    expect(pts.get('2026-11-14')).toEqual({ steps: 3 * P.planStep, dayBonus: P.planDayComplete, completion: P.planCompleted })
  })

  it('gives nothing after the plan was ended early', () => {
    const pts = planPointsByDay([{ ...plan, endedDay: '2026-11-11', done: { '2026-11-12': steps } }], ctx, P)
    expect(pts.has('2026-11-12')).toBe(false)
  })
})

describe('crew board', () => {
  it('uses the simulated week only when there are no real days before today', () => {
    const g = summarize(both('2026-11-14'), {}, '2026-11-14')
    const me = crewBoard(g).rows.find((r) => r.you)!
    expect(me.weekPoints).toBe(GAME.weekPointsBeforeToday + g.today.total)
  })

  it('does not count the same days twice when real days exist', () => {
    const g = summarize(both('2026-11-12', '2026-11-13', '2026-11-14'), {}, '2026-11-14')
    const me = crewBoard(g).rows.find((r) => r.you)!
    expect(me.weekPoints).toBe(g.days.reduce((s, d) => s + d.total, 0))
  })
})

it('counts the time left until the next UTC midnight', () => {
  expect(msToNextUtcDay(new Date('2026-11-14T23:59:00.000Z'))).toBe(60_000)
  expect(msToNextUtcDay(new Date('2026-11-14T00:00:00.000Z'))).toBe(86_400_000)
})
