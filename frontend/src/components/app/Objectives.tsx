import { useState, type ReactNode } from 'react'
import { BadgeCheck, Check, Crosshair, Eye, GlassWater, Radio, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { getActiveCrewId } from '@/lib/active-profile'
import { GAME } from '@/lib/game'
import type { RoadmapStep } from '@/lib/roadmap'
import { cn } from '@/lib/utils'
import { addWater } from '@/lib/water'
import { Panel } from './Panel'

/*
  Objetivos de hoje na Prevention: os passos "do" do roteiro viram objetivos com recompensa à vista,
  como um painel de operações, não um jogo infantil. O que puxa a pessoa:
  - a recompensa antes de agir (+15 em cada objetivo) e o quanto ainda dá para ganhar;
  - uma barra de segmentos que enche, e um retorno curto ao marcar (marca, "+15" subindo);
  - fechar o dia ("Objectives clear") com o porquê: o check-up de amanhã mostra se mexeu nos números.
  Os pontos premiam o que a pessoa FAZ, nunca o valor medido (mesma regra do resto do jogo).
  Passos "watch" e "ground" não são objetivos: ficam embaixo, como avisos, sem ponto.
*/

const STEP = GAME.points.preventionStep
const CAP = GAME.points.preventionStepsPerDay

function Objective({ step, done, reward, onToggle }: { step: RoadmapStep; done: boolean; reward: number; onToggle: () => void }) {
  // Chave da animação: muda a cada marcação, para o "+15" subir de novo.
  const [burst, setBurst] = useState(0)
  return (
    <li className="grid gap-2">
      <button
        type="button"
        role="checkbox"
        aria-checked={done}
        aria-label={`${step.text}${reward ? `, ${reward} points` : ''}`}
        onClick={() => {
          if (!done) {
            setBurst((b) => b + 1)
            try { navigator.vibrate?.(12) } catch { /* sem vibração */ }
          }
          onToggle()
        }}
        className={cn(
          'group flex w-full items-center gap-3.5 rounded-xl border px-4 py-3.5 text-left transition-colors',
          done ? 'border-sa-rocket-600/50 bg-sa-rocket-600/10' : 'border-hairline-strong bg-surface-2/50 hover:border-sa-rocket hover:bg-surface-2',
        )}
      >
        <span
          aria-hidden
          className={cn(
            'grid size-8 shrink-0 place-items-center rounded-full border-2 transition-colors',
            done ? 'border-transparent bg-sa-rocket-600 text-white motion-safe:animate-check-pop' : 'border-hairline-strong text-transparent group-hover:border-sa-rocket',
          )}
        >
          <Check className="size-4.5" strokeWidth={3} />
        </span>
        <span className={cn('min-w-0 flex-1 text-[15px] leading-snug', done ? 'text-ink-soft' : 'text-ink')}>{step.text}</span>
        {reward > 0 && (
          <span aria-hidden className="relative shrink-0">
            <span
              className={cn(
                'inline-flex h-7 items-center rounded-full px-2.5 font-mono text-[13px] font-semibold transition-colors',
                done ? 'bg-sa-yellow text-sa-deep' : 'border border-sa-yellow/50 text-sa-yellow',
              )}
            >
              +{reward}
            </span>
            {done && burst > 0 && (
              <span key={burst} className="pointer-events-none absolute inset-x-0 -top-1 text-center font-mono text-[13px] font-bold text-sa-yellow opacity-0 motion-safe:animate-points-rise">
                +{reward}
              </span>
            )}
          </span>
        )}
      </button>
      {step.action === 'water' && !done && (
        <button
          type="button"
          onClick={() => {
            const owner = getActiveCrewId()
            if (!owner) return
            try { addWater(owner, 1); toast.success('Water serving logged') } catch (error) { toast.error((error as Error).message) }
          }}
          className="ml-[3.4rem] inline-flex h-8 items-center gap-1.5 justify-self-start rounded-[4px] bg-sa-yellow px-3 text-xs font-bold text-sa-deep hover:brightness-105"
        >
          <GlassWater className="size-3.5" aria-hidden />
          Log a water serving
        </button>
      )}
    </li>
  )
}

export function Objectives({
  steps,
  done,
  onToggle,
  earned,
  rewrite,
  footer,
}: {
  /** Passos de hoje (no máximo três na tela enxuta). */
  steps: RoadmapStep[]
  done: string[]
  onToggle: (id: string) => void
  /** Pontos de prevenção já ganhos hoje (do jogo). */
  earned: number
  /** Reescrever com IA, quando há servidor. */
  rewrite?: { loading: boolean; onClick: () => void }
  footer?: ReactNode
}) {
  const objectives = steps.filter((s) => s.kind === 'do')
  const notes = steps.filter((s) => s.kind !== 'do')
  const doneCount = objectives.filter((s) => done.includes(s.id)).length
  const total = objectives.length
  const clear = total > 0 && doneCount === total
  // Só os primeiros CAP objetivos do dia rendem ponto; a recompensa à vista já respeita o teto.
  const available = Math.min(total, CAP) * STEP
  const left = Math.max(0, available - earned)

  return (
    <Panel aria-labelledby="today-title" className="gap-4 md:p-6">
      <header className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span aria-hidden className="grid size-9 shrink-0 place-items-center rounded-lg bg-sa-rocket-600 text-white [&_svg]:size-5">
            <Crosshair />
          </span>
          <div className="min-w-0">
            <h2 id="today-title" className="font-display text-lg leading-tight font-semibold text-ink">
              Today&apos;s objectives
            </h2>
            <p className="mt-0.5 text-sm text-ink-soft">
              {total === 0 ? 'Nothing extra today.' : clear ? 'All clear for today.' : `Each one targets what drifted. ${left > 0 ? `+${left} pts still on the table.` : ''}`}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {total > 0 && (
            <span className="font-mono text-lg font-semibold text-ink">
              {doneCount}
              <span className="text-ink-soft">/{total}</span>
              <span className="sr-only"> objectives done</span>
            </span>
          )}
          {rewrite && (
            <Button variant="ghost" size="sm" onClick={rewrite.onClick} disabled={rewrite.loading} className="text-interactive" title="Rewrite with AI">
              <RefreshCw className={cn('size-4', rewrite.loading && 'animate-spin')} aria-hidden />
              <span className="sr-only">Rewrite with AI</span>
            </Button>
          )}
        </div>
      </header>

      {total > 0 && (
        <div aria-hidden className="grid h-2 gap-1" style={{ gridTemplateColumns: `repeat(${total}, minmax(0, 1fr))` }}>
          {objectives.map((s) => (
            <span key={s.id} className="overflow-hidden rounded-full bg-surface-3">
              <span className={cn('block h-full rounded-full bg-sa-rocket transition-[width] duration-500 ease-out motion-reduce:transition-none', done.includes(s.id) ? 'w-full' : 'w-0')} />
            </span>
          ))}
        </div>
      )}

      {total > 0 ? (
        <ul className="grid gap-2.5">
          {objectives.map((s, i) => (
            <Objective key={s.id} step={s} done={done.includes(s.id)} reward={i < CAP ? STEP : 0} onToggle={() => onToggle(s.id)} />
          ))}
        </ul>
      ) : (
        <p className="text-ink-soft">Keep the routine. Your check-up is today&apos;s objective.</p>
      )}

      <p role="status" className="sr-only">
        {total > 0 ? `${doneCount} of ${total} objectives done, ${earned} points` : ''}
      </p>

      {clear && (
        <div className="flex items-center gap-3 rounded-xl border border-sa-yonder/40 bg-sa-yonder/10 px-4 py-3 motion-safe:animate-clear-in">
          <BadgeCheck className="size-7 shrink-0 text-sa-yonder" aria-hidden />
          <p className="text-[15px] text-ink">
            <span className="font-semibold">Objectives clear. +{earned} pts earned.</span>{' '}
            <span className="text-ink-soft">Tomorrow&apos;s check-up shows whether it moved your numbers.</span>
          </p>
        </div>
      )}

      {notes.length > 0 && (
        <ul className="grid gap-2 border-t border-hairline pt-3">
          {notes.map((s) => (
            <li key={s.id} className="flex items-start gap-2.5 text-[15px] text-ink">
              {s.kind === 'watch' ? (
                <Eye className="mt-0.5 size-4 shrink-0 text-sa-yellow" aria-hidden />
              ) : (
                <Radio className="mt-0.5 size-4 shrink-0 text-flag-ink" aria-hidden />
              )}
              <span>
                <span className={cn('mr-1.5 font-bold', s.kind === 'watch' ? 'text-sa-yellow' : 'text-flag-ink')}>{s.kind === 'watch' ? 'Watch:' : 'Tell ground:'}</span>
                {s.text}
              </span>
            </li>
          ))}
        </ul>
      )}

      {footer}
    </Panel>
  )
}
