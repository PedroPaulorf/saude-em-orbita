import {
  DONKI_PAGE,
  indicators,
  LIVE_WINDOW_DAYS,
  type DateWindow,
  type SpaceWeatherMode,
  type SpaceWeatherState,
} from '@/lib/donki'
import { utcDateTime, utcDay, utcTime } from '@/lib/utils'
import { Button } from './Button'
import { SourceBadge } from './SourceBadge'

/** "5 Sep" ou "10 Sep 2026", a partir de AAAA-MM-DD. */
const DAY = (date: string, withYear = false) => {
  const day = utcDay(`${date}T00:00:00Z`).replace(/^0/, '')
  return withYear ? `${day} ${date.slice(0, 4)}` : day
}

/** Horário em duas linhas, para a coluna da direita não espremer a descrição. */
function When({ iso }: { iso?: string }) {
  if (!iso) return <span className="h7-meta">—</span>
  return (
    <time className="h7-meta text-right whitespace-nowrap" dateTime={iso}>
      {utcDay(iso)}
      <br />
      {utcTime(iso)}
    </time>
  )
}

/** "in the last 7 days" na consulta ao vivo; datas explícitas numa cópia ou no modo histórico. */
function rangeLabel(w: DateWindow, isLive: boolean) {
  return isLive ? `in the last ${LIVE_WINDOW_DAYS} days` : `from ${DAY(w.startDate)} to ${DAY(w.endDate, true)}`
}

function statusLine(state: SpaceWeatherState) {
  const at = utcDateTime(state.snapshot.fetchedAt)
  switch (state.source) {
    case 'live':
      return `Updated ${at}`
    case 'history':
      return `Past event · saved copy from ${at}`
    default:
      return state.checking ? `Checking NASA DONKI… showing saved copy from ${at}` : `No connection · saved copy from ${at}`
  }
}

/**
 * Clima espacial com eventos reais do NASA DONKI, ligado ao risco de radiação.
 * Três indicadores: partículas solares (SEP, o principal), erupções (FLR) e tempestades (GST).
 * Sempre com o selo Live NASA data, o link da fonte e os limites declarados.
 * Sem evento, diz isso em uma linha; nunca esconde o cartão.
 */
export function SpaceWeatherCard({
  state,
  mode,
  onModeChange,
  onRetry,
  onOpenRadiationRisk,
}: {
  state: SpaceWeatherState
  mode: SpaceWeatherMode
  onModeChange: (m: SpaceWeatherMode) => void
  onRetry?: () => void
  onOpenRadiationRisk?: () => void
}) {
  const { snapshot } = state
  const ind = indicators(snapshot)
  const range = rangeLabel(snapshot.window, state.source === 'live')
  const sep = ind.sep.featured
  const detections = ind.sep.count - ind.sep.modelCount

  return (
    <article className="h7-card" aria-busy={state.checking}>
      <div className="h7-card__head">
        <h3 className="h7-h3">{mode === 'history' ? 'Space weather · past event' : 'Space weather now'}</h3>
        <SourceBadge source="live" />
      </div>

      {mode === 'history' && (
        <p className="h7-sm">
          Recorded from {DAY(snapshot.window.startDate)} to {DAY(snapshot.window.endDate, true)}. Not current conditions.
        </p>
      )}

      {/* SEP: o indicador principal, ligado à radiação que chega à tripulação */}
      <div className="h7-event">
        <span className="h7-event__code">SEP</span>
        <span>
          {sep ? (
            <>
              Solar energetic particle event
              <span className="h7-meta block">
                {detections} detection{detections === 1 ? '' : 's'}
                {ind.sep.modelCount > 0 && `, ${ind.sep.modelCount} model forecast${ind.sep.modelCount === 1 ? '' : 's'}`}
                {sep.linked.length > 0 && ` · linked to ${sep.linked.join(' + ')}`}
              </span>
            </>
          ) : (
            `No solar particle event ${range}`
          )}
        </span>
        <When iso={sep?.time} />
      </div>

      {sep && (
        <div className="grid gap-2 border-l-2 border-line-subtle pl-4">
          {sep.alert?.summary && (
            <p className="h7-sm">
              <span className="h7-label">First alert · {utcDateTime(sep.alert.issued)}</span>
              <br />
              {sep.alert.summary.replace(/\s*Activity ID:.*$/, '')}
            </p>
          )}
          <div className="h7-row gap-x-4 gap-y-1">
            {sep.alert && (
              <a className="h7-link text-sm" href={sep.alert.url} target="_blank" rel="noreferrer">
                Original alert {sep.alert.id}
              </a>
            )}
            {onOpenRadiationRisk && (
              <button type="button" className="h7-link cursor-pointer text-sm underline" onClick={onOpenRadiationRisk}>
                Linked NASA risk: radiation
              </button>
            )}
          </div>
        </div>
      )}

      {/* FLR: contexto, erupções fortes podem vir com SEP */}
      <div className="h7-event">
        <span className="h7-event__code">FLR</span>
        <span>
          {ind.flr.strongest ? (
            <>
              Strongest solar flare: class {ind.flr.strongest.classType}
              <span className="h7-meta block">
                {ind.flr.count} flare{ind.flr.count > 1 ? 's' : ''}, {ind.flr.strongCount} of class M or X
              </span>
            </>
          ) : (
            `No solar flare ${range}`
          )}
        </span>
        <When iso={ind.flr.strongest?.peakTime} />
      </div>

      {/* GST: contexto, pouco efeito direto na saúde */}
      <div className="h7-event">
        <span className="h7-event__code">GST</span>
        <span>{ind.gst.kpMax != null ? `Geomagnetic storm, Kp ${ind.gst.kpMax}` : `No geomagnetic storm ${range}`}</span>
        <When iso={ind.gst.latest?.startTime} />
      </div>

      <p className="h7-meta">
        {statusLine(state)}
        {state.source !== 'live' && state.source !== 'history' && !state.checking && onRetry && (
          <>
            {' · '}
            <button type="button" className="h7-link cursor-pointer underline" onClick={onRetry}>
              Try again
            </button>
          </>
        )}
      </p>

      <div className="h7-row justify-between">
        {mode === 'live' ? (
          <span className="h7-sm">The {LIVE_WINDOW_DAYS}-day window is a demonstration rule.</span>
        ) : (
          <span />
        )}
        <Button className="min-h-9 px-3 text-sm" onClick={() => onModeChange(mode === 'live' ? 'history' : 'live')}>
          {mode === 'live' ? 'Show past event (5 Sep 2026)' : 'Back to live data'}
        </Button>
      </div>

      <hr className="h7-card__rule" />
      <p className="h7-sm">
        Reports solar events, not the dose you received. Experimental NASA research data; NOAA&apos;s Space Weather
        Prediction Center is the official source for forecasts.{' '}
        <a className="h7-link" href={DONKI_PAGE} target="_blank" rel="noreferrer">
          Source: NASA DONKI
        </a>
      </p>
    </article>
  )
}
