import { useMemo } from 'react'
import { patternsFromMonitor, type PatternResult } from '@/lib/prevention'
import { useMonitor } from '@/lib/useMonitor'
import { activePlan, usePlans, viewPlan, type PlanView } from '@/lib/plans'
import { loadCheckIns, useCheckInsVersion } from '@/lib/storage'
import { useUtcDayKey } from '@/lib/use-utc-day'
import { useWaterLog, WATER_GOAL } from '@/lib/water'

/** As condições da pesquisa avaliadas sobre o motor de monitoramento de hoje. */
export function usePatterns(): PatternResult[] {
  const result = useMonitor()
  return useMemo(() => (result ? patternsFromMonitor(result) : []), [result])
}

/** Plano em andamento, ou null; recalculado com check-ups, água, planos e a virada do dia UTC. */
export function useActivePlan(): PlanView | null {
  const version = useCheckInsVersion()
  const water = useWaterLog()
  const plans = usePlans()
  const today = useUtcDayKey()
  return useMemo(() => {
    void version
    return activePlan(plans, { checkIns: loadCheckIns(), water, waterGoal: WATER_GOAL }, today)
  }, [version, water, plans, today])
}

/** Todos os planos já vistos (para "Past plans" e o resultado do que acabou de fechar). */
export function usePlanViews(): PlanView[] {
  const version = useCheckInsVersion()
  const water = useWaterLog()
  const plans = usePlans()
  const today = useUtcDayKey()
  return useMemo(() => {
    void version
    const ctx = { checkIns: loadCheckIns(), water, waterGoal: WATER_GOAL }
    return plans.map((p) => viewPlan(p, ctx, today)).filter((v): v is PlanView => v != null)
  }, [version, water, plans, today])
}
