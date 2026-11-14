import { toast } from 'sonner'
import { AppShell } from '@/components/app/AppShell'
import { crew } from '@/lib/health'
import { useRoute } from '@/lib/route'
import { latestAny, useCheckInsVersion } from '@/lib/storage'
import { BehavioralCheckIn } from '@/screens/BehavioralCheckIn'
import { HealthCheckUp } from '@/screens/HealthCheckUp'
import { Home } from '@/screens/Home'
import { Placeholder } from '@/screens/Placeholder'
import { isTodayUtc } from '@/lib/utils'
import type { Connection } from '@/types'

export default function App() {
  const route = useRoute()
  // Re-renderiza quando um check-up é salvo, para o cabeçalho mostrar "Report queued" na hora.
  useCheckInsVersion()

  // Sem servidor: o relatório fica guardado para envio quando houver contato com o solo.
  // Recalculado a cada troca de rota, então reflete um check-up recém-salvo.
  const connection: Connection = isTodayUtc(latestAny()?.at) ? 'queued' : 'offline'

  let screen
  switch (route.path) {
    case '/progress':
      screen = <Placeholder title="Progress" text="Your rank, trends and check-up history will appear here." />
      break
    case '/stats':
      screen = <Placeholder title="Detailed stats" text="Your body map and today's measures will appear here." />
      break
    case '/check/health':
      screen = <HealthCheckUp />
      break
    case '/check/behavioral':
      screen = <BehavioralCheckIn />
      break
    default:
      screen = <Home connection={connection} />
  }

  return (
    <AppShell
      path={route.path}
      who={crew.displayName}
      missionDay={crew.missionDay}
      connection={connection}
      onOpenCompanion={() => toast('Your companion is not connected yet.')}
    >
      {screen}
    </AppShell>
  )
}
