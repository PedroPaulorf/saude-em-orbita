import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { AppShell } from '@/components/app/AppShell'
import { ChatPanel } from '@/components/app/ChatPanel'
import { DemoDataDialog } from '@/components/app/DemoDataDialog'
import { ScreenBoundary, ScreenSkeleton } from '@/components/app/ScreenStates'
import { GameEvents, RankChip } from '@/components/app/GameBits'
import { Button } from '@/components/ui/button'
import { navigate, useRoute } from '@/lib/route'
import { getTodayVitals } from '@/lib/health'
import { healthLevel } from '@/lib/present'
import { companionLines } from '@/lib/companion'
import { WATER_GOAL } from '@/lib/water'
import { session, type SessionState } from '@/lib/session'
import { useSession } from '@/lib/use-session'
import { useGame } from '@/lib/useGame'
import { BehavioralCheckIn } from '@/screens/BehavioralCheckIn'
import { HealthCheckUp } from '@/screens/HealthCheckUp'
import { DetailedStats } from '@/screens/DetailedStats'
import { Home } from '@/screens/Home'
import { Login } from '@/screens/Login'
import { Prevention } from '@/screens/Prevention'
import { MedicalData } from '@/screens/MedicalData'
import type { Profile } from '@/lib/api'
import type { Connection } from '@/types'

const ProgressScreen = lazy(() => import('@/screens/Progress').then((m) => ({ default: m.ProgressScreen })))

export default function App() {
  const state = useSession()
  useEffect(() => {
    void session.restore()
    const online = () => { void session.sync() }
    const retryTimer = window.setInterval(() => {
      if (session.getSnapshot().checkins.some(c => c.sync === 'pending')) void session.sync()
    }, 30000)
    const changed = (event: StorageEvent) => { if (event.key === 'health7:auth-change') session.invalidate() }
    window.addEventListener('online', online)
    window.addEventListener('storage', changed)
    return () => { window.clearInterval(retryTimer); window.removeEventListener('online', online); window.removeEventListener('storage', changed) }
  }, [])
  if (state.phase === 'restoring') return <main className="p-8" role="status">Verifying your session…</main>
  if (!state.profile) return <Login />
  return <AuthenticatedApp key={state.profile.id} state={state} profile={state.profile} />
}

function AuthenticatedApp({ state, profile }: { state: SessionState; profile: Profile }) {
  const route = useRoute()
  const game = useGame()
  const [companionOpen, setCompanionOpen] = useState(false)
  const [demoOpen, setDemoOpen] = useState(false)
  useEffect(() => { window.scrollTo({ top: 0 }) }, [route.path])
  // Fundo da página na cor da saúde de hoje: azul, laranja ou vermelho (styles/theme.css).
  const vitals = useMemo(() => getTodayVitals(profile, state.checkins), [profile, state.checkins])
  const level = healthLevel(vitals)
  const lines = useMemo(
    () => companionLines({ name: profile.displayName, vitals, healthDone: game.today.healthDone, moodDone: game.today.behavioralDone, water: game.today.water, waterGoal: WATER_GOAL }),
    [profile.displayName, vitals, game.today.healthDone, game.today.behavioralDone, game.today.water],
  )
  useEffect(() => {
    document.documentElement.dataset.health = level
    return () => { delete document.documentElement.dataset.health }
  }, [level])
  const pending = state.checkins.filter(c => c.sync === 'pending').length
  const rejected = state.checkins.filter(c => c.sync === 'rejected').length
  const connection: Connection = pending ? 'queued' : state.error || !state.historyLoaded ? 'offline' : 'online'
  let screen
  switch (route.path) {
    case '/data': screen = <MedicalData state={state} section={route.params.get('section')} />; break
    case '/prevention': screen = <Prevention game={game} connection={connection} params={route.params} profile={profile} checkins={state.checkins} />; break
    case '/progress': screen = <Suspense fallback={<ScreenSkeleton label="Loading progress" />}><ProgressScreen game={game} /></Suspense>; break
    case '/stats': screen = <DetailedStats params={route.params} profile={profile} checkins={state.checkins} symptoms={state.symptoms} truncated={state.truncated} historyLoaded={state.historyLoaded} />; break
    case '/check/health': screen = <HealthCheckUp />; break
    case '/check/behavioral': screen = <BehavioralCheckIn />; break
    default: screen = <Home connection={connection} game={game} profile={profile} checkins={state.checkins} />
  }
  return (
    <AppShell path={route.path} missionDay={profile.missionDay} connection={connection}
      syncing={state.syncing} onSync={() => { void session.sync() }}
      syncDetail={state.syncing ? 'Syncing with server' : pending ? `${pending} check-in${pending === 1 ? '' : 's'} queued on this device` : state.historyLoaded ? 'History synced with server' : 'Server history unavailable'}
      headerExtra={<><RankChip game={game} /><Button variant="ghost" size="sm" onClick={() => { navigate('/'); void session.logout() }}>Log out</Button></>}
      companionOpen={companionOpen} companionLines={lines} onOpenDemoData={() => setDemoOpen(true)} onToggleCompanion={() => setCompanionOpen(o => !o)}
      companionPanel={<ChatPanel game={game} onClose={() => setCompanionOpen(false)} />}>
      {(state.error || rejected > 0) && (
        <p role="alert" className="mx-auto max-w-[1360px] px-4 pt-3 text-sm font-semibold text-flag-ink md:px-8">
          {state.error}{state.error && rejected ? ' · ' : ''}{rejected ? `${rejected} rejected record${rejected === 1 ? '' : 's'} require review` : ''}
        </p>
      )}
      <ScreenBoundary resetKey={route.path}>{screen}</ScreenBoundary>
      <GameEvents game={game} />
      <DemoDataDialog open={demoOpen} onOpenChange={setDemoOpen} />
    </AppShell>
  )
}
