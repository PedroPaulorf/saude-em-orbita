import { useMemo } from 'react'
import { useCognitive } from '@/lib/cognitive'
import { monitor, type MonitorResult } from '@/lib/monitor'
import { useSession } from '@/lib/use-session'

/** Resultado do motor de monitoramento para hoje, recalculado a cada check-up, sintoma ou teste novo. */
export function useMonitor(): MonitorResult | null {
  const { profile, checkins, symptoms, environment } = useSession()
  const cognitive = useCognitive()
  return useMemo(
    () => (profile ? monitor({ profile, checkins, symptoms, cognitive, environment }) : null),
    [profile, checkins, symptoms, cognitive, environment],
  )
}
