import { forwardRef } from 'react'
import { ArrowRight, CircleCheck, CircleDashed, Crosshair, Droplet, ListChecks, Minus, Plus, Route } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { GAME, MAX_DAY_POINTS, type DayPoints } from '@/lib/game'
import type { PlanView } from '@/lib/plans'
import { href } from '@/lib/route'
import { WATER_GOAL, WATER_SERVING_ML } from '@/lib/water'
import { cn } from '@/lib/utils'
import { Dotted } from './Dot'
import { Ring } from './GameBits'
import { Panel, PanelHeader } from './Panel'

/*
  Today's routine (plano v2, 7.6): as três tarefas do dia com estado e pontos, o registro de água
  e o total de hoje num anel. Pontos premiam o que a pessoa faz, nunca o valor medido.
*/

function Task({ done, label, points }: { done: boolean; label: string; points: number }) {
  return (
    <li className="flex items-center gap-2.5">
      {done ? (
        <CircleCheck className="size-4.5 shrink-0 text-interactive" aria-hidden />
      ) : (
        <CircleDashed className="size-4.5 shrink-0 text-ink-soft" aria-hidden />
      )}
      <span className="min-w-0 flex-1 text-[15px] text-ink">
        {label}
        <span className="sr-only">{done ? ', done' : ', pending'}</span>
      </span>
      <span className={cn('font-mono text-sm', done ? 'text-ink' : 'text-ink-soft')}>+{points}</span>
    </li>
  )
}

export const RoutineCard = forwardRef<
  HTMLButtonElement,
  { today: DayPoints; plan?: PlanView | null; onWater: (delta: number) => void; className?: string }
>(function RoutineCard({ today, plan, onWater, className }, addRef) {
  const water = today.water
  const waterDone = water >= WATER_GOAL
  const bonusText = [
    today.points.bonus > 0 ? `Full routine +${today.points.bonus}` : null,
    today.points.streak > 0 ? `Streak ${today.streak} ${today.streak === 1 ? 'day' : 'days'} +${today.points.streak}` : null,
  ].filter(Boolean)

  return (
    <Panel id="routine" aria-labelledby="routine-title" className={cn('gap-3', className)}>
      <PanelHeader
        id="routine-title"
        icon={<ListChecks />}
        tone="yellow"
        title="Today's routine"
        aside={<Ring value={today.routineTotal} max={MAX_DAY_POINTS} label={`${today.routineTotal} of ${MAX_DAY_POINTS} routine points today`} />}
      />
      <ul className="grid gap-2">
        <Task done={today.healthDone} label="Health check-up" points={GAME.points.healthCheckUp} />
        <Task done={today.behavioralDone} label="Behavioral check-in" points={GAME.points.behavioralCheckIn} />
      </ul>

      <div className="rounded-lg bg-surface-2/60 p-3">
        <div className="flex items-center gap-2.5">
          <Droplet className={cn('size-4.5 shrink-0', waterDone ? 'text-interactive' : 'text-ink-soft')} aria-hidden />
          <span className="flex-1 text-[15px]">Water</span>
          <span className="font-mono text-sm" aria-live="polite">
            <span className="text-ink">{water}</span>
            <span className="text-ink-soft"> of {WATER_GOAL}</span>
          </span>
        </div>
        <div
          className="mt-2 grid gap-1"
          style={{ gridTemplateColumns: `repeat(${WATER_GOAL}, minmax(0, 1fr))` }}
          aria-hidden
        >
          {Array.from({ length: WATER_GOAL }, (_, i) => (
            <span key={i} className={cn('h-1.5 rounded-full', i < water ? 'bg-sa-yonder' : 'bg-surface-3')} />
          ))}
        </div>
        <div className="mt-2 flex items-center gap-2">
          <Button ref={addRef} variant="secondary" size="sm" onClick={() => onWater(1)}>
            <Plus aria-hidden />
            {WATER_SERVING_ML} ml
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => onWater(-1)}
            disabled={water === 0}
            aria-label="Undo last water serving"
          >
            <Minus aria-hidden />
          </Button>
          <span className="ml-auto text-xs text-ink-soft" title="Demonstration goal, no clinical source">Demo goal</span>
        </div>
      </div>
      {plan?.today && (
        <a
          href={href('/prevention')}
          className="flex items-center gap-2.5 rounded-lg border border-hairline-strong px-3 py-2 text-[15px] text-ink no-underline hover:bg-surface-2"
        >
          <Route className="size-4.5 shrink-0 text-interactive" aria-hidden />
          <span className="flex-1">
            <Dotted text={`Plan · day ${plan.dayNumber} of ${plan.plan.days} · ${plan.today.doneCount} of ${plan.today.steps.length} steps`} />
          </span>
          {today.points.plan > 0 && <span className="font-mono text-sm">+{today.points.plan}</span>}
          <ArrowRight className="size-4 text-ink-soft" aria-hidden />
        </a>
      )}
      {!plan?.today && (
        <a
          href={href('/prevention')}
          className="flex items-center gap-2.5 rounded-lg border border-hairline-strong px-3 py-2 text-[15px] text-ink no-underline hover:bg-surface-2"
        >
          <Crosshair className="size-4.5 shrink-0 text-interactive" aria-hidden />
          <span className="flex-1">Prevention objectives</span>
          <span className={cn('font-mono text-sm', today.points.prevention > 0 ? 'text-ink' : 'text-ink-soft')}>
            {today.points.prevention > 0
              ? `+${today.points.prevention}`
              : `up to +${GAME.points.preventionStep * GAME.points.preventionStepsPerDay}`}
          </span>
          <ArrowRight className="size-4 text-ink-soft" aria-hidden />
        </a>
      )}
      {(today.points.bonus > 0 || today.points.streak > 0) && (
        <p className="text-xs text-ink-soft">
          <Dotted text={bonusText.join(' · ')} />
        </p>
      )}
    </Panel>
  )
})
