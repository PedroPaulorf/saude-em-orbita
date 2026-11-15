import { ArrowRight, Clock, LogOut, Radio } from 'lucide-react'
import { MISSIONS, setMission, type Destination, type Mission } from '@/lib/mission'
import { cn } from '@/lib/utils'

/*
  Escolha da missão (passo 2): três cartões depois do perfil. Escolher leva à Home já com a missão.
  Sem cabeçalho do app: é uma etapa de entrada, como a escolha de perfil.
*/

/** Destino desenhado em SVG, nas cores do Space Apps: Terra com a órbita, Lua, Marte. */
function Planet({ destination }: { destination: Destination }) {
  if (destination === 'leo') {
    return (
      <svg viewBox="0 0 120 120" aria-hidden className="size-28">
        <circle cx="60" cy="60" r="34" fill="#2e96f5" />
        <path d="M38 48c8-6 14 2 22-2s10-10 18-6 6 12 0 16-14 0-20 8-14 8-20 0 0-14 0-16z" fill="#0960e1" />
        <ellipse cx="60" cy="60" rx="54" ry="16" fill="none" stroke="#eafe07" strokeWidth="2.5" strokeDasharray="5 5" transform="rotate(-18 60 60)" />
        <circle cx="110" cy="44" r="5" fill="#eafe07" />
      </svg>
    )
  }
  if (destination === 'moon') {
    return (
      <svg viewBox="0 0 120 120" aria-hidden className="size-28">
        <circle cx="60" cy="60" r="40" fill="#d9dde6" />
        <circle cx="46" cy="48" r="9" fill="#b8bfcc" />
        <circle cx="72" cy="70" r="12" fill="#b8bfcc" />
        <circle cx="74" cy="40" r="5" fill="#b8bfcc" />
        <circle cx="44" cy="76" r="4" fill="#b8bfcc" />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 120 120" aria-hidden className="size-28">
      <circle cx="60" cy="60" r="40" fill="#e43700" />
      <path d="M26 54c10 4 22-2 34 2s22 0 34-4" stroke="#8e1100" strokeWidth="6" fill="none" strokeLinecap="round" />
      <circle cx="74" cy="76" r="7" fill="#8e1100" />
      <circle cx="44" cy="40" r="4" fill="#8e1100" />
    </svg>
  )
}

function MissionCard({ mission, current, onChoose }: { mission: Mission; current: boolean; onChoose: () => void }) {
  return (
    <li className="flex">
      <button
        type="button"
        onClick={onChoose}
        aria-label={`Choose ${mission.short}: ${mission.name}`}
        aria-pressed={current}
        className={cn(
          'group flex w-full flex-col items-center gap-4 rounded-2xl border-2 bg-surface-1 p-6 text-center transition-[transform,border-color] hover:-translate-y-1 hover:border-sa-yellow focus-visible:-translate-y-1 focus-visible:border-sa-yellow motion-reduce:transform-none',
          current ? 'border-sa-yellow' : 'border-hairline',
        )}
      >
        <Planet destination={mission.destination} />
        <span className="grid gap-1">
          <span className="font-display text-3xl font-black tracking-wide text-ink uppercase">{mission.short}</span>
          <span className="text-ink-soft">{mission.name}</span>
        </span>
        <span className="grid w-full gap-2 text-left text-sm">
          <span className="flex items-center gap-2 rounded-lg bg-surface-2 px-3 py-2">
            <Clock className="size-4 shrink-0 text-sa-yonder" aria-hidden />
            <span className="text-ink-soft">Duration</span>
            <span className="ml-auto font-mono text-ink">{mission.durationDays} days</span>
          </span>
          <span className="flex items-center gap-2 rounded-lg bg-surface-2 px-3 py-2">
            <Radio className="size-4 shrink-0 text-sa-yonder" aria-hidden />
            <span className="text-ink-soft">Ground delay</span>
            <span className="ml-auto text-right text-ink">{mission.commsDelay}</span>
          </span>
        </span>
        <span className="text-[15px] text-ink">{mission.summary}</span>
        <span className="mt-auto inline-flex h-11 items-center gap-2 rounded-full bg-sa-rocket-600 px-5 font-semibold text-white group-hover:bg-sa-rocket">
          {current ? 'Continue mission' : 'Start mission'}
          <ArrowRight className="size-4" aria-hidden />
        </span>
      </button>
    </li>
  )
}

export function MissionSelect({ crewId, name, current, onChosen, onLogout }: { crewId: string; name: string; current?: string; onChosen: () => void; onLogout: () => void }) {
  const placeholder = MISSIONS.some((m) => m.placeholder)
  return (
    <main className="mx-auto flex min-h-screen max-w-[1100px] flex-col gap-8 px-4 py-8 md:px-8 md:py-12">
      <header className="flex items-center justify-between gap-4">
        <span className="font-display text-xl font-black tracking-[0.05em] text-ink uppercase">Health7</span>
        <button
          type="button"
          onClick={onLogout}
          className="inline-flex h-10 items-center gap-1.5 rounded-full px-3 text-sm font-semibold text-ink-soft hover:bg-surface-1 hover:text-ink"
        >
          <LogOut className="size-4" aria-hidden /> Log out
        </button>
      </header>

      <div className="grid gap-2">
        <p className="text-ink-soft">{name}</p>
        <h1 className="font-display text-3xl font-semibold md:text-4xl">Choose your mission</h1>
        <p className="max-w-2xl text-ink-soft">The app follows you through the whole mission. Each destination changes how far help is and what to watch.</p>
      </div>

      <ul className="grid gap-4 md:grid-cols-3">
        {MISSIONS.map((m) => (
          <MissionCard
            key={m.id}
            mission={m}
            current={m.id === current}
            onChoose={() => {
              setMission(crewId, m.id)
              onChosen()
            }}
          />
        ))}
      </ul>

      {placeholder && (
        <p className="text-sm text-ink-soft">
          <span className="mr-2 inline-flex rounded-full border border-dashed border-ink-soft/60 px-2 py-0.5 text-xs font-semibold">Placeholder</span>
          Mission profiles are provisional. Real mission data will replace them.
        </p>
      )}
    </main>
  )
}
