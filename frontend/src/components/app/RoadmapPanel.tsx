import { RefreshCw, Route } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ROADMAP_URL, useDoneSteps, useRoadmap, type PhaseId, type RoadmapInput } from '@/lib/roadmap'
import { cn } from '@/lib/utils'
import { Panel, PanelHeader } from './Panel'
import { RoadmapStepItem } from './RoadmapStep'

const PHASE: Record<PhaseId, string> = {
  today: 'bg-sa-rocket-600 text-white',
  'next-days': 'bg-sa-yellow text-sa-deep',
  week: 'bg-sa-yonder text-sa-deep',
}

/**
 * Roteiro preventivo: os sete parâmetros contra as linhas de base pré-voo e em voo, em passos de rotina
 * para hoje, os próximos 3 dias e a semana. Sugestão, não diagnóstico.
 */
export function RoadmapPanel({ input, className }: { input: RoadmapInput; className?: string }) {
  const { roadmap, loading, regenerate } = useRoadmap(input)
  const { done, toggle } = useDoneSteps()
  return (
    <Panel aria-labelledby="roadmap-title" accent={roadmap.ground ? 'flagged' : 'baseline'} className={cn('gap-4 md:p-6', className)}>
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
      <div className="grid gap-4 lg:grid-cols-3">
        {roadmap.phases.map((phase) => (
          <section key={phase.id} aria-label={phase.title} className="grid content-start gap-3 rounded-lg bg-surface-2/60 p-4">
            <h3 className={cn('justify-self-start rounded-md px-2 py-0.5 text-sm font-bold', PHASE[phase.id])}>{phase.title}</h3>
            {phase.steps.length ? (
              <ul className="grid gap-4">
                {phase.steps.map((s) => (
                  <RoadmapStepItem key={s.id} step={s} checkable={phase.id === 'today'} links={phase.id === 'today'} done={done.includes(s.id)} onToggle={() => toggle(s.id)} />
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
