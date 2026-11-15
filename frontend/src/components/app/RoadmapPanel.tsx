import { RefreshCw, Route } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ESCALATE_PROTOCOL, signalText, STATE_STATUS, topSignals, type MonitorResult } from '@/lib/monitor'
import { ROADMAP_URL, useDoneSteps, useRoadmap, type PhaseId, type RoadmapInput } from '@/lib/roadmap'
import { cn } from '@/lib/utils'
import { Dot } from './Dot'
import { Panel, PanelHeader } from './Panel'
import { RoadmapStepItem } from './RoadmapStep'
import { DemoTag } from './SourceTag'
import { StateBadge } from './StatusBadge'

const PHASE: Record<PhaseId, string> = {
  today: 'bg-sa-rocket-600 text-white',
  'next-days': 'bg-sa-yellow text-sa-deep',
  week: 'bg-sa-yonder text-sa-deep',
}

/** Linha do estado no topo do roteiro: "Persistent change · score 54 · Day 19 · Demonstration rule". */
function StateLine({ m }: { m: MonitorResult }) {
  const top = topSignals(m)
  return (
    <div role="status" aria-label="Monitoring state" className="grid gap-1 rounded-lg border border-hairline px-4 py-3">
      <p className="flex flex-wrap items-center gap-y-1 text-[15px] text-ink">
        <StateBadge state={m.state} />
        <Dot />
        <span>
          score <span className="font-mono">{m.score}</span>
          <span className="sr-only"> of 100, change intensity</span>
        </span>
        <Dot />
        <span>
          Day <span className="font-mono">{m.day}</span>
        </span>
        <span className="ml-auto" title={m.notice}>
          <DemoTag />
          <span className="sr-only">: {m.notice}</span>
        </span>
      </p>
      <p className="text-sm text-ink-soft">
        {m.observed ? m.wording : 'No check-up today yet. The state uses what you recorded today.'}
        {top.length > 0 && <> Main signals: {top.map(signalText).join('; ')}.</>}
      </p>
    </div>
  )
}

/**
 * Roteiro preventivo: os sete parâmetros contra as linhas de base pré-voo e em voo, em passos de rotina
 * para hoje, os próximos 3 dias e a semana. Sugestão, não diagnóstico.
 * Com o motor (monitor.ts): a linha de estado fica no topo e, em ESCALATE, o roteiro some e fica só o protocolo.
 */
export function RoadmapPanel({ input, monitor, className }: { input: RoadmapInput; monitor?: MonitorResult | null; className?: string }) {
  const { roadmap, loading, regenerate } = useRoadmap(input)
  const { done, toggle } = useDoneSteps()
  // O mesmo porquê (ex.: os sinais do motor) aparece em vários passos: mostra só na primeira vez.
  const repeatedWhy = new Set<string>()
  const seenWhy = new Set<string>()
  for (const phase of roadmap.phases) {
    for (const s of phase.steps) {
      if (s.why && seenWhy.has(s.why)) repeatedWhy.add(s.id)
      seenWhy.add(s.why)
    }
  }
  if (monitor?.state === 'ESCALATE') {
    return (
      <Panel aria-labelledby="roadmap-title" accent="flagged" className={cn('gap-4 md:p-6', className)}>
        <PanelHeader id="roadmap-title" icon={<Route />} tone="orange" title={monitor.wording} subtitle="Preventive roadmap paused until medical review" />
        <StateLine m={monitor} />
        <div className="grid gap-2 rounded-lg bg-flag-tint p-4">
          <p className="font-semibold text-flag-badge-ink">{ESCALATE_PROTOCOL}</p>
          <ul className="grid list-disc gap-1 pl-5 text-sm text-ink">
            {monitor.reasons.map((r) => <li key={r}>{r}</li>)}
          </ul>
          <p className="text-sm text-ink-soft">Fixed protocol text from the monitoring rule. It is not written by AI and it is not a diagnosis.</p>
        </div>
      </Panel>
    )
  }
  return (
    <Panel aria-labelledby="roadmap-title" accent={roadmap.ground ? 'flagged' : monitor ? STATE_STATUS[monitor.state] : 'baseline'} className={cn('gap-4 md:p-6', className)}>
      <PanelHeader
        id="roadmap-title"
        icon={<Route />}
        tone="orange"
        title={roadmap.headline}
        subtitle={roadmap.engine === 'ai' ? 'Preventive roadmap, written by AI' : 'Preventive roadmap, written on this device'}
        aside={
          ROADMAP_URL ? (
            <Button variant="ghost" size="sm" onClick={regenerate} disabled={loading} className="text-interactive">
              <RefreshCw className={cn('size-4', loading && 'animate-spin')} aria-hidden /> Rewrite
            </Button>
          ) : undefined
        }
      />
      {monitor && <StateLine m={monitor} />}
      <div className="grid gap-4 lg:grid-cols-3">
        {roadmap.phases.map((phase) => (
          <section key={phase.id} aria-label={phase.title} className="grid content-start gap-3 rounded-lg bg-surface-2/60 p-4">
            <h3 className={cn('justify-self-start rounded-md px-2 py-0.5 text-sm font-bold', PHASE[phase.id])}>{phase.title}</h3>
            {phase.steps.length ? (
              <ul className="grid gap-4">
                {phase.steps.map((s) => (
                  <RoadmapStepItem key={s.id} step={s} checkable={phase.id === 'today'} links={phase.id === 'today'} done={done.includes(s.id)} onToggle={() => toggle(s.id)} hideWhy={repeatedWhy.has(s.id)} />
                ))}
              </ul>
            ) : (
              <p className="text-sm text-ink-soft">Nothing extra. Keep the routine.</p>
            )}
          </section>
        ))}
      </div>
      <p className="text-xs text-ink-soft">Suggested, not reviewed by a flight surgeon. Today is compared with pre-flight values and the median of your last 14 days in flight.</p>
    </Panel>
  )
}
