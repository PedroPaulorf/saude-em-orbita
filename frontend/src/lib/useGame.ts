import { useMemo } from 'react'
import { summarize, type GameSummary } from '@/lib/game'
import { loadCheckIns, useCheckInsVersion } from '@/lib/storage'
import { usePlans } from '@/lib/plans'
import { useWaterLog } from '@/lib/water'

/** Resumo do jogo, recalculado quando um check-up é salvo ou a água muda. */
export function useGame(): GameSummary {
  const version = useCheckInsVersion()
  const water = useWaterLog()
  const plans = usePlans()
  return useMemo(() => {
    void version // relê os registros depois de cada gravação
    return summarize(loadCheckIns(), water, undefined, plans)
  }, [version, water, plans])
}
