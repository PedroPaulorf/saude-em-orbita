import { Brain, CircleCheck, CircleDashed, HeartPulse } from 'lucide-react'
import { compareReaction, useCognitive } from '@/lib/cognitive'
import { Button } from '@/components/ui/button'
import { behavioralQuestions } from '@/lib/health'
import { href } from '@/lib/route'
import { utcTime } from '@/lib/utils'
import type { Status, Vital } from '@/types'
import { Panel, PanelHeader } from './Panel'
import { StatusBadge } from './StatusBadge'

/** "Done today · 09:42 UTC" ou "Pending today", sempre com ícone e palavra. */
function TodayState({ doneAt }: { doneAt?: string }) {
  return doneAt ? (
    <span className="inline-flex items-center gap-1.5 text-ink-soft">
      <CircleCheck className="size-4 text-interactive" aria-hidden />
      Done <span className="font-mono">{utcTime(doneAt).replace(' UTC', '')}</span>
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 text-ink-soft">
      <CircleDashed className="size-4" aria-hidden />
      Pending
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
  const worst = lines[0]?.observed !== false ? lines[0]?.status ?? 'baseline' : 'baseline'
  return (
    <Panel aria-labelledby="health-checkup" accent={doneAt ? worst : 'baseline'} className={className}>
      <PanelHeader
        id="health-checkup"
        icon={<HeartPulse />}
        tone="orange"
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
            {v.observed === false ? <span className='text-xs text-ink-soft'>No measurement</span> : <StatusBadge status={v.status} />}
          </li>
        ))}
      </ul>
      <div className="mt-auto">
        <StartButton done={!!doneAt} primary={primary} to={href('/check/health')} label="health check-up" />
      </div>
    </Panel>
  )
}

/** Uma linha do cartão: rótulo à esquerda, valor à direita. */
function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <li className="flex items-center justify-between gap-3 border-t border-hairline py-1.5 first:border-t-0">
      <span className="text-sm text-ink-soft">{label}</span>
      <span className="text-right">{children}</span>
    </li>
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
  // Último resultado dos testes (guardado neste aparelho) e a mediana das sessões anteriores.
  const tests = useCognitive()
  const last = tests.at(-1)
  const reaction = last?.reaction ? compareReaction(tests.slice(0, -1), last.reaction.median) : null
  const none = <span className="text-sm text-ink-soft">—</span>
  return (
    <Panel aria-labelledby="behavioral-checkin" className={className}>
      <PanelHeader
        id="behavioral-checkin"
        icon={<Brain />}
        tone="blue"
        title="Behavioral check-in"
        subtitle={<TodayState doneAt={doneAt} />}
      />
      <ul className="grid" aria-label="Latest results">
        <Row label="Reflexes">
          {reaction ? (
            <>
              <span className="font-mono text-[17px] text-ink">{reaction.value}</span>
              <span className="font-mono text-[13px] text-ink-soft"> ms</span>
              {reaction.baseline != null && (
                <span className="ml-2 font-mono text-xs text-ink-soft">
                  {reaction.value - reaction.baseline > 0 ? '+' : ''}
                  {reaction.value - reaction.baseline}
                </span>
              )}
            </>
          ) : (
            none
          )}
        </Row>
        <Row label="Memory">
          {last?.memory ? (
            <>
              <span className="font-mono text-[17px] text-ink">{last.memory.span || 0}</span>
              <span className="font-mono text-[13px] text-ink-soft"> numbers</span>
            </>
          ) : (
            none
          )}
        </Row>
        <Row label="Attention">
          {last?.stroop ? (
            <span className="font-mono text-[17px] text-ink">
              {last.stroop.correct}/{last.stroop.total}
            </span>
          ) : (
            none
          )}
        </Row>
        <Row label="Mood · stress · rest">
          {behavioralQuestions.some((q) => answers?.[q.id] != null) ? (
            <span className="font-mono text-[17px] text-ink">{behavioralQuestions.map((q) => answers?.[q.id] ?? '—').join(' · ')}</span>
          ) : (
            none
          )}
        </Row>
      </ul>
      <div className="mt-auto">
        <StartButton done={!!doneAt} primary={primary} to={href('/check/behavioral')} label="behavioral check-in" />
      </div>
    </Panel>
  )
}
