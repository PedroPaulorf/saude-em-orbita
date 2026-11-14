import { useMemo } from 'react'
import { getTodayVitals, lastDayKeys } from '@/lib/health'
import { evaluatePatterns, type PatternResult, type PreventionInput } from '@/lib/prevention'
import { activePlan, usePlans, viewPlan, type PlanView } from '@/lib/plans'
import { latestCheckIn, loadCheckIns, useCheckInsVersion } from '@/lib/storage'
import { isTodayUtc } from '@/lib/utils'
import { useWaterLog, WATER_GOAL, type WaterLog } from '@/lib/water'

/** Entrada dos padrões a partir do que está salvo agora. */
export function preventionInput(water: WaterLog, today = new Date()): PreventionInput {
  const behavioral = latestCheckIn('behavioral')
  return {
    vitals: getTodayVitals(today),
    behavioralToday: behavioral && isTodayUtc(behavioral.at) ? behavioral.behavioral : null,
    water,
    waterGoal: WATER_GOAL,
    days: lastDayKeys(7, today),
  }
}

/** Padrões avaliados, recalculados quando um check-up é salvo ou a água muda. */
export function usePatterns(): PatternResult[] {
  const version = useCheckInsVersion()
  const water = useWaterLog()
  return useMemo(() => {
    void version // relê os registros depois de cada gravação
    return evaluatePatterns(preventionInput(water))
  }, [version, water])
}

/** Plano em andamento, ou null; recalculado com check-ups, água e planos. */
export function useActivePlan(): PlanView | null {
  const version = useCheckInsVersion()
  const water = useWaterLog()
  const plans = usePlans()
  return useMemo(() => {
    void version
    return activePlan(plans, { checkIns: loadCheckIns(), water, waterGoal: WATER_GOAL })
  }, [version, water, plans])
}

/** Todos os planos já vistos (para "Past plans" e o resultado do que acabou de fechar). */
export function usePlanViews(): PlanView[] {
  const version = useCheckInsVersion()
  const water = useWaterLog()
  const plans = usePlans()
  return useMemo(() => {
    void version
    const ctx = { checkIns: loadCheckIns(), water, waterGoal: WATER_GOAL }
    return plans.map((p) => viewPlan(p, ctx)).filter((v): v is PlanView => v != null)
  }, [version, water, plans])
}
