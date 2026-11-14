import { useEffect } from 'react'
import { toast } from 'sonner'
import { AppShell } from '@/components/app/AppShell'
import { Button } from '@/components/ui/button'
import { navigate, useRoute } from '@/lib/route'
import { session } from '@/lib/session'
import { useSession } from '@/lib/use-session'
import { CheckIn } from '@/screens/CheckIn'
import { Home } from '@/screens/Home'
import { Login } from '@/screens/Login'
import { Stats } from '@/screens/Stats'
import { Placeholder } from '@/screens/Placeholder'
import type { Connection } from '@/types'
export default function App() {
  const route=useRoute(),state=useSession()
  useEffect(()=>{void session.restore(); const online=()=>{void session.sync()}; const changed=(event:StorageEvent)=>{if(event.key==='health7:auth-change')session.invalidate()}; window.addEventListener('online',online);window.addEventListener('storage',changed);return()=>{window.removeEventListener('online',online);window.removeEventListener('storage',changed)}},[])
  if(state.phase==='restoring')return <main className="p-8" role="status">Verifying your session…</main>
  if(!state.profile)return <Login/>
  const profile=state.profile
  const pending=state.checkins.filter(c=>c.sync==='pending').length
  const rejected=state.checkins.filter(c=>c.sync==='rejected').length
  const connection:Connection=pending?'queued':state.error?'offline':'online'
  let screen
  switch(route.path) {
    case '/progress':screen=<Placeholder title="Progress" text="Your rank and longer-term trends will appear here."/>;break
    case '/stats':screen=<Stats profile={profile} checkins={state.checkins} symptoms={state.symptoms} region={route.params.get('region')} truncated={state.truncated} historyLoaded={state.historyLoaded}/>;break
    case '/check/health':case '/check/behavioral':screen=<div className="h7 bg-transparent max-md:[&_.h7-screen]:px-4"><CheckIn key={profile.id} profile={profile} onCancel={()=>navigate('/')} onDone={()=>navigate('/')}/></div>;break
    default:screen=<Home key={profile.id} profile={profile} checkins={state.checkins} connection={connection}/>
  }
  return <AppShell path={route.path} who={profile.displayName} missionDay={profile.missionDay} connection={connection} onOpenCompanion={()=>toast('Your companion is not connected yet.')} headerExtra={<Button variant="ghost" size="sm" onClick={()=>{navigate('/');void session.logout()}}>Log out</Button>}>
    <div className="mx-auto flex max-w-[1360px] flex-wrap items-center gap-3 px-4 pt-4 text-sm md:px-8"><p role="status">{state.syncing?'Syncing with server…':pending?`${pending} check-in${pending===1?'':'s'} queued on this device`:state.historyLoaded?'History synced with server':'Server history unavailable'}{rejected?` · ${rejected} rejected record${rejected===1?'':'s'} require review`:''}</p><Button variant="outline" size="sm" disabled={state.syncing} onClick={()=>{void session.sync()}}>Sync now</Button><span className="text-xs text-ink-soft">Server sync does not send reports to Earth.</span>{state.error&&<p role="alert" className="w-full text-flag-mark">{state.error}</p>}</div>{screen}
  </AppShell>
}
