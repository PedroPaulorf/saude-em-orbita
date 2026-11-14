import { CloudOff, Radio, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { reportItems, sendState } from '@/lib/present'
import { cn } from '@/lib/utils'
import type { Connection, Vital } from '@/types'
import { Panel, PanelHeader } from './Panel'
import { Dot, Dotted } from './Dot'
import { DemoTag } from './SourceTag'
import { StatusBadge } from './StatusBadge'

export function ReportCompact({
  vitals,
  connection,
  onOpen,
  className,
}: {
  vitals: Vital[]
  connection: Connection
  onOpen: () => void
  className?: string
}) {
  const items = reportItems(vitals)
  const flagged = items.filter((v) => v.status === 'flagged').length
  return (
    <Panel aria-labelledby="report-ground" className={cn('gap-3', className)}>
      <PanelHeader id="report-ground" icon={<Send />} title="Report for ground" />
      <div className="flex flex-wrap items-center justify-between gap-x-2">
      <p className="text-[15px] text-ink">
        {items.length === 0 ? (
          'Nothing differs from your baseline today.'
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
      </p>
        <Button variant="ghost" size="sm" className="-mr-3 text-interactive" onClick={onOpen}>
          Open report
        </Button>
      </div>
      <span className="mt-auto inline-flex items-center gap-2 text-sm text-ink-soft">
        <CloudOff className="size-4" aria-hidden />
        <Dotted text={sendState(connection)} />
      </span>
    </Panel>
  )
}

export function ReportDialog({
  open,
  onOpenChange,
  vitals,
  connection,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  vitals: Vital[]
  connection: Connection
}) {
  const items = reportItems(vitals)
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
          <p className="text-ink-soft">Nothing differs from your baseline today.</p>
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
                {v.rule && <p className="text-sm text-ink-soft">{v.rule}</p>}
              </li>
            ))}
          </ul>
        )}

        <div className="flex flex-wrap items-center gap-2 border-t border-hairline pt-4">
          {items.length > 0 && <DemoTag />}
          <span className="text-xs text-ink-soft">Simulated data. Demonstration rules, no clinical source.</span>
        </div>
      </DialogContent>
    </Dialog>
  )
}
