import type { ReactNode } from 'react'
import { ExternalLink, History, Orbit, RefreshCw, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  DONKI_PAGE,
  indicators,
  LIVE_WINDOW_DAYS,
  type DateWindow,
  type SpaceWeatherMode,
  type SpaceWeatherState,
} from '@/lib/donki'
import { dataAge, dayLabel as DAY } from '@/lib/present'
import { href } from '@/lib/route'
import { cn, utcDateTime, utcDay, utcTime } from '@/lib/utils'
import { Panel, PanelHeader } from './Panel'
import { Dot } from './Dot'
import { LiveTag } from './SourceTag'

/*
  Clima espacial (NASA DONKI). A lógica vem de useSpaceWeather, sem alteração.
  O cartão não promete "agora": mostra a idade do dado e por onde ele veio (plano v2, seção 9).
*/

function rangeLabel(w: DateWindow, isLive: boolean) {
  return isLive ? `in the last ${LIVE_WINDOW_DAYS} days` : `from ${DAY(w.startDate)} to ${DAY(w.endDate, true)}`
}

function AgeLine({ state }: { state: SpaceWeatherState }) {
  return (
    <span className="inline-flex items-center gap-2 font-mono text-[13px] text-ink-soft">
      <span
        aria-hidden
        className={cn(
          'size-2 rounded-full',
          state.source === 'live' ? 'bg-interactive' : 'border-[1.5px] border-ink-soft',
          state.checking && 'animate-pulse',
        )}
      />
      {state.checking && state.source !== 'live' ? 'Checking NASA DONKI…' : dataAge(state)}
    </span>
  )
}

export function SpaceWeatherCompact({
  state,
  onDetails,
  className,
}: {
  state: SpaceWeatherState
  onDetails: () => void
  className?: string
}) {
  const ind = indicators(state.snapshot)
  const sep = ind.sep.featured
  const range = rangeLabel(state.snapshot.window, state.source === 'live')

  return (
    <Panel aria-labelledby="space-weather" className={cn('gap-3', className)} aria-busy={state.checking}>
      <PanelHeader
        id="space-weather"
        icon={<Sun />}
        title="Space weather"
        aside={
          <Button variant="ghost" size="sm" className="-mt-2 -mr-3 text-interactive" onClick={onDetails}>
            Details
          </Button>
        }
      />
      <div className="grid gap-1">
        <p className={cn('text-[15px] leading-snug', sep ? 'font-semibold text-ink' : 'text-ink')}>
          {sep ? `Solar particle event · ${utcDay(sep.time)}` : `No solar particle event ${range}`}
        </p>
        <p className="text-sm text-ink-soft">
          {ind.flr.strongest ? (
            <>
              Strongest flare <span className="font-mono text-ink">{ind.flr.strongest.classType}</span>
              <Dot />
              <span className="font-mono">{utcDay(ind.flr.strongest.peakTime)}</span>
            </>
          ) : (
            `No solar flare ${range}`
          )}
        </p>
      </div>
      <div className="mt-auto flex flex-wrap items-center justify-between gap-2">
        <AgeLine state={state} />
        <LiveTag href={DONKI_PAGE} />
      </div>
    </Panel>
  )
}

function EventRow({ code, children, iso }: { code: string; children: ReactNode; iso?: string }) {
  return (
    <div className="grid grid-cols-[3rem_1fr_auto] items-start gap-3 border-t border-hairline py-3 first:border-t-0">
      <span className="font-mono text-sm font-medium text-interactive">{code}</span>
      <div className="min-w-0 text-[15px] leading-snug">{children}</div>
      {iso ? (
        <time className="text-right font-mono text-[13px] whitespace-nowrap text-ink-soft" dateTime={iso}>
          {utcDay(iso)}
          <br />
          {utcTime(iso)}
        </time>
      ) : (
        <span className="text-ink-soft">—</span>
      )}
    </div>
  )
}

export function SpaceWeatherDialog({
  open,
  onOpenChange,
  state,
  mode,
  onModeChange,
  onRetry,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  state: SpaceWeatherState
  mode: SpaceWeatherMode
  onModeChange: (m: SpaceWeatherMode) => void
  onRetry?: () => void
}) {
  const { snapshot } = state
  const ind = indicators(snapshot)
  const range = rangeLabel(snapshot.window, state.source === 'live')
  const sep = ind.sep.featured
  const detections = ind.sep.count - ind.sep.modelCount
  const offline = state.source === 'cache' || state.source === 'bundled'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader className="pr-10 text-left">
          <DialogTitle className="flex items-center gap-2 font-display text-xl font-semibold">
            <Orbit className="size-5 text-interactive" aria-hidden />
            {mode === 'history' ? 'Space weather · past event' : 'Space weather'}
          </DialogTitle>
          <DialogDescription asChild>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <AgeLine state={state} />
              <LiveTag href={DONKI_PAGE} />
            </div>
          </DialogDescription>
        </DialogHeader>

        {mode === 'history' && (
          <p className="rounded-lg bg-surface-2 px-3 py-2 text-sm text-ink-soft">
            Recorded from {DAY(snapshot.window.startDate)} to {DAY(snapshot.window.endDate, true)}. Not current
            conditions.
          </p>
        )}

        <div>
          <EventRow code="SEP" iso={sep?.time}>
            {sep ? (
              <>
                <span className="font-semibold">Solar energetic particle event</span>
                <span className="block text-sm text-ink-soft">
                  {detections} detection{detections === 1 ? '' : 's'}
                  {ind.sep.modelCount > 0 &&
                    `, ${ind.sep.modelCount} model forecast${ind.sep.modelCount === 1 ? '' : 's'}`}
                  {sep.linked.length > 0 && ` · linked to ${sep.linked.join(' + ')}`}
                </span>
              </>
            ) : (
              `No solar particle event ${range}`
            )}
          </EventRow>

          {sep && (
            <div className="mb-3 ml-[3.75rem] grid gap-2 border-l-2 border-hairline-strong pl-3">
              {sep.alert?.summary && (
                <p className="text-sm text-ink-soft">
                  <span className="font-semibold text-ink">First alert · {utcDateTime(sep.alert.issued)}</span>
                  <br />
                  {sep.alert.summary.replace(/\s*Activity ID:.*$/, '')}
                </p>
              )}
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                {sep.alert && (
                  <a className="underline underline-offset-3 text-interactive" href={sep.alert.url} target="_blank" rel="noreferrer">
                    Original alert {sep.alert.id}
                  </a>
                )}
                <a className="underline underline-offset-3 text-interactive" href={href('/stats', { risk: 'radiation' })} onClick={() => onOpenChange(false)}>
                  Linked NASA risk: radiation
                </a>
              </div>
            </div>
          )}

          <EventRow code="FLR" iso={ind.flr.strongest?.peakTime}>
            {ind.flr.strongest ? (
              <>
                Strongest solar flare: class <span className="font-mono">{ind.flr.strongest.classType}</span>
                <span className="block text-sm text-ink-soft">
                  {ind.flr.count} flare{ind.flr.count > 1 ? 's' : ''}, {ind.flr.strongCount} of class M or X
                </span>
              </>
            ) : (
              `No solar flare ${range}`
            )}
          </EventRow>

          <EventRow code="GST" iso={ind.gst.latest?.startTime}>
            {ind.gst.kpMax != null ? (
              <>
                Geomagnetic storm, Kp <span className="font-mono">{ind.gst.kpMax}</span>
              </>
            ) : (
              `No geomagnetic storm ${range}`
            )}
          </EventRow>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => onModeChange(mode === 'live' ? 'history' : 'live')}>
            <History aria-hidden />
            {mode === 'live' ? 'Show past event (5 Sep 2026)' : 'Back to live data'}
          </Button>
          {offline && !state.checking && onRetry && (
            <Button variant="ghost" size="sm" onClick={onRetry}>
              <RefreshCw aria-hidden />
              Try again
            </Button>
          )}
        </div>

        <div className="grid gap-2 border-t border-hairline pt-4 text-sm text-ink-soft">
          <p>
            Reports solar events, not the dose you received. Experimental NASA research data; NOAA&apos;s Space Weather
            Prediction Center is the official source for forecasts.
          </p>
          {mode === 'live' && <p>The {LIVE_WINDOW_DAYS}-day window is a demonstration rule.</p>}
          <a className="underline underline-offset-3 inline-flex items-center gap-1 text-interactive" href={DONKI_PAGE} target="_blank" rel="noreferrer">
            Source: NASA DONKI
            <ExternalLink className="size-3.5" aria-hidden />
          </a>
        </div>
      </DialogContent>
    </Dialog>
  )
}
