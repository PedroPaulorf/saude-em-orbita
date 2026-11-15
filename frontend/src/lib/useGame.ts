import { useMemo } from 'react'
import { summarize, type GameSummary } from '@/lib/game'
import { loadCheckIns, useCheckInsVersion } from '@/lib/storage'
import { usePlans } from '@/lib/plans'
import { useUtcDayKey } from '@/lib/use-utc-day'
import { useWaterLog } from '@/lib/water'

/** Resumo do jogo, recalculado quando um check-up é salvo, a água muda ou vira o dia UTC. */
export function useGame(): GameSummary {
  const version = useCheckInsVersion()
  const water = useWaterLog()
  const plans = usePlans()
  const today = useUtcDayKey()
  return useMemo(() => {
    void version // relê os registros depois de cada gravação
    return summarize(loadCheckIns(), water, today, plans)
  }, [version, water, plans, today])
}
