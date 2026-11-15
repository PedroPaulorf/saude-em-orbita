import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { href } from '@/lib/route'
import { session } from '@/lib/session'
import { useSession } from '@/lib/use-session'
export function Login() {
  const state=useSession()
  const [username,setUsername]=useState('')
  const [password,setPassword]=useState('')
  function submit(e:FormEvent) { e.preventDefault(); void session.login(username.trim(),password).then(()=>setPassword('')) }
  // Conta pública da demo, configurada no deploy (.env.local); sem ela, só o formulário.
  const demo = import.meta.env.VITE_DEMO_USERNAME && import.meta.env.VITE_DEMO_PASSWORD ? { user: import.meta.env.VITE_DEMO_USERNAME, pass: import.meta.env.VITE_DEMO_PASSWORD } : null
  return <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 px-6 py-12">
    <div><a href={href('/welcome')} className="font-display text-xl font-black uppercase tracking-wide text-ink no-underline">Health7</a><h1 className="mt-5 font-display text-3xl font-semibold">Crew sign in</h1><p className="mt-2 text-ink-soft">Access your own profile and health history.</p></div>
    {demo&&<Button type="button" size="lg" className="h-12 text-base" disabled={state.busy} onClick={()=>void session.login(demo.user,demo.pass)}>{state.busy?'Connecting…':'Enter as a demo astronaut'}</Button>}
    <form onSubmit={submit} className="grid gap-5 rounded-xl border border-hairline bg-surface-1 p-6">
      <label className="grid gap-2 text-sm font-semibold">Username<Input name="username" autoComplete="username" required value={username} onChange={e=>setUsername(e.target.value)} disabled={state.busy}/></label>
      <label className="grid gap-2 text-sm font-semibold">Password<Input name="password" type="password" autoComplete="current-password" required value={password} onChange={e=>setPassword(e.target.value)} disabled={state.busy}/></label>
      {state.error&&<p role="alert" className="text-sm text-flag-mark">{state.error}</p>}
      <Button type="submit" disabled={state.busy}>{state.busy?'Connecting…':'Sign in'}</Button>
    </form>
    <a href={href('/welcome')} className="text-sm font-semibold">About Health7</a>
    <p className="text-sm text-ink-soft">Fictional demonstration profiles. A server connection is required to verify your session. Pending check-ins stay linked to their owner on this device.</p>
  </main>
}
