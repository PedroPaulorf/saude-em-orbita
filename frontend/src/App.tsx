import { toast } from 'sonner'
import { AppShell } from '@/components/app/AppShell'
import { crew } from '@/lib/health'
import { navigate, useRoute } from '@/lib/route'
import { latestCheckIn } from '@/lib/storage'
import { CheckIn } from '@/screens/CheckIn'
import { Home } from '@/screens/Home'
import { Placeholder } from '@/screens/Placeholder'
import { isTodayUtc } from '@/lib/utils'
import type { Connection } from '@/types'

export default function App() {
  const route = useRoute()

  // Sem servidor: o relatório fica guardado para envio quando houver contato com o solo.
  // Recalculado a cada troca de rota, então reflete um check-up recém-salvo.
  const connection: Connection = isTodayUtc(latestCheckIn()?.at) ? 'queued' : 'offline'

  let screen
  switch (route.path) {
    case '/progress':
      screen = <Placeholder title="Progress" text="Your rank, trends and check-up history will appear here." />
      break
    case '/stats':
      screen = <Placeholder title="Detailed stats" text="Your body map and today's measures will appear here." />
      break
    case '/check/health':
    case '/check/behavioral':
      // Fase 1: o fluxo antigo, saúde e comportamento juntos. Separado na fase 3.
      screen = (
        <div className="h7 bg-transparent max-md:[&_.h7-screen]:px-4">
          <CheckIn onCancel={() => navigate('/')} onDone={() => navigate('/')} />
        </div>
      )
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
