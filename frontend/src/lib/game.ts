/*
  Gamificação da rotina diária (plano v2, 7.6). Funções puras: tudo sai dos check-ups salvos e do
  registro de água, somado a game.startingPoints. O total NÃO é guardado em lugar nenhum:
  recalculado a cada leitura, ele não tem como divergir dos registros.

  Princípio: os pontos premiam o que a pessoa faz, nunca o que a medida mostra. Fazer o check-up
  dá ponto; ter a pressão "boa" não. Ninguém perde ponto por um valor medido.
  O dia é o dia UTC, como no resto do app.
*/
import simulated from '@/data/simulated.json'
import type { CheckIn } from '@/lib/storage'
import { planPointsByDay, viewPlan, type StoredPlan } from '@/lib/plans'
import type { WaterLog } from '@/lib/water'

export const GAME = simulated.game
const P = GAME.points

export interface Rank {
  name: string
  min: number
}

export interface DayPoints {
  day: string
  healthDone: boolean
  behavioralDone: boolean
  water: number
  /** Dias seguidos com os dois check-ups, terminando neste dia (0 se o dia não tem os dois). */
  streak: number
  fullRoutine: boolean
  points: { health: number; behavioral: number; water: number; bonus: number; streak: number; plan: number }
  /** Pontos da rotina (check-ups, água, bônus, sequência): é o que o anel de 125 mostra. */
  routineTotal: number
  /** Rotina + plano. */
  total: number
}

/** Pontos máximos de um dia (125 com a tabela padrão). */
export const MAX_DAY_POINTS =
  P.healthCheckUp + P.behavioralCheckIn + P.waterServing * GAME.waterGoal + P.fullRoutineBonus + P.streakMaxPerDay

const dayOf = (iso: string) => iso.slice(0, 10)

function prevDay(day: string) {
  const d = new Date(`${day}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() - 1)
  return d.toISOString().slice(0, 10)
}

/** Pontos dia a dia, em ordem de data. Cada check-up conta uma vez por dia, a água até a meta. */
export function dailyPoints(checkIns: CheckIn[], water: WaterLog, plans: StoredPlan[] = []): DayPoints[] {
  const days = new Map<string, { health: boolean; behavioral: boolean }>()
  for (const c of checkIns) {
    const d = days.get(dayOf(c.at)) ?? { health: false, behavioral: false }
    if (c.kind === 'health') d.health = true
    else d.behavioral = true
    days.set(dayOf(c.at), d)
  }
  for (const [day, n] of Object.entries(water)) if (n > 0 && !days.has(day)) days.set(day, { health: false, behavioral: false })
  const planPts = planPointsByDay(plans, { checkIns, water, waterGoal: GAME.waterGoal }, P)
  for (const day of planPts.keys()) if (!days.has(day)) days.set(day, { health: false, behavioral: false })

  const sorted = [...days.keys()].sort()
  const both = new Set(sorted.filter((d) => days.get(d)!.health && days.get(d)!.behavioral))
  const streakAt = new Map<string, number>()
  for (const day of sorted) {
    streakAt.set(day, both.has(day) ? (both.has(prevDay(day)) ? (streakAt.get(prevDay(day)) ?? 0) + 1 : 1) : 0)
  }

  return sorted.map((day) => {
    const { health, behavioral } = days.get(day)!
    const servings = Math.max(0, water[day] ?? 0)
    const streak = streakAt.get(day) ?? 0
    const fullRoutine = health && behavioral && servings >= GAME.waterGoal
    const points = {
      health: health ? P.healthCheckUp : 0,
      behavioral: behavioral ? P.behavioralCheckIn : 0,
      water: Math.min(servings, GAME.waterGoal) * P.waterServing,
      bonus: fullRoutine ? P.fullRoutineBonus : 0,
      streak: Math.min(streak * P.streakPerDay, P.streakMaxPerDay),
      plan: (() => {
        const pp = planPts.get(day)
        return pp ? pp.steps + pp.dayBonus + pp.completion : 0
      })(),
    }
    const routineTotal = points.health + points.behavioral + points.water + points.bonus + points.streak
    const total = routineTotal + points.plan
    return { day, healthDone: health, behavioralDone: behavioral, water: servings, streak, fullRoutine, points, routineTotal, total }
  })
}

export function rankFor(points: number, ranks: Rank[] = GAME.ranks): Rank {
  return [...ranks].reverse().find((r) => points >= r.min) ?? ranks[0]
}

export function nextRank(points: number, ranks: Rank[] = GAME.ranks): Rank | null {
  return ranks.find((r) => r.min > points) ?? null
}

export interface Achievement {
  id: string
  title: string
  description: string
  earned: boolean
}

/** As conquistas: as quatro do plano v2 e "First plan completed" do v3. */
export function achievements(days: DayPoints[], checkIns: CheckIn[], plansCompleted = 0): Achievement[] {
  const byDay = new Map(days.map((d) => [d.day, d]))
  const waterRun = days.some((d) => {
    let day = d.day
    for (let i = 0; i < 3; i++) {
      if ((byDay.get(day)?.water ?? 0) < GAME.waterGoal) return false
      day = prevDay(day)
    }
    return true
  })
  const behavioralCount = checkIns.filter((c) => c.kind === 'behavioral').length
  return [
    { id: 'first-routine', title: 'First full routine', description: 'Both check-ups and the water goal in one day.', earned: days.some((d) => d.fullRoutine) },
    { id: 'streak-7', title: '7-day streak', description: 'Both check-ups for 7 days in a row.', earned: days.some((d) => d.streak >= 7) },
    { id: 'water-3', title: 'Water goal, 3 days', description: 'Water goal met 3 days in a row.', earned: waterRun },
    { id: 'behavioral-10', title: '10 behavioral check-ins', description: `${Math.min(behavioralCount, 10)} of 10 done.`, earned: behavioralCount >= 10 },
    { id: 'first-plan', title: 'First plan completed', description: 'Every step of the last day of a back-to-baseline plan.', earned: plansCompleted > 0 },
  ]
}

export interface GameSummary {
  days: DayPoints[]
  today: DayPoints
  totalPoints: number
  rank: Rank
  next: Rank | null
  /** Sequência atual: a de hoje, ou a de ontem se hoje ainda não tem os dois check-ups. */
  streakDays: number
  achievements: Achievement[]
}

export function summarize(
  checkIns: CheckIn[],
  water: WaterLog,
  todayKey = new Date().toISOString().slice(0, 10),
  plans: StoredPlan[] = [],
): GameSummary {
  const days = dailyPoints(checkIns, water, plans)
  const empty: DayPoints = {
    day: todayKey,
    healthDone: false,
    behavioralDone: false,
    water: 0,
    streak: 0,
    fullRoutine: false,
    points: { health: 0, behavioral: 0, water: 0, bonus: 0, streak: 0, plan: 0 },
    routineTotal: 0,
    total: 0,
  }
  const today = days.find((d) => d.day === todayKey) ?? empty
  const yesterday = days.find((d) => d.day === prevDay(todayKey))
  const totalPoints = GAME.startingPoints + days.reduce((s, d) => s + d.total, 0)
  return {
    days,
    today,
    totalPoints,
    rank: rankFor(totalPoints),
    next: nextRank(totalPoints),
    streakDays: today.streak || yesterday?.streak || 0,
    achievements: achievements(
      days,
      checkIns,
      plans.filter((p) => viewPlan(p, { checkIns, water, waterGoal: GAME.waterGoal }, todayKey)?.completed).length,
    ),
  }
}

/** "2,940" */
export const formatPoints = (n: number) => n.toLocaleString('en-US')
