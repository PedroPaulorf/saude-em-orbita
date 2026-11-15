import { ExternalLink, Radiation } from 'lucide-react'
import hrp from '@/data/hrp-risks.json'
import { radiationSummary } from '@/lib/radiation'
import { cn, utcDay } from '@/lib/utils'
import { Dot } from './Dot'
import { NasaAdvice } from './NasaAdvice'

const RISK = hrp.risks.find((r) => r.id === 'radiation-induced-cancers')

/**
 * Exposição à radiação na missão (plano v3, seção 7): dose medida (simulada) e um limite com fonte.
 * Não soma dose a partir do DONKI, não estima risco e não diz o que vestir nem onde se abrigar.
 */
export function RadiationCard({ sepDay, className }: { sepDay?: string; className?: string }) {
  const r = radiationSummary()
  const max = Math.max(...r.daily.map((d) => d.dose))
  const pct = Math.round(r.limitFraction * 100)
  return (
    <section
      id="radiation"
      aria-labelledby="radiation-title"
      className={cn('flex min-w-0 scroll-mt-20 flex-col gap-4 rounded-xl border border-hairline bg-surface-1 p-5 md:p-6', className)}
    >
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span aria-hidden className="grid size-9 shrink-0 place-items-center rounded-lg bg-surface-2 text-interactive">
            <Radiation className="size-5" />
          </span>
          <div>
            <h2 id="radiation-title" className="font-display text-lg leading-tight font-semibold">
              Mission exposure
            </h2>
            <p className="mt-1 text-sm text-ink-soft">What can&apos;t be seen in daily measures: the radiation dose you received.</p>
          </div>
        </div>
        <span className="inline-flex h-6 items-center rounded-full border border-dashed border-ink-soft/60 px-2.5 text-xs font-semibold text-ink-soft">
          {r.source}
        </span>
      </header>

      <p className="flex flex-wrap items-baseline gap-x-2">
        <span className="font-mono text-[40px] leading-none text-ink">{r.missionTotal.toFixed(1)}</span>
        <span className="font-mono text-ink-soft">{r.unit}</span>
        <span className="text-sm text-ink-soft">
          <Dot />
          Day <span className="font-mono text-ink">{r.missionDay}</span> of the mission
        </span>
      </p>

      {/* Últimos 7 dias */}
      <figure className="grid gap-1.5">
        <figcaption className="text-sm text-ink-soft">
          Last 7 days
          <Dot />
          <span className="font-mono text-ink">{r.weekTotal.toFixed(1)}</span> {r.unit}
        </figcaption>
        <ol className="grid h-24 grid-cols-7 items-end gap-1.5" aria-label={`Daily dose, last ${r.daily.length} days`}>
          {r.daily.map((d, i) => (
            <li key={d.day} className="flex h-full flex-col items-center justify-end gap-1">
              <span className="font-mono text-[11px] text-ink-soft">{d.dose.toFixed(2)}</span>
              <span
                className={cn('w-full rounded-t-sm', i === r.daily.length - 1 ? 'bg-interactive' : 'bg-interactive/45')}
                style={{ height: `${(d.dose / max) * 60}%` }}
                aria-hidden
              />
              <span className="sr-only">
                {utcDay(`${d.day}T00:00:00Z`)}: {d.dose} {r.unit}
              </span>
            </li>
          ))}
        </ol>
        <div className="grid grid-cols-7 gap-1.5 font-mono text-[10px] text-ink-soft" aria-hidden>
          {r.daily.map((d) => (
            <span key={d.day} className="text-center">
              {utcDay(`${d.day}T00:00:00Z`).slice(0, 2)}
            </span>
          ))}
        </div>
      </figure>

      {/* Limite de carreira */}
      <div className="grid gap-1.5">
        <div className="h-2 overflow-hidden rounded-full bg-surface-3" role="img" aria-label={`${pct}% of the ${r.careerLimit} ${r.unit} NASA career limit`}>
          <div className="h-full rounded-full bg-interactive" style={{ width: `${Math.max(1, r.limitFraction * 100)}%` }} />
        </div>
        <p className="text-sm text-ink">
          <span className="font-mono">{pct}%</span> of the <span className="font-mono">{r.careerLimit}</span> {r.unit} NASA career limit.{' '}
          <span className="text-ink-soft">This mission only. Earlier missions not included.</span>
        </p>
        <a
          href={r.limitSource.url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 self-start text-sm text-interactive underline underline-offset-3"
        >
          Source: {r.limitSource.label}
          <ExternalLink className="size-3.5" aria-hidden />
        </a>
      </div>

      {sepDay && (
        <p className="rounded-lg bg-surface-2 px-3 py-2 text-sm text-ink">
          Solar particle event on {sepDay}. Dose during an event is measured on board; this demo does not model it.
        </p>
      )}

      {RISK && <NasaAdvice risk={RISK} />}
    </section>
  )
}
