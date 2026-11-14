import { forwardRef } from 'react'
import { CircleCheck, CircleDashed, Droplet, ListChecks, Minus, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { WATER_GOAL, WATER_SERVING_ML } from '@/lib/water'
import { cn } from '@/lib/utils'
import { Panel, PanelHeader } from './Panel'

/*
  Today's routine (plano v2, 7.6). Fase 2: tarefas e registro de água.
  Pontos, anel de progresso e rank entram na fase 4.
*/

function Task({ done, label, detail }: { done: boolean; label: string; detail: string }) {
  return (
    <li className="flex items-center gap-2.5">
      {done ? (
        <CircleCheck className="size-4.5 shrink-0 text-interactive" aria-hidden />
      ) : (
        <CircleDashed className="size-4.5 shrink-0 text-ink-soft" aria-hidden />
      )}
      <span className="min-w-0 flex-1 text-[15px] text-ink">{label}</span>
      <span className="text-sm text-ink-soft">{detail}</span>
    </li>
  )
}

export const RoutineCard = forwardRef<
  HTMLButtonElement,
  {
    healthDone: boolean
    behavioralDone: boolean
    water: number
    onWater: (delta: number) => void
    className?: string
  }
>(function RoutineCard({ healthDone, behavioralDone, water, onWater, className }, addRef) {
  const waterDone = water >= WATER_GOAL
  const done = [healthDone, behavioralDone, waterDone].filter(Boolean).length

  return (
    <Panel id="routine" aria-labelledby="routine-title" className={cn('gap-3', className)}>
      <PanelHeader
        id="routine-title"
        icon={<ListChecks />}
        title="Today's routine"
        aside={
          <span className="font-mono text-sm text-ink-soft">
            <span className="text-ink">{done}</span> of 3 done
          </span>
        }
      />
      <ul className="grid gap-2">
        <Task done={healthDone} label="Health check-up" detail={healthDone ? 'Done' : 'Pending'} />
        <Task done={behavioralDone} label="Behavioral check-in" detail={behavioralDone ? 'Done' : 'Pending'} />
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
        {/* Uma marca por porção da meta */}
        <div
          className="mt-2 grid gap-1"
          style={{ gridTemplateColumns: `repeat(${WATER_GOAL}, minmax(0, 1fr))` }}
          aria-hidden
        >
          {Array.from({ length: WATER_GOAL }, (_, i) => (
            <span key={i} className={cn('h-1.5 rounded-full', i < water ? 'bg-interactive' : 'bg-surface-3')} />
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
          <span className="ml-auto text-right text-xs leading-tight text-ink-soft">
            Demonstration
            <br />
            goal
          </span>
        </div>
      </div>
    </Panel>
  )
})
