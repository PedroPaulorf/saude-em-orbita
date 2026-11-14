import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { session } from '@/lib/session'
import { useSession } from '@/lib/use-session'
export function Login() {
  const state=useSession()
  const [username,setUsername]=useState('')
  const [password,setPassword]=useState('')
  function submit(e:FormEvent) { e.preventDefault(); void session.login(username.trim(),password).then(()=>setPassword('')) }
  return <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 px-6 py-12">
    <div><p className="font-display text-xl font-black uppercase tracking-wide">Health7</p><h1 className="mt-5 font-display text-3xl font-semibold">Crew sign in</h1><p className="mt-2 text-ink-soft">Access your own profile and health history.</p></div>
    <form onSubmit={submit} className="grid gap-5 rounded-xl border border-hairline bg-surface-1 p-6">
      <label className="grid gap-2 text-sm font-semibold">Username<Input name="username" autoComplete="username" required value={username} onChange={e=>setUsername(e.target.value)} disabled={state.busy}/></label>
      <label className="grid gap-2 text-sm font-semibold">Password<Input name="password" type="password" autoComplete="current-password" required value={password} onChange={e=>setPassword(e.target.value)} disabled={state.busy}/></label>
      {state.error&&<p role="alert" className="text-sm text-flag-mark">{state.error}</p>}
      <Button type="submit" disabled={state.busy}>{state.busy?'Connecting…':'Sign in'}</Button>
    </form>
    <p className="text-sm text-ink-soft">Fictional demonstration profiles. A server connection is required to verify your session. Pending check-ins stay linked to their owner on this device.</p>
  </main>
}
