import { ArrowRight, Check, CircleCheck, CircleDashed, Flag, Route } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { GAME } from '@/lib/game'
import { OUTCOME_TEXT, startPlan, SUGGESTED, toggleStep, type PlanOutcome, type PlanView } from '@/lib/plans'
import type { PatternResult } from '@/lib/prevention'
import { href } from '@/lib/route'
import { cn, utcDay } from '@/lib/utils'
import { Dot, Dotted } from './Dot'

/*
  Back-to-baseline plan (plano v3, seções 5 e 6, item 2). Só ações de rotina, sugerido, revisado pelo solo.
  Pontos por cumprir o passo, nunca pela medida melhorar.
*/

const P = GAME.points


function Shell({ children, title = 'Back-to-baseline plan' }: { children: React.ReactNode; title?: string }) {
  return (
    <section aria-labelledby="plan-title" className="flex min-w-0 flex-col gap-4 rounded-xl border border-hairline bg-surface-1 p-5 md:p-6">
      <header className="flex items-start gap-3">
        <span aria-hidden className="grid size-9 shrink-0 place-items-center rounded-lg bg-surface-2 text-interactive">
          <Route className="size-5" />
        </span>
        <div className="min-w-0">
          <h2 id="plan-title" className="font-display text-lg leading-tight font-semibold">
            {title}
          </h2>
          <p className="mt-1 text-xs font-semibold text-ink-soft">
            <Dotted text={SUGGESTED} />
          </p>
        </div>
      </header>
      {children}
    </section>
  )
}

function PointsRule() {
  return (
    <p className="text-sm text-ink-soft">
      <span className="font-mono text-ink">+{P.planStep}</span> per step you mark,{' '}
      <span className="font-mono text-ink">+{P.planDayComplete}</span> when a day is complete,{' '}
      <span className="font-mono text-ink">+{P.planCompleted}</span> when you finish. Points are for the steps, not for the
      measures.
    </p>
  )
}

/** Plano sugerido para um padrão ativo (ainda não iniciado). */
export function PlanSuggestion({ pattern, blockedBy }: { pattern: PatternResult; blockedBy?: string }) {
  const plan = pattern.def.plan
  if (!plan) {
    return (
      <Shell title="No self-care plan">
        <p className="flex items-start gap-2 text-ink">
          <Flag className="mt-1 size-4 shrink-0 text-flag-ink" aria-hidden />
          No self-care plan for this pattern. It is flagged for your flight surgeon.
        </p>
      </Shell>
    )
  }
  return (
    <Shell>
      <p className="text-ink">
        <span className="font-mono">{plan.days}</span> days of routine steps for <span className="font-semibold">{pattern.def.title.toLowerCase()}</span>.
      </p>
      <ol className="grid gap-1.5">
        {plan.steps.map((s) => (
          <li key={s.id} className="flex items-center gap-2.5 text-[15px]">
            <CircleDashed className="size-4 shrink-0 text-ink-soft" aria-hidden />
            <span className="flex-1">{s.label}</span>
            <span className="text-xs text-ink-soft">{s.type === 'auto' ? 'Checked from your records' : 'You mark it'}</span>
          </li>
        ))}
      </ol>
      <PointsRule />
      <p className="text-xs text-ink-soft">{plan.stepsSource}</p>
      {blockedBy ? (
        <p className="text-sm text-ink-soft">Finish your {blockedBy.toLowerCase()} plan first. One plan at a time.</p>
      ) : (
        <Button className="self-start" onClick={() => startPlan(pattern.def.id)}>
          Start plan
        </Button>
      )}
    </Shell>
  )
}

/** Os dias do plano em linha: feito, hoje, por vir (ícone e palavra no leitor de tela). */
function DayStrip({ view }: { view: PlanView }) {
  return (
    <ol className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${view.days.length}, minmax(0, 1fr))` }} aria-label="Plan days">
      {view.days.map((d) => {
        const word = d.state === 'today' ? (d.complete ? 'today, complete' : 'today') : d.state === 'done' ? 'complete' : d.state === 'missed' ? 'not complete' : 'upcoming'
        return (
          <li
            key={d.day}
            className={cn(
              'flex flex-col items-center gap-1 rounded-lg border px-1 py-2',
              d.state === 'today' ? 'border-ink bg-surface-2' : 'border-hairline',
              d.state === 'upcoming' && 'opacity-60',
            )}
          >
            <span className="text-[11px] font-semibold tracking-wide text-ink-soft uppercase">Day {d.index}</span>
            {d.complete ? (
              <CircleCheck className="size-5 text-interactive" aria-hidden />
            ) : (
              <CircleDashed className="size-5 text-ink-soft" aria-hidden />
            )}
            <span className="sr-only">{word}</span>
            <span className="font-mono text-[11px] text-ink-soft">{utcDay(`${d.day}T00:00:00Z`)}</span>
          </li>
        )
      })}
    </ol>
  )
}

/** Link para fazer o passo automático, quando ainda falta. */
function autoLink(rule?: string) {
  if (rule === 'bothCheckUps') return { href: href('/'), label: 'Check-ups on Home' }
  if (rule === 'waterGoal') return { href: href('/'), label: 'Log water on Home' }
  return null
}

/** Plano em andamento: dia N de 5, passos de hoje, pontos de hoje. */
export function PlanActive({ view, todayPoints, onEnd }: { view: PlanView; todayPoints: number; onEnd: () => void }) {
  const today = view.today
  return (
    <Shell>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="font-display text-2xl font-semibold">
          Day <span className="font-mono">{view.dayNumber}</span> of <span className="font-mono">{view.plan.days}</span>
        </p>
        <p className="text-sm text-ink-soft">
          {view.pattern.title}
          <Dot />
          plan <span className="font-mono text-ink">+{todayPoints}</span> today
        </p>
      </div>
      <DayStrip view={view} />
      {today && (
        <div className="grid gap-2">
          <p className="text-sm font-semibold text-ink-soft">
            Today
            <Dot />
            <span className="font-mono text-ink">{today.doneCount}</span> of <span className="font-mono">{today.steps.length}</span> steps
          </p>
          <ul className="grid gap-2">
            {today.steps.map(({ def, done }) =>
              def.type === 'manual' ? (
                <li key={def.id}>
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={done}
                    onClick={() => toggleStep(view.plan.id, def.id)}
                    className={cn(
                      'flex min-h-12 w-full items-center gap-3 rounded-lg border px-3 text-left transition-colors',
                      done ? 'border-interactive/60 bg-surface-2' : 'border-hairline-strong hover:bg-surface-2',
                    )}
                  >
                    <span
                      aria-hidden
                      className={cn(
                        'grid size-6 shrink-0 place-items-center rounded-md border-2',
                        done ? 'border-interactive bg-interactive text-ground' : 'border-ink-soft',
                      )}
                    >
                      {done && <Check className="size-4" strokeWidth={3} />}
                    </span>
                    <span className="flex-1 text-[15px]">{def.label}</span>
                    <span className={cn('font-mono text-sm', done ? 'text-ink' : 'text-ink-soft')}>+{P.planStep}</span>
                  </button>
                </li>
              ) : (
                <li key={def.id} className="flex min-h-12 items-center gap-3 rounded-lg bg-surface-2/50 px-3">
                  {done ? <CircleCheck className="size-6 text-interactive" aria-hidden /> : <CircleDashed className="size-6 text-ink-soft" aria-hidden />}
                  <span className="flex-1 text-[15px]">
                    {def.label}
                    <span className="sr-only">{done ? ', done' : ', not done yet'}</span>
                    <span className="block text-xs text-ink-soft">Checked from your records</span>
                  </span>
                  {!done && autoLink(def.rule) && (
                    <a href={autoLink(def.rule)!.href} className="inline-flex items-center gap-1 text-sm font-semibold text-interactive underline underline-offset-3">
                      {autoLink(def.rule)!.label}
                      <ArrowRight className="size-3.5" aria-hidden />
                    </a>
                  )}
                </li>
              ),
            )}
          </ul>
          {today.complete && <p className="text-sm text-ink">Today is complete. +{P.planDayComplete} bonus.</p>}
        </div>
      )}
      <PointsRule />
      <Button variant="ghost" size="sm" className="self-start text-ink-soft" onClick={onEnd}>
        End plan
      </Button>
    </Shell>
  )
}

/** Plano que acabou de fechar: resultado e caminho para o relatório. */
export function PlanFinished({ view, outcome, onOpenReport }: { view: PlanView; outcome: PlanOutcome; onOpenReport: () => void }) {
  const good = outcome === 'back-to-baseline'
  return (
    <Shell>
      <p className="flex items-start gap-2 text-lg text-ink">
        {good ? <CircleCheck className="mt-1 size-5 shrink-0 text-interactive" aria-hidden /> : <Flag className="mt-1 size-5 shrink-0 text-flag-ink" aria-hidden />}
        {OUTCOME_TEXT[outcome]}
      </p>
      <DayStrip view={view} />
      <Button variant="secondary" className="self-start" onClick={onOpenReport}>
        Open report for ground
      </Button>
    </Shell>
  )
}
