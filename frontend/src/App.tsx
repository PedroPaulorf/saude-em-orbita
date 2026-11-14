import { useState } from 'react'
import { TopBar } from '@/components/h7'
import { crew } from '@/lib/health'
import { latestCheckIn } from '@/lib/storage'
import { CheckIn } from '@/screens/CheckIn'
import { Dashboard } from '@/screens/Dashboard'
import type { Connection } from '@/types'

type Screen = 'dashboard' | 'checkin'

function isToday(iso: string | undefined) {
  return !!iso && iso.slice(0, 10) === new Date().toISOString().slice(0, 10)
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('dashboard')
  // Muda a cada check-up salvo, para o painel reler o localStorage.
  const [version, setVersion] = useState(0)

  // Sem servidor: o relatório fica guardado para envio quando houver contato com o solo.
  const connection: Connection = isToday(latestCheckIn()?.at) ? 'queued' : 'offline'

  return (
    <div className="h7 min-h-screen">
      <TopBar who={`${crew.displayName} · Mission day ${crew.missionDay}`} connection={connection} />
      {screen === 'dashboard' ? (
        <Dashboard key={version} connection={connection} onStartCheckIn={() => setScreen('checkin')} />
      ) : (
        <CheckIn
          onCancel={() => setScreen('dashboard')}
          onDone={() => {
            setVersion((v) => v + 1)
            setScreen('dashboard')
          }}
        />
      )}
    </div>
  )
}
