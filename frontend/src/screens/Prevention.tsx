import { useEffect, useState } from 'react'
import { ShieldCheck } from 'lucide-react'
import { Dot } from '@/components/app/Dot'
import { PatternCard } from '@/components/app/PatternCard'
import { RadiationCard } from '@/components/app/RadiationCard'
import { PlanActive, PlanFinished, PlanSuggestion } from '@/components/app/PlanCard'
import { ReportDialog } from '@/components/app/Report'
import { DemoTag } from '@/components/app/SourceTag'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { indicators, useSpaceWeather } from '@/lib/donki'
import type { GameSummary } from '@/lib/game'
import { getTodayVitals } from '@/lib/health'
import { closePlan, OUTCOME_TEXT, type PlanOutcome } from '@/lib/plans'
import { useActivePlan, usePatterns, usePlanViews } from '@/lib/usePrevention'
import { utcDay } from '@/lib/utils'
import { utcDayKey } from '@/lib/water'
import type { Connection } from '@/types'

/*
  Prevention (plano v3, seção 6): a tese do projeto. Junta as medidas, compara com padrões de sinais
  precoces e, quando um padrão está ativo, mostra quais sinais estão presentes e qual regra gerou cada um.
  Padrão não é diagnóstico: vai para o relatório do cirurgião de voo.
*/
export function Prevention({ game, connection, params }: { game: GameSummary; connection: Connection; params?: URLSearchParams }) {
  const patterns = usePatterns()
  const active = patterns.filter((p) => p.active)
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
  const suggestion = active.find((p) => p.def.id !== running?.pattern.id && !(justFinished && p.def.id === justFinished.pattern.id))

  function endPlan() {
    if (running) closePlan(running.plan.id, 'ended-early', today)
    setConfirmEnd(false)
  }

  return (
    <div className="mx-auto max-w-[1360px] px-4 pt-4 pb-8 md:px-8">
      <header className="mb-5 max-w-3xl">
        <h1 className="font-display text-2xl font-semibold">Prevention</h1>
        <p className="mt-1 text-ink-soft">
          Your measures, all in one place, compared with patterns of early signs. When several signs show up together, you
          see which ones, and your flight surgeon sees them too.
        </p>
      </header>

      {/* Celular: padrões, plano, radiação, planos anteriores (ordem do plano v3).
          Desktop: padrões e radiação à esquerda, plano à direita. As colunas são "contents" no celular. */}
      <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:items-start">
        <div className="contents lg:grid lg:gap-4">
          <div className="order-1 grid gap-4">
          {active.length === 0 ? (
            <section aria-labelledby="no-pattern" className="flex flex-col gap-3 rounded-xl border border-hairline bg-surface-1 p-5 md:p-6">
              <div className="flex items-center gap-3">
                <ShieldCheck className="size-6 text-interactive" aria-hidden />
                <h2 id="no-pattern" className="font-display text-xl font-semibold">
                  No early-sign pattern today. {patterns.length} patterns checked.
                </h2>
              </div>
              <ul className="grid gap-2">
                {patterns.map((p) => (
                  <li key={p.def.id} className="rounded-lg border border-hairline px-3 py-2.5">
                    <p className="font-semibold">{p.def.title}</p>
                    <p className="text-sm text-ink-soft">Looks at: {p.def.signs.map((s) => s.label.replace(/ for \d+ days or more$/, '').toLowerCase()).join('; ')}.</p>
                  </li>
                ))}
              </ul>
              <DemoTag className="self-start" />
            </section>
          ) : (
            active.map((r) => <PatternCard key={r.def.id} result={r} />)
          )}

          {active.length > 0 && inactive.length > 0 && (
            <section aria-label="Other patterns" className="rounded-xl border border-hairline bg-surface-1/60 px-5 py-4">
              <p className="text-ink">
                {inactive.length} other {inactive.length === 1 ? 'pattern' : 'patterns'} checked, not active:
              </p>
              <ul className="mt-1 grid gap-0.5 text-sm text-ink-soft">
                {inactive.map((p) => (
                  <li key={p.def.id}>
                    {p.def.title}
                    <Dot />
                    <span className="font-mono">{p.present}</span> of <span className="font-mono">{p.total}</span> signs, needs{' '}
                    <span className="font-mono">{p.def.minSigns}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
          </div>
          <RadiationCard className="order-3" sepDay={sep ? utcDay(sep.time) : undefined} />
        </div>

        <div className="contents lg:grid lg:gap-4">
          {(running || justFinished || suggestion) && (
            <div className="order-2 grid gap-4">
              {running && <PlanActive view={running} todayPoints={game.today.points.plan} onEnd={() => setConfirmEnd(true)} />}
              {justFinished && (
                <PlanFinished view={justFinished} outcome={justFinished.plan.outcome ?? 'back-to-baseline'} onOpenReport={() => setReportOpen(true)} />
              )}
              {suggestion && <PlanSuggestion pattern={suggestion} blockedBy={running?.pattern.title} />}
            </div>
          )}
          {past.length > 0 && (
            <section aria-labelledby="past-plans" className="order-4 flex flex-col gap-2 rounded-xl border border-hairline bg-surface-1 p-5">
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
          <section aria-labelledby="how-title" className="order-5 flex flex-col gap-2 rounded-xl border border-hairline bg-surface-1 p-5">
            <h2 id="how-title" className="font-display text-lg font-semibold">
              How this works
            </h2>
            <ul className="grid list-disc gap-1.5 pl-5 text-sm text-ink-soft">
              <li>Each sign is one measure or answer compared with your own baseline, using the rule written next to it.</li>
              <li>A pattern is active when enough of its signs are present on the same day.</li>
              <li>It is not a diagnosis. Your flight surgeon reviews every active pattern.</li>
              <li>The patterns are demonstration rules with no clinical source yet.</li>
            </ul>
          </section>
        </div>
      </div>

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
