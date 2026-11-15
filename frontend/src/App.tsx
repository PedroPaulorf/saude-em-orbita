import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { AppShell } from '@/components/app/AppShell'
import { ChatPanel } from '@/components/app/ChatPanel'
import { DemoDataDialog } from '@/components/app/DemoDataDialog'
import { ScreenBoundary, ScreenSkeleton } from '@/components/app/ScreenStates'
import { GameEvents } from '@/components/app/GameBits'
import { navigate, useRoute } from '@/lib/route'
import { getTodayVitals } from '@/lib/health'
import { healthLevel, type HealthLevel } from '@/lib/present'
import { signalText, stateRank, topSignals, type MonitorState } from '@/lib/monitor'
import { useMonitor } from '@/lib/useMonitor'
import { usePatterns } from '@/lib/usePrevention'
import { companionLines } from '@/lib/companion'
import { WATER_GOAL } from '@/lib/water'
import { session, type SessionState } from '@/lib/session'
import { useSession } from '@/lib/use-session'
import { useGame } from '@/lib/useGame'
import { useCrew } from '@/lib/crew'
import { CrewBar } from '@/components/app/CrewBar'
import { formatPoints } from '@/lib/game'
import { initials } from '@/lib/person'
import { useMission } from '@/lib/mission'
import { MissionSelect } from '@/screens/MissionSelect'
import { BehavioralCheckIn } from '@/screens/BehavioralCheckIn'
import { HealthCheckUp } from '@/screens/HealthCheckUp'
import { DetailedStats } from '@/screens/DetailedStats'
import { Home } from '@/screens/Home'
import { Login } from '@/screens/Login'
import { Prevention } from '@/screens/Prevention'
import { MedicalData } from '@/screens/MedicalData'
import { Integrations } from '@/screens/Integrations'
import { MenstrualCalendar } from '@/screens/MenstrualCalendar'
import { Profile as ProfileScreen } from '@/screens/Profile'
import type { Profile } from '@/lib/api'
import type { Connection } from '@/types'

// A landing traz GSAP e Lenis: carrega sob demanda, para não pesar o app de quem já está logado.
const Landing = lazy(() => import('@/screens/Landing').then((m) => ({ default: m.Landing })))
const landingFallback = <div className="min-h-screen bg-sa-deep" />

const ProgressScreen = lazy(() => import('@/screens/Progress').then((m) => ({ default: m.ProgressScreen })))

export default function App() {
  const state = useSession()
  const route = useRoute()
  const wasAuthenticated = useRef(false)
  useEffect(() => {
    if (state.profile) wasAuthenticated.current = true
    else if (wasAuthenticated.current && state.phase === 'signed-out') {
      wasAuthenticated.current = false
      // An expired or invalidated session returns to sign-in; a normal logout returns to the landing.
      if (state.error) navigate('/login', undefined, { replace: true })
    }
  }, [state.profile, state.phase, state.error])
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
  // Sem sessão: a landing page explica o projeto; "Try the demo" leva ao login.
  if (!state.profile) return route.path === '/login' ? <Login /> : <Suspense fallback={landingFallback}><Landing /></Suspense>
  return <AuthenticatedApp key={state.profile.id} state={state} profile={state.profile} />
}

function AuthenticatedApp({ state, profile }: { state: SessionState; profile: Profile }) {
  const route = useRoute()
  const game = useGame()
  const [companionOpen, setCompanionOpen] = useState(false)
  const [demoOpen, setDemoOpen] = useState(false)
  // Passo 2: sem missão escolhida (ou em #/mission), a tela de missões vem antes do app.
  const mission = useMission(profile.id)
  const choosingMission = !mission || route.path === '/mission'
  useEffect(() => { window.scrollTo({ top: 0 }) }, [route.path])
  // Logado, o endereço do login não tem o que mostrar: volta para a Home.
  useEffect(() => { if (route.path === '/login') navigate('/', undefined, { replace: true }) }, [route.path])
  // Fundo da página na cor da saúde de hoje: azul, laranja ou vermelho (styles/theme.css).
  const vitals = useMemo(() => getTodayVitals(profile, state.checkins), [profile, state.checkins])
  // O fundo segue o estado do motor de monitoramento; sem motor, a avaliação das medidas de hoje.
  const monitor = useMonitor()
  // Passo 4: estado de cada colega de tripulação, na barra logo abaixo do cabeçalho.
  const crew = useCrew(profile, monitor)
  const level: HealthLevel = monitor ? LEVEL[monitor.state] : healthLevel(vitals)
  const patterns = usePatterns()
  // Frase do companheiro quando o estado não é estável; "rose": subiu desde o dia anterior.
  const previous = monitor?.history.at(-2)
  const changeState = monitor && monitor.state !== 'STABLE' ? monitor.state : undefined
  const changeRose = !!monitor && (!previous || stateRank(monitor.state) > stateRank(previous.state))
  const changeTopic = topicOf(patterns.find((p) => p.active)?.def.id, monitor?.signals.find((s) => s.kind === 'measure')?.metric)
  const lines = useMemo(
    () => companionLines({ name: profile.displayName, vitals, healthDone: game.today.healthDone, moodDone: game.today.behavioralDone, water: game.today.water, waterGoal: WATER_GOAL,
      change: changeState ? { state: changeState, rose: changeRose, topic: changeTopic } : undefined }),
    [profile.displayName, vitals, game.today.healthDone, game.today.behavioralDone, game.today.water, changeState, changeRose, changeTopic],
  )
  useEffect(() => {
    if (choosingMission) return
    document.documentElement.dataset.health = level
    return () => { delete document.documentElement.dataset.health }
  }, [level, choosingMission])
  const pending = state.checkins.filter(c => c.sync === 'pending').length
  const rejected = state.checkins.filter(c => c.sync === 'rejected').length
  const connection: Connection = pending ? 'queued' : state.error || !state.historyLoaded ? 'offline' : 'online'
  let screen
  switch (route.path) {
    case '/menstrual': screen = <MenstrualCalendar profile={profile} />; break
    case '/integrations': screen = <Integrations key={profile.id} owner={profile.id} />; break
    case '/profile': screen = <ProfileScreen profile={profile} game={game} />; break
    case '/data': screen = <MedicalData state={state} section={route.params.get('section')} />; break
    case '/prevention': screen = <Prevention game={game} connection={connection} params={route.params} profile={profile} checkins={state.checkins} />; break
    case '/progress': screen = <Suspense fallback={<ScreenSkeleton label="Loading progress" />}><ProgressScreen game={game} /></Suspense>; break
    case '/stats': screen = <DetailedStats params={route.params} profile={profile} checkins={state.checkins} symptoms={state.symptoms} truncated={state.truncated} historyLoaded={state.historyLoaded} />; break
    case '/check/health': screen = <HealthCheckUp />; break
    case '/check/behavioral': screen = <BehavioralCheckIn />; break
    default: screen = <Home connection={connection} game={game} profile={profile} checkins={state.checkins} />
  }
  if (route.path === '/welcome') return <Suspense fallback={landingFallback}><Landing signedIn /></Suspense>
  const logout = () => { navigate('/'); void session.logout() }
  if (choosingMission) {
    return <MissionSelect crewId={profile.id} name={profile.displayName} current={mission?.id} onLogout={logout}
      onChosen={() => { if (route.path === '/mission') navigate('/', undefined, { replace: true }) }} />
  }
  return (
    <AppShell path={route.path} missionDay={profile.missionDay} mission={mission?.short} connection={connection}
      syncing={state.syncing} onSync={() => { void session.sync() }}
      crewBar={<CrewBar crew={crew} />}
      syncDetail={state.syncing ? 'Syncing with server' : pending ? `${pending} check-in${pending === 1 ? '' : 's'} queued on this device` : state.historyLoaded ? 'History synced with server' : 'Server history unavailable'}
      account={{ name: profile.displayName, initials: initials(profile.displayName), rank: game.rank.name, points: formatPoints(game.totalPoints), onLogout: logout }}
      companionOpen={companionOpen} companionLines={lines} onOpenDemoData={() => setDemoOpen(true)} onToggleCompanion={() => setCompanionOpen(o => !o)}
      companionPanel={<ChatPanel game={game} onClose={() => setCompanionOpen(false)} />}
      escalate={monitor?.state === 'ESCALATE' ? { crew: profile.nexus?.crewId ?? profile.displayName, crewId: profile.id, date: monitor.date, day: monitor.day,
        reasons: monitor.reasons, signals: topSignals(monitor, 4).map(signalText), ruleVersion: monitor.ruleVersion } : null}>
      {(state.error || rejected > 0) && (
        <p role="alert" className="mx-auto max-w-[1360px] px-4 pt-3 text-sm font-semibold text-flag-ink md:px-8">
          {state.error}{state.error && rejected ? ' · ' : ''}{rejected ? `${rejected} rejected record${rejected === 1 ? '' : 's'} require review` : ''}
        </p>
      )}
      <ScreenBoundary resetKey={route.path}>{screen}</ScreenBoundary>
      <GameEvents game={game} ready={state.historyLoaded || !!state.error} />
      <DemoDataDialog open={demoOpen} onOpenChange={setDemoOpen} />
    </AppShell>
  )
}

const LEVEL: Record<MonitorState, HealthLevel> = { STABLE: 'calm', WATCH: 'watch', 'PERSISTENT CHANGE': 'watch', ESCALATE: 'alert' }

/** Assunto da frase do companheiro: o padrão ativo da pesquisa ou, sem padrão, a medida principal. */
function topicOf(pattern?: string, metric?: string) {
  if (pattern === 'C12' || pattern === 'C16' || pattern === 'C06') return 'hydration'
  if (pattern === 'C18') return 'sleep'
  if (pattern === 'C05') return 'headaches'
  if (pattern === 'C09') return 'breathing and temperature'
  if (metric === 'urinations24h' || metric === 'bodyMass') return 'hydration'
  if (metric === 'sleep') return 'sleep'
  if (metric === 'temperature' || metric === 'respiratoryRate' || metric === 'spo2') return 'breathing and temperature'
  if (metric === 'heartRate' || metric === 'bloodPressure') return 'heart rate'
  return 'measurements'
}

