import { CloudOff, Radio, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import type { PlanView } from '@/lib/plans'
import type { PatternResult } from '@/lib/prevention'
import { reportItems, sendState } from '@/lib/present'
import { cn } from '@/lib/utils'
import type { Connection, Vital } from '@/types'
import { Panel, PanelHeader } from './Panel'
import { Dot, Dotted } from './Dot'
import { DemoTag } from './SourceTag'
import { StatusBadge } from './StatusBadge'
import { AssessmentDetails, MeasurementProvenance } from './MeasurementDetails'

export function ReportCompact({
  vitals,
  patterns = [],
  connection,
  onOpen,
  className,
}: {
  vitals: Vital[]
  /** Padrões ativos: entram no relatório. */
  patterns?: PatternResult[]
  connection: Connection
  onOpen: () => void
  className?: string
}) {
  const items = reportItems(vitals)
  const flagged = items.filter((v) => v.status === 'flagged').length
  return (
    <Panel aria-labelledby="report-ground" accent={flagged > 0 ? 'flagged' : 'baseline'} className={cn('gap-3', className)}>
      <PanelHeader
        id="report-ground"
        icon={<Send />}
        tone="red"
        title="Report"
        aside={
          <Button variant="ghost" size="sm" className="-mt-2 -mr-3 text-interactive" onClick={onOpen}>
            Open report
          </Button>
        }
      />
      <p className="text-[15px] text-ink">
        {items.length === 0 ? (
          vitals.some(v => v.observed === false) ? 'Measurements are missing today.' : vitals.some(v => v.comparable === false) ? 'Some personal baselines are unavailable.' : 'Recorded measures match your baseline today.'
        ) : (
          <>
            <span className="font-mono text-2xl font-medium">{items.length}</span>{' '}
            {items.length === 1 ? 'item' : 'items'} to report
            {flagged > 0 && (
              <span className="text-ink-soft">
                <Dot />
                <span className="font-mono">{flagged}</span> flagged
              </span>
            )}
          </>
        )}
        {patterns.length > 0 && (
          <span className="block text-sm text-ink-soft">
            {patterns.map((p) => p.def.title).join(', ')}: early-sign pattern
          </span>
        )}
      </p>
      <span className="mt-auto inline-flex items-center gap-2 text-sm text-ink-soft">
        <CloudOff className="size-4" aria-hidden />
        <Dotted text={sendState(connection)} />
      </span>
      <a href="#/data" className="text-sm font-semibold text-interactive underline">Medical data & sources</a>
    </Panel>
  )
}

export function ReportDialog({
  open,
  onOpenChange,
  vitals,
  patterns = [],
  plan,
  connection,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  vitals: Vital[]
  patterns?: PatternResult[]
  /** Plano em andamento (ou que acabou de fechar): entra no relatório para revisão. */
  plan?: PlanView
  connection: Connection
}) {
  const items = reportItems(vitals)
  const otherRecorded = vitals.filter(v => v.observed !== false && !items.some(item => item.id === v.id))
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader className="pr-10 text-left">
          <DialogTitle className="flex items-center gap-2 font-display text-xl font-semibold">
            <Radio className="size-5 text-interactive" aria-hidden />
            Report for ground
          </DialogTitle>
          <DialogDescription className="text-ink-soft">
            What differs from your baseline today, for your flight surgeon. {sendState(connection)}.
          </DialogDescription>
        </DialogHeader>

        {items.length === 0 ? (
          <p className="text-ink-soft">{vitals.some(v => v.observed === false) ? 'Measurements are missing today.' : vitals.some(v => v.comparable === false) ? 'Some personal baselines are unavailable.' : 'Recorded measures match your baseline today.'}</p>
        ) : (
          <ul className="grid">
            {items.map((v) => (
              <li key={v.id} className="grid gap-1.5 border-t border-hairline py-3 first:border-t-0">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-semibold">{v.label}</span>
                  <StatusBadge status={v.status} />
                </div>
                <p className="font-mono text-sm text-ink-soft">
                  <span className="text-ink">
                    {v.value} {v.unit}
                  </span>{' '}
                  · baseline {v.baseline} · {v.delta}
                </p>
                <MeasurementProvenance provenance={v.provenance} at={v.at} sync={v.recordSync} />
                <p className="text-xs text-ink-soft">{v.assessment ? 'Assessment saved with this record' : 'Local comparison preview'}</p>
                <AssessmentDetails assessment={v.assessment} localRule={v.assessment ? undefined : v.rule} recordId={v.recordId} clientId={v.clientId} />
              </li>
            ))}
          </ul>
        )}

        {otherRecorded.length > 0 && <details className="border-t border-hairline pt-3 text-sm">
          <summary className="cursor-pointer py-2 font-semibold">Other recorded measurements ({otherRecorded.length})</summary>
          <ul className="grid gap-3">{otherRecorded.map(v => <li key={v.id} className="rounded-lg bg-surface-2 p-3">
            <p className="font-semibold">{v.label}: {v.value} {v.unit}</p>
            <MeasurementProvenance provenance={v.provenance} at={v.at} sync={v.recordSync} />
            <AssessmentDetails assessment={v.assessment} localRule={v.assessment ? undefined : v.rule} recordId={v.recordId} clientId={v.clientId} />
          </li>)}</ul>
        </details>}

        {patterns.length > 0 && (
          <section aria-labelledby="report-patterns" className="grid gap-2 border-t border-hairline pt-4">
            <h3 id="report-patterns" className="font-display text-lg font-semibold">
              Early-sign patterns
            </h3>
            {patterns.map((p) => (
              <div key={p.def.id} className="grid gap-1.5 rounded-lg bg-surface-2/60 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-semibold">
                    {p.def.title} · <span className="font-mono">{p.present}</span> of <span className="font-mono">{p.total}</span> signs
                  </span>
                  <StatusBadge status={p.status} />
                </div>
                <ul className="grid gap-1 text-sm text-ink-soft">
                  {p.signs
                    .filter((s) => s.state === 'present')
                    .map((s) => (
                      <li key={s.def.id}>
                        <span className="text-ink">{s.def.label}.</span> {s.detail}
                      </li>
                    ))}
                </ul>
              </div>
            ))}
            <p className="text-xs text-ink-soft">A pattern is not a diagnosis. Listed for flight surgeon review.</p>
          </section>
        )}

        {plan && (
          <section aria-labelledby="report-plan" className="grid gap-2 border-t border-hairline pt-4">
            <h3 id="report-plan" className="font-display text-lg font-semibold">
              Back-to-baseline plan
            </h3>
            <p className="text-sm text-ink">
              {plan.pattern.title} · day <span className="font-mono">{plan.dayNumber}</span> of{' '}
              <span className="font-mono">{plan.plan.days}</span>
            </p>
            <ul className="grid gap-0.5 font-mono text-[13px] text-ink-soft">
              {plan.days
                .filter((d) => d.state !== 'upcoming')
                .map((d) => (
                  <li key={d.day}>
                    Day {d.index}: {d.doneCount} of {d.steps.length} steps
                    {d.steps.some((s) => s.done) && ` (${d.steps.filter((s) => s.done).map((s) => s.def.label.toLowerCase()).join(', ')})`}
                  </li>
                ))}
            </ul>
            <p className="text-xs font-semibold text-ink-soft">Suggested plan, awaiting flight surgeon review.</p>
          </section>
        )}

        <div className="flex flex-wrap items-center gap-2 border-t border-hairline pt-4">
          {(items.length > 0 || patterns.length > 0) && <DemoTag />}
          <span className="text-xs text-ink-soft">Simulated data. Demonstration rules, no clinical source.</span>
        </div>
      </DialogContent>
    </Dialog>
  )
}
