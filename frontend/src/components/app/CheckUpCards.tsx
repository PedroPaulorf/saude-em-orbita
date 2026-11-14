import { CircleCheck, CircleDashed, HeartPulse, Smile } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { behavioralQuestions } from '@/lib/health'
import { href } from '@/lib/route'
import { utcTime } from '@/lib/utils'
import type { Status, Vital } from '@/types'
import { Dot } from './Dot'
import { Panel, PanelHeader } from './Panel'
import { StatusBadge } from './StatusBadge'

/** "Done today · 09:42 UTC" ou "Pending today", sempre com ícone e palavra. */
function TodayState({ doneAt }: { doneAt?: string }) {
  return doneAt ? (
    <span className="inline-flex items-center gap-1.5 text-ink-soft">
      <CircleCheck className="size-4 text-interactive" aria-hidden />
      Done today
      <Dot className="mx-1.5" />
      <span className="font-mono">{utcTime(doneAt)}</span>
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 text-ink-soft">
      <CircleDashed className="size-4" aria-hidden />
      Pending today
    </span>
  )
}

/** Start (amarelo só quando é a ação principal da tela) ou Redo, secundário. */
function StartButton({ done, primary, to, label }: { done: boolean; primary: boolean; to: string; label: string }) {
  return (
    <Button asChild variant={done ? 'secondary' : primary ? 'default' : 'outline'} className="self-start no-underline">
      <a href={to} aria-label={`${done ? 'Redo' : 'Start'} ${label}`}>
        {done ? 'Redo' : 'Start'}
      </a>
    </Button>
  )
}

const SEVERITY: Record<Status, number> = { flagged: 0, attention: 1, baseline: 2 }

export function HealthCheckUpCard({
  vitals,
  doneAt,
  primary,
  className,
}: {
  vitals: Vital[]
  doneAt?: string
  /** É o primeiro check-up pendente: leva o amarelo. */
  primary: boolean
  className?: string
}) {
  // As medidas fora da linha de base aparecem primeiro.
  const lines = [...vitals].sort((a, b) => SEVERITY[a.status] - SEVERITY[b.status]).slice(0, 3)
  return (
    <Panel aria-labelledby="health-checkup" className={className}>
      <PanelHeader
        id="health-checkup"
        icon={<HeartPulse />}
        title="Health check-up"
        subtitle={<TodayState doneAt={doneAt} />}
      />
      <ul className="grid" aria-label={doneAt ? "Today's values" : 'Latest values'}>
        {lines.map((v) => (
          <li key={v.id} className="flex items-center justify-between gap-3 border-t border-hairline py-1.5 first:border-t-0">
            <span className="min-w-0">
              <span className="block text-sm text-ink-soft">{v.label}</span>
              <span className="font-mono text-[17px] leading-tight text-ink">
                {v.value}
                <span className="ml-1 text-[13px] text-ink-soft">{v.unit}</span>
              </span>
            </span>
            <StatusBadge status={v.status} />
          </li>
        ))}
      </ul>
      <div className="mt-auto">
        <StartButton done={!!doneAt} primary={primary} to={href('/check/health')} label="health check-up" />
      </div>
    </Panel>
  )
}

export function BehavioralCheckInCard({
  answers,
  doneAt,
  primary,
  className,
}: {
  /** Últimas respostas, de 1 a 5, por id de pergunta. */
  answers?: Record<string, number>
  doneAt?: string
  primary: boolean
  className?: string
}) {
  const LABELS: Record<string, string> = { mood: 'Mood', stress: 'Stress', rest: 'Rest' }
  return (
    <Panel aria-labelledby="behavioral-checkin" className={className}>
      <PanelHeader
        id="behavioral-checkin"
        icon={<Smile />}
        title="Behavioral check-in"
        subtitle={<TodayState doneAt={doneAt} />}
      />
      <ul className="grid" aria-label="Latest answers">
        {behavioralQuestions.map((q) => {
          const v = answers?.[q.id]
          return (
            <li key={q.id} className="flex items-center justify-between gap-3 border-t border-hairline py-1.5 first:border-t-0">
              <span className="text-sm text-ink-soft">{LABELS[q.id] ?? q.id}</span>
              <span className="text-right">
                {v != null ? (
                  <>
                    <span className="font-mono text-[17px] text-ink">{v}</span>
                    <span className="font-mono text-[13px] text-ink-soft"> / 5</span>
                    {/* Só repete a palavra da escala nas pontas; não interpreta os valores do meio. */}
                    {(v === 1 || v === 5) && <span className="ml-2 text-xs text-ink-soft">{v === 1 ? q.low : q.high}</span>}
                  </>
                ) : (
                  <span className="text-sm text-ink-soft">No answer yet</span>
                )}
              </span>
            </li>
          )
        })}
      </ul>
      <p className="text-xs text-ink-soft">A self-report, not a diagnosis. It does not replace your psychologist.</p>
      <div className="mt-auto">
        <StartButton done={!!doneAt} primary={primary} to={href('/check/behavioral')} label="behavioral check-in" />
      </div>
    </Panel>
  )
}
