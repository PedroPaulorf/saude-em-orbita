import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { flushSync } from 'react-dom'
import { ArrowLeft, Eye, EyeOff } from 'lucide-react'
import { AstronautIcon } from '@/components/app/AstronautIcon'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { apiRequest } from '@/lib/api'
import { session } from '@/lib/session'
import { useSession } from '@/lib/use-session'
import { cn } from '@/lib/utils'

/** What the public profile list returns: identity labels only, never health data. */
interface LoginProfile { username: string; name: string; role: string | null; bodyModel: 'male' | 'female' }
type Step = { kind: 'pick' } | { kind: 'password'; index: number } | { kind: 'manual' }

const TINTS = ['bg-sa-electric', 'bg-sa-yonder', 'bg-sa-rocket-600', 'bg-sa-neon-blue', 'bg-sa-martian']

/** Morphs the chosen avatar between the grid and the password step where the browser supports it. */
function morph(update: () => void) {
  if (!document.startViewTransition || window.matchMedia('(prefers-reduced-motion: reduce)').matches) { update(); return }
  document.startViewTransition(() => flushSync(update))
}

function Avatar({ profile, index, className }: { profile: LoginProfile; index: number; className?: string }) {
  return (
    <span className={cn('block overflow-hidden rounded-full', TINTS[index % TINTS.length], className)}
      style={{ viewTransitionName: `login-avatar-${index}` }}>
      <AstronautIcon model={profile.bodyModel} className="size-full" />
    </span>
  )
}

export function Login() {
  const state = useSession()
  const [profiles, setProfiles] = useState<LoginProfile[] | null>(null)
  const [step, setStep] = useState<Step>({ kind: 'pick' })
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [attempts, setAttempts] = useState(0)
  const [dismissedError, setDismissedError] = useState<string | null>(null)
  const passwordRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const controller = new AbortController()
    apiRequest<{ profiles: LoginProfile[] }>('/auth/profiles', undefined, controller.signal)
      .then(result => setProfiles(result.profiles))
      // Without the list (server offline, older API) the username form still works.
      .catch(() => { if (!controller.signal.aborted) setProfiles([]) })
    return () => controller.abort()
  }, [])

  const selected = step.kind === 'password' ? profiles?.[step.index] : undefined
  const manual = step.kind === 'manual' || profiles?.length === 0
  const canGoBack = !!profiles?.length && step.kind !== 'pick'

  // After a failed attempt the field is enabled again: put the cursor back in it.
  useEffect(() => { if (!state.busy && attempts > 0) passwordRef.current?.focus() }, [state.busy, attempts])

  const rawError = state.error === dismissedError ? null : state.error
  const error = selected && rawError === 'Incorrect username or password.' ? 'Incorrect password.' : rawError

  function open(next: Step) {
    morph(() => { setStep(next); setPassword(''); setShowPassword(false); setAttempts(0); setDismissedError(state.error) })
  }
  function submit(event: FormEvent) {
    event.preventDefault()
    setDismissedError(null)
    void session.login(selected?.username ?? username.trim(), password).then(() => { setPassword(''); setAttempts(n => n + 1) })
  }

  const passwordField = (
    <div className="grid gap-2 text-sm font-semibold">
      <label htmlFor="login-password">Password</label>
      <div className="relative">
        <Input ref={passwordRef} id="login-password" name="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password"
          required autoFocus={!!selected} className="h-11 pr-12" value={password} onChange={e => setPassword(e.target.value)} disabled={state.busy}
          aria-invalid={error ? true : undefined} aria-describedby={error ? 'login-error' : undefined} />
        <button type="button" onClick={() => setShowPassword(shown => !shown)} aria-label={showPassword ? 'Hide password' : 'Show password'}
          aria-pressed={showPassword} className="absolute inset-y-0 right-0 grid w-11 place-items-center rounded-md text-ink-soft hover:text-ink">
          {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
        </button>
      </div>
    </div>
  )
  const errorLine = error && <p id="login-error" role="alert" className="text-sm text-flag-mark">{error}</p>
  const submitButton = <Button type="submit" disabled={state.busy}>{state.busy ? 'Connecting…' : 'Sign in'}</Button>
  const backButton = canGoBack && (
    <Button type="button" variant="ghost" onClick={() => open({ kind: 'pick' })} disabled={state.busy}>
      <ArrowLeft /> Choose another profile
    </Button>
  )

  let content: ReactNode
  if (!profiles) {
    content = <p role="status" className="text-center text-ink-soft">Loading crew profiles…</p>
  } else if (selected && step.kind === 'password') {
    content = (
      <div className="mx-auto flex w-full max-w-xs flex-col items-center gap-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <div key={attempts} className={cn(error && attempts > 0 && 'animate-login-shake')}>
            <Avatar profile={selected} index={step.index} className="size-32 sm:size-40" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-semibold">{selected.name}</h1>
            {selected.role && <p className="mt-1 text-ink-soft">{selected.role}</p>}
          </div>
        </div>
        <form onSubmit={submit} className="grid w-full gap-5">
          {/* Lets password managers file the password under the chosen account. */}
          <input type="text" name="username" autoComplete="username" value={selected.username} readOnly hidden />
          {passwordField}
          {errorLine}
          {submitButton}
          {backButton}
        </form>
      </div>
    )
  } else if (manual) {
    content = (
      <div className="mx-auto w-full max-w-md">
        <h1 className="font-display text-3xl font-semibold">Crew sign in</h1>
        <p className="mt-2 text-ink-soft">Access your own profile and health history.</p>
        <form onSubmit={submit} className="mt-6 grid gap-5 rounded-xl border border-hairline bg-surface-1 p-6">
          <label className="grid gap-2 text-sm font-semibold">Username
            <Input name="username" autoComplete="username" required autoFocus={canGoBack} className="h-11" value={username}
              onChange={e => setUsername(e.target.value)} disabled={state.busy} />
          </label>
          {passwordField}
          {errorLine}
          {submitButton}
          {backButton}
        </form>
      </div>
    )
  } else {
    content = (
      <>
        <h1 className="text-center font-display text-3xl font-semibold sm:text-4xl">Who&rsquo;s checking in?</h1>
        <ul className="flex flex-wrap justify-center gap-x-4 gap-y-8 sm:gap-x-8">
          {profiles.map((profile, index) => (
            <li key={profile.username}>
              <button type="button" data-profile={profile.username} onClick={() => open({ kind: 'password', index })}
                className="group flex w-32 flex-col items-center gap-3 rounded-xl p-2 focus-visible:outline-none sm:w-40">
                <Avatar profile={profile} index={index} className="size-24 ring-4 ring-transparent transition duration-150 ease-out group-hover:scale-108 group-hover:ring-brand group-focus-visible:scale-108 group-focus-visible:ring-brand sm:size-32" />
                <span className="text-center">
                  <span className="block font-semibold text-ink-soft transition-colors group-hover:text-ink group-focus-visible:text-ink">{profile.name}</span>
                  {profile.role && <span className="mt-0.5 block text-sm text-ink-soft">{profile.role}</span>}
                </span>
              </button>
            </li>
          ))}
        </ul>
        {errorLine && <div className="text-center">{errorLine}</div>}
        <div className="flex justify-center">
          <Button type="button" variant="outline" onClick={() => open({ kind: 'manual' })}>Use another account</Button>
        </div>
      </>
    )
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col justify-center gap-8 px-6 py-12"
      onKeyDown={event => { if (event.key === 'Escape' && canGoBack && !state.busy) open({ kind: 'pick' }) }}>
      <p className="text-center font-display text-xl font-black uppercase tracking-wide">Health7</p>
      {content}
      <p className="mx-auto max-w-md text-center text-sm text-ink-soft">Fictional demonstration profiles. A server connection is required to verify your session. Pending check-ins stay linked to their owner on this device.</p>
    </main>
  )
}
