import { ArrowRight, CircleCheckBig, CircleHelp, CircleMinus } from 'lucide-react'
import hrp from '@/data/hrp-risks.json'
import { VITAL_REGION } from '@/lib/notes'
import type { PatternResult, SignResult } from '@/lib/prevention'
import { href } from '@/lib/route'
import { cn } from '@/lib/utils'
import { Clamped } from './Clamped'
import { Dot } from './Dot'
import { DemoTag } from './SourceTag'
import { StatusBadge } from './StatusBadge'

const RISKS = new Map(hrp.risks.map((r) => [r.id, r]))

/** Para onde o sinal leva: a região no Detailed stats, o check-in de hoje ou o registro de água. */
function signLink(s: SignResult): { href: string; label: string } | null {
  if (s.def.type === 'measure' && s.measure) return { href: href('/stats', { region: VITAL_REGION[s.measure] }), label: 'See in Detailed stats' }
  if (s.state === 'unknown' && s.def.type === 'selfReport') return { href: href('/check/behavioral'), label: "Do today's behavioral check-in" }
  if (s.state === 'unknown' && s.def.type === 'water') return { href: href('/'), label: 'Log water on Home' }
  return null
}

const STATE = {
  present: { Icon: CircleCheckBig, word: 'Present', cls: 'text-ink' },
  absent: { Icon: CircleMinus, word: 'Not present', cls: 'text-ink-soft' },
  unknown: { Icon: CircleHelp, word: 'No data today', cls: 'text-ink-soft' },
} as const

function Sign({ s }: { s: SignResult }) {
  const { Icon, word, cls } = STATE[s.state]
  const link = signLink(s)
  return (
    <li className={cn('grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 rounded-lg px-3 py-2.5', s.state === 'present' ? 'bg-surface-2/70' : 'border border-hairline')}>
      <Icon
        className={cn('mt-0.5 size-4.5', s.state === 'present' ? (s.status === 'flagged' ? 'text-flag-ink' : 'text-brand') : 'text-ink-soft')}
        aria-hidden
      />
      <div className="min-w-0">
        <p className={cn('text-[15px] leading-snug', cls)}>
          <span className="sr-only">{word}: </span>
          {s.def.label}
        </p>
        <p className="mt-0.5 font-mono text-[13px] text-ink-soft">
          <span className={cn('font-sans font-semibold', s.state === 'present' ? 'text-ink' : '')}>{word}</span>
          {s.detail && s.state !== 'unknown' && <> · {s.detail}</>}
        </p>
        {link && (
          <a href={link.href} className="mt-1 inline-flex items-center gap-1 text-sm font-semibold text-interactive underline underline-offset-3">
            {link.label}
            <ArrowRight className="size-3.5" aria-hidden />
          </a>
        )}
      </div>
    </li>
  )
}

/** Cartão de um padrão ativo: estado, quantos sinais, a lista de sinais e o "What can be done" da NASA. */
export function PatternCard({ result, children }: { result: PatternResult; children?: React.ReactNode }) {
  const { def } = result
  const risk = RISKS.get(def.hrpRisk)
  return (
    <section aria-labelledby={`pattern-${def.id}`} className="flex min-w-0 flex-col gap-4 rounded-xl border border-hairline bg-surface-1 p-5 md:p-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold tracking-[0.08em] text-ink-soft uppercase">Early-sign pattern</p>
          <h2 id={`pattern-${def.id}`} className="mt-1 font-display text-2xl font-semibold">
            {def.title}
          </h2>
          <p className="mt-1 text-ink">
            <span className="font-mono text-xl">{result.present}</span>
            <span className="text-ink-soft"> of </span>
            <span className="font-mono text-xl">{result.total}</span> signs present
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <StatusBadge status={result.status} />
          <DemoTag />
        </div>
      </header>
      <p className="text-sm text-ink-soft">
        {def.summary} This is not a diagnosis. The pattern goes to your flight surgeon with your report.
      </p>
      <ul className="grid gap-2" aria-label="Signs">
        {result.signs.map((s) => (
          <Sign key={s.def.id} s={s} />
        ))}
      </ul>
      {children}
      {risk && (
        <div className="grid gap-1 border-t border-hairline pt-4">
          <p className="text-sm font-semibold text-ink-soft">
            What can be done
            <Dot />
            NASA Human Research Program
          </p>
          <Clamped text={risk.whatCanBeDone} lines={3} />
          <a href={risk.url} target="_blank" rel="noreferrer" className="self-start text-sm text-interactive underline underline-offset-3">
            Source: {risk.title}
          </a>
        </div>
      )}
    </section>
  )
}
