import { useEffect, useState } from 'react'
import { ChevronDown, ListChecks, RefreshCw } from 'lucide-react'
import { Disclosure } from '@/components/app/Disclosure'
import { Dot } from '@/components/app/Dot'
import { Panel, PanelHeader } from '@/components/app/Panel'
import { PatternCard } from '@/components/app/PatternCard'
import { RadiationCard } from '@/components/app/RadiationCard'
import { RoadmapStepItem } from '@/components/app/RoadmapStep'
import { PlanActive, PlanFinished, PlanSuggestion } from '@/components/app/PlanCard'
import { ReportDialog } from '@/components/app/Report'
import { DemoTag } from '@/components/app/SourceTag'
import { StateBadge } from '@/components/app/StatusBadge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { indicators, useSpaceWeather } from '@/lib/donki'
import type { GameSummary } from '@/lib/game'
import { getTodayVitals } from '@/lib/health'
import { ESCALATE_PROTOCOL, signalText, STATE_STATUS, topSignals } from '@/lib/monitor'
import { closePlan, OUTCOME_TEXT, type PlanOutcome } from '@/lib/plans'
import { ROADMAP_URL, useDoneSteps, useRoadmap, type PhaseId } from '@/lib/roadmap'
import { href } from '@/lib/route'
import { useActivePlan, usePatterns, usePlanViews } from '@/lib/usePrevention'
import { cn, utcDay } from '@/lib/utils'
import { utcDayKey } from '@/lib/water'
import type { Connection } from '@/types'
import type { Profile } from '@/lib/api'
import type { CheckIn } from '@/lib/storage'
import { useRoadmapInput } from '@/lib/useRoadmapInput'
import { useMonitor } from '@/lib/useMonitor'

/** Quantos passos aparecem em "What to do today". O resto fica em Details. */
const TODAY_STEPS = 3
const PHASE: Record<PhaseId, string> = {
  today: 'bg-sa-rocket-600 text-white',
  'next-days': 'bg-sa-yellow text-sa-deep',
  week: 'bg-sa-yonder text-sa-deep',
}

/*
  Prevention (plano v3, seção 6): a tese do projeto. Junta as medidas, compara com padrões de sinais
  precoces e, quando um padrão está ativo, mostra quais sinais estão presentes e qual regra gerou cada um.
  Padrão não é diagnóstico: vai para o relatório do cirurgião de voo.

  Tela enxuta, uma coluna, três perguntas: como estou (estado da regra), o que faço hoje (no máximo
  três passos, ou o plano em andamento) e por quê (os sinais principais). Padrões, próximos dias,
  radiação, planos anteriores e a explicação ficam fechados em "Details". Em ESCALATE, só o protocolo.
*/
export function Prevention({ game, connection, params, profile, checkins }: { game: GameSummary; connection: Connection; params?: URLSearchParams; profile: Profile; checkins: CheckIn[] }) {
  const roadmapInput = useRoadmapInput(profile, checkins)
  const monitor = useMonitor()
  const patterns = usePatterns()
  // No máximo dois padrões compatíveis na tela (seção 7, passo 5).
  const active = patterns.filter((p) => p.active).slice(0, 2)
  const inactive = patterns.filter((p) => !p.active)
  const running = useActivePlan()
  const views = usePlanViews()
  const vitals = getTodayVitals()
  const [confirmEnd, setConfirmEnd] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)
  const today = utcDayKey()
  const weather = useSpaceWeather()
  const sep = weather.mode === 'live' ? indicators(weather.state.snapshot).sep.featured : undefined
  const section = params?.get('section')
  const { roadmap, loading, regenerate } = useRoadmap(roadmapInput)
  const { done, toggle } = useDoneSteps()
  // Vindo do clima espacial da Home (?section=radiation), Details já abre.
  const [detailsOpen, setDetailsOpen] = useState(section === 'radiation')

  // #/prevention?section=radiation (vindo do clima espacial da Home): rola até a radiação,
  // depois do "volta ao topo" que o App faz ao trocar de tela.
  useEffect(() => {
    if (section === 'radiation') {
      requestAnimationFrame(() => requestAnimationFrame(() => document.getElementById('radiation')?.scrollIntoView({ behavior: 'smooth' })))
    }
  }, [section])

  // Plano que fechou (último dia completo ou prazo vencido) e ainda não tem resultado: guarda o resultado
  // de agora, para "Past plans" continuar dizendo o que aconteceu.
  useEffect(() => {
    for (const v of views) {
      if (!v.finished || v.plan.outcome) continue
      const stillActive = patterns.some((p) => p.def.id === v.pattern.id && p.active)
      const outcome: PlanOutcome = stillActive ? 'signs-still-present' : 'back-to-baseline'
      closePlan(v.plan.id, outcome, v.completed && today <= v.lastDay ? today : v.lastDay)
    }
  }, [views, patterns, today])

  // Plano que fechou hoje com resultado (não o encerrado antes, que vai direto para "Past plans").
  const justFinished = !running
    ? views.filter((v) => v.finished && v.plan.endedDay === today && v.plan.outcome !== 'ended-early').at(-1)
    : undefined
  const past = views.filter((v) => v.finished && v !== justFinished)
  // Em ESCALATE não se sugere plano de rotina: fica só o protocolo.
  const suggestion = monitor?.state === 'ESCALATE' ? undefined
    : active.find((p) => p.def.id !== running?.pattern.id && !(justFinished && p.def.id === justFinished.pattern.id))

  function endPlan() {
    if (running) closePlan(running.plan.id, 'ended-early', today)
    setConfirmEnd(false)
  }

  const escalate = monitor?.state === 'ESCALATE'
  const top = monitor ? topSignals(monitor) : []
  const todaySteps = roadmap.phases.find((p) => p.id === 'today')?.steps ?? []
  // Com plano em andamento, hoje é o plano: o roteiro inteiro fica em Details.
  const shown = running ? [] : todaySteps.slice(0, TODAY_STEPS)
  const doable = shown.filter((s) => s.kind === 'do')
  const laterPhases = roadmap.phases.filter((p) => p.id !== 'today' || p.steps.length > shown.length)

  return (
    <div className="mx-auto grid max-w-[820px] gap-4 px-4 pt-4 pb-8 md:px-8">
      <h1 className="font-display text-2xl font-semibold">Prevention</h1>

      {/* 1. Como estou + por quê */}
      {monitor && (
        <Panel aria-label="How you are today" accent={STATE_STATUS[monitor.state]} className="gap-2 md:p-6">
          <p role="status" aria-label="Monitoring state" className="flex flex-wrap items-center gap-y-1 text-[15px] text-ink">
            <StateBadge state={monitor.state} />
            <Dot />
            <span>
              Day <span className="font-mono">{monitor.day}</span>
            </span>
            <span className="ml-auto" title={monitor.notice}>
              <DemoTag />
              <span className="sr-only">: {monitor.notice}</span>
            </span>
          </p>
          <p className="font-display text-xl leading-snug font-semibold text-ink">
            {monitor.observed ? monitor.wording : 'No check-up today yet.'}
          </p>
          {top.length > 0 && (
            <p className="text-[15px] text-ink-soft">
              <span className="font-semibold text-ink">Why:</span> {top.map(signalText).join('; ')}.
            </p>
          )}
          {!monitor.observed && (
            <a href={href('/')} className="self-start text-sm font-semibold">
              Do today&apos;s check-up on Home
            </a>
          )}
        </Panel>
      )}

      {/* 2. O que faço hoje */}
      {escalate && monitor ? (
        <section aria-labelledby="today-title" className="grid gap-2 rounded-xl bg-flag-tint p-5 md:p-6">
          <h2 id="today-title" className="font-display text-lg font-semibold text-flag-badge-ink">
            {ESCALATE_PROTOCOL}
          </h2>
          <ul className="grid list-disc gap-1 pl-5 text-[15px] text-ink">
            {monitor.reasons.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
          <p className="text-sm text-ink">Routine steps are paused until medical review. Fixed protocol text, not written by AI, not a diagnosis.</p>
        </section>
      ) : running ? (
        <PlanActive compact view={running} todayPoints={game.today.points.plan} onEnd={() => setConfirmEnd(true)} />
      ) : (
        <Panel aria-labelledby="today-title" className="gap-4 md:p-6">
          <PanelHeader
            id="today-title"
            icon={<ListChecks />}
            tone="orange"
            title="What to do today"
            aside={
              <>
                {doable.length > 0 && (
                  <span className="font-mono text-sm text-ink-soft">
                    {doable.filter((s) => done.includes(s.id)).length}/{doable.length}
                    <span className="sr-only"> steps done</span>
                  </span>
                )}
                {ROADMAP_URL && (
                  <Button variant="ghost" size="sm" onClick={regenerate} disabled={loading} className="text-interactive" title="Rewrite with AI">
                    <RefreshCw className={cn('size-4', loading && 'animate-spin')} aria-hidden />
                    <span className="sr-only">Rewrite with AI</span>
                  </Button>
                )}
              </>
            }
          />
          {shown.length ? (
            <ul className="grid gap-4">
              {shown.map((s) => (
                <RoadmapStepItem key={s.id} step={s} checkable hideWhy riskLink={false} done={done.includes(s.id)} onToggle={() => toggle(s.id)} />
              ))}
            </ul>
          ) : (
            <p className="text-ink-soft">Nothing extra today. Keep the routine.</p>
          )}
          {suggestion && <PlanSuggestion compact pattern={suggestion} />}
        </Panel>
      )}
      {justFinished && <PlanFinished view={justFinished} outcome={justFinished.plan.outcome ?? 'back-to-baseline'} onOpenReport={() => setReportOpen(true)} />}

      {/* 3. Todo o resto, fechado */}
      <details open={detailsOpen} onToggle={(e) => setDetailsOpen(e.currentTarget.open)} className="group/details rounded-xl border border-hairline bg-surface-1">
        <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 px-5 py-2 [&::-webkit-details-marker]:hidden">
          <span>
            <span className="block font-display text-lg font-semibold text-ink">Details</span>
            <span className="block text-sm text-ink-soft">Patterns, coming days, radiation, past plans</span>
          </span>
          <ChevronDown className="size-5 shrink-0 text-ink-soft transition-transform group-open/details:rotate-180" aria-hidden />
        </summary>
        <div className="grid gap-4 border-t border-hairline p-4 md:p-5">
          {monitor && (
            <p className="text-sm text-ink-soft">
              Change score <span className="font-mono text-ink">{monitor.score}</span> of 100. It shows how large the change is. It is not a probability.
            </p>
          )}

          {/* Roteiro: o que não coube em "hoje", os próximos dias e a semana */}
          {!escalate && laterPhases.some((p) => p.steps.length > 0) && (
            <section aria-label="Preventive roadmap" className="grid gap-3">
              {laterPhases.map((phase) =>
                phase.steps.length ? (
                  <div key={phase.id} className="grid content-start gap-3 rounded-lg bg-surface-2/60 p-4">
                    <h2 className={cn('justify-self-start rounded-md px-2 py-0.5 text-sm font-bold', PHASE[phase.id])}>{phase.title}</h2>
                    <ul className="grid gap-4">
                      {phase.steps.map((s) => (
                        <RoadmapStepItem key={s.id} step={s} checkable={phase.id === 'today'} links={phase.id === 'today'} done={done.includes(s.id)} onToggle={() => toggle(s.id)} />
                      ))}
                    </ul>
                  </div>
                ) : null,
              )}
              <p className="text-xs text-ink-soft">
                {roadmap.engine === 'ai' ? 'Written by AI.' : 'Written on this device.'} Suggested, not reviewed by a flight surgeon. Today is compared with pre-flight values and the median of your last 14 days in flight.
              </p>
            </section>
          )}

          {/* Padrões de sinais precoces */}
          {active.map((r) => (
            <PatternCard key={r.def.id} result={r} />
          ))}
          <section aria-labelledby="patterns-checked" className="rounded-lg border border-hairline px-4 py-3">
            <h2 id="patterns-checked" className="text-sm font-semibold text-ink-soft">
              {active.length === 0 ? `No early-sign pattern today. ${patterns.length} patterns checked` : `${inactive.length} other ${inactive.length === 1 ? 'pattern' : 'patterns'} checked, not active`}
            </h2>
            <ul className="mt-2 grid divide-y divide-hairline text-sm">
              {inactive.map((p) => (
                <li key={p.def.id} className="flex flex-col gap-0.5 py-2 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
                  <span className="min-w-0 text-ink">{p.def.title}</span>
                  <span className="shrink-0 font-mono text-[13px] whitespace-nowrap text-ink-soft">
                    {p.present}/{p.total} signs
                    <span className="sr-only">, needs {p.def.minSigns}</span>
                    <span aria-hidden> · needs {p.def.minSigns}</span>
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <RadiationCard sepDay={sep ? utcDay(sep.time) : undefined} />

          {past.length > 0 && (
            <section aria-labelledby="past-plans" className="flex flex-col gap-2 rounded-lg border border-hairline px-4 py-3">
              <h2 id="past-plans" className="font-display text-lg font-semibold">
                Past plans
              </h2>
              <ul className="grid">
                {past.map((v) => (
                  <li key={v.plan.id} className="grid gap-0.5 border-t border-hairline py-2.5 first:border-t-0">
                    <span className="font-semibold">{v.pattern.title}</span>
                    <span className="font-mono text-[13px] text-ink-soft">
                      {utcDay(`${v.plan.startedDay}T00:00:00Z`)} to {utcDay(`${v.plan.endedDay ?? v.lastDay}T00:00:00Z`)}
                      <Dot />
                      {v.days.filter((d) => d.complete).length} of {v.plan.days} days complete
                    </span>
                    {v.plan.outcome && <span className="text-sm text-ink-soft">{OUTCOME_TEXT[v.plan.outcome]}</span>}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section aria-label="How this works" className="rounded-lg border border-hairline px-4 py-1">
            <Disclosure summary={<span className="font-display text-base text-ink">How this works</span>}>
              <ul className="grid list-disc gap-1.5 pb-2 pl-5 text-sm text-ink-soft">
                <li>The monitoring rule compares each measure with your pre-flight baseline and the median of your recent days in flight.</li>
                <li>The state comes from the rule: how many measures are off and for how many days.</li>
                <li>The patterns are the six conditions of the NEXUS-Med research, in the research&apos;s own wording. A pattern never changes the state on its own.</li>
                <li>It is not a diagnosis. Your flight surgeon reviews every active pattern. Demonstration rule, values anchored in published spaceflight data.</li>
              </ul>
            </Disclosure>
          </section>
        </div>
      </details>

      <Dialog open={confirmEnd} onOpenChange={setConfirmEnd}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader className="text-left">
            <DialogTitle className="font-display text-xl font-semibold">End this plan?</DialogTitle>
            <DialogDescription className="text-ink-soft">You keep the points you earned. You can start a new plan while a pattern is active.</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:justify-start">
            <Button variant="secondary" onClick={endPlan}>
              End plan
            </Button>
            <Button variant="ghost" onClick={() => setConfirmEnd(false)}>
              Keep going
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <ReportDialog
        open={reportOpen}
        onOpenChange={setReportOpen}
        vitals={vitals}
        patterns={active}
        plan={running ?? justFinished ?? undefined}
        connection={connection}
      />
    </div>
  )
}
