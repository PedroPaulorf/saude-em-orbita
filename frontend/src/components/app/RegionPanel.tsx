import { useState } from 'react'
import { ArrowRight, ExternalLink, MousePointerClick, Orbit, ShieldPlus } from 'lucide-react'
import hrp from '@/data/hrp-risks.json'
import type { RiskGroup } from '@/data/regions'
import { VITAL_REGION } from '@/lib/notes'
import { REGION_NAMES, summarySentence } from '@/lib/present'
import { href } from '@/lib/route'
import { cn } from '@/lib/utils'
import type { BodyRegion, BodyRegionId, Vital } from '@/types'
import { Clamped } from './Clamped'
import { LiveTag } from './SourceTag'
import { StatusBadge } from './StatusBadge'
import { AssessmentDetails, MeasurementProvenance } from './MeasurementDetails'

const RISKS = new Map(hrp.risks.map((r) => [r.id, r]))


/** Riscos do NASA HRP ligados à região, texto original em inglês com link para a fonte. */
function RiskSection({ group }: { group: RiskGroup }) {
  const risks = group.risks.map((id) => RISKS.get(id)).filter((r) => r != null)
  const [openId, setOpenId] = useState(risks[0]?.id)
  const risk = risks.find((r) => r.id === openId) ?? risks[0]
  if (!risk) return null
  return (
    <section aria-labelledby="risks-title" className="grid gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 id="risks-title" className="text-xs font-semibold tracking-[0.08em] text-ink-soft uppercase">
          Linked NASA risks
        </h3>
        <LiveTag href={risk.url} />
      </div>
      {risks.length > 1 && (
        <div role="tablist" aria-label="Linked NASA risks" className="flex flex-wrap gap-1.5">
          {risks.map((r) => (
            <button
              key={r.id}
              type="button"
              role="tab"
              aria-selected={r.id === risk.id}
              aria-controls="risk-panel"
              onClick={() => setOpenId(r.id)}
              className={cn(
                'min-h-9 rounded-full border px-3 text-left text-sm font-semibold transition-colors',
                r.id === risk.id
                  ? 'border-ink bg-panel text-ink'
                  : 'border-hairline-strong text-ink-soft hover:bg-surface-2 hover:text-ink',
              )}
            >
              {r.title.replace(/^Risks? (of|from) /, '').replace(/^Inadequate /, '')}
            </button>
          ))}
        </div>
      )}
      <div id="risk-panel" role={risks.length > 1 ? 'tabpanel' : undefined} className="grid gap-3" aria-live="polite">
        <p className="font-display text-[17px] leading-snug font-semibold">{risk.title}</p>
        <div className="grid gap-1">
          <p className="text-sm font-semibold text-ink-soft">Top risks</p>
          <Clamped key={`${risk.id}-top`} text={risk.topRisks} />
        </div>
        <div className="grid gap-1">
          <p className="text-sm font-semibold text-ink-soft">What can be done</p>
          <Clamped key={`${risk.id}-what`} text={risk.whatCanBeDone} />
        </div>
        <p className="text-sm text-ink-soft">
          NASA Human Research Program.{' '}
          <a href={risk.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-interactive underline underline-offset-3">
            Source: nasa.gov
            <ExternalLink className="size-3.5" aria-hidden />
          </a>
        </p>
      </div>
    </section>
  )
}

/** Medida ligada à região: valor, linha de base, diferença, estado e a regra quando há sinalização. */
function LinkedMeasure({ v }: { v: Vital }) {
  return (
    <li className="grid gap-1.5 rounded-lg bg-surface-2/60 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-semibold">{v.label}</span>
        {v.observed === false || v.comparable === false ? <span className="text-xs text-ink-soft">{v.observed === false ? 'No measurement recorded' : 'No personal baseline available'}</span> : <StatusBadge status={v.status} />}
      </div>
      <p className="font-mono text-sm text-ink-soft">
        <span className="text-2xl text-ink">{v.value}</span> {v.unit}
        <span className="ml-2">
          baseline {v.baseline} · {v.delta}
        </span>
      </p>
      {v.observed !== false && <>
        <MeasurementProvenance provenance={v.provenance} at={v.at} sync={v.recordSync} />
        <p className="text-xs text-ink-soft">{v.assessment ? 'Assessment saved with this record' : 'Local comparison preview'}</p>
        <AssessmentDetails assessment={v.assessment} localRule={v.assessment ? undefined : v.rule} recordId={v.recordId} clientId={v.clientId} />
      </>}
    </li>
  )
}

/** "Chest · cardiovascular" → "Chest · Cardiovascular" para título. */
function regionTitle(region: BodyRegion | undefined, id: BodyRegionId) {
  if (!region?.name) return REGION_NAMES[id]
  const [a, b] = region.name.split(' · ')
  return b ? `${a} · ${b[0].toUpperCase()}${b.slice(1)}` : a
}

/**
 * Painel da direita no Detailed stats: a região escolhida (estado, medidas ligadas, riscos da NASA),
 * o risco de radiação vindo do clima espacial, ou o resumo geral quando nada está escolhido.
 */
export function RegionPanel({
  focus,
  regions,
  vitals,
  riskGroups,
  radiation,
  patternTitles = [],
  className,
}: {
  focus: BodyRegionId | 'radiation' | null
  regions: BodyRegion[]
  vitals: Vital[]
  riskGroups: Record<BodyRegionId, RiskGroup>
  radiation: RiskGroup
  /** Padrões ativos com sinal nesta região. */
  patternTitles?: string[]
  className?: string
}) {
  const wrap = cn('flex min-w-0 scroll-mt-20 flex-col gap-5 rounded-xl border border-hairline bg-surface-1 p-5 md:p-6', className)

  if (focus === 'radiation') {
    return (
      <section id="region-panel" aria-labelledby="panel-title" className={wrap} tabIndex={-1}>
        <header className="flex items-start gap-3">
          <Orbit className="mt-1 size-5 shrink-0 text-interactive" aria-hidden />
          <div>
            <h2 id="panel-title" className="font-display text-xl font-semibold">
              {radiation.title}
            </h2>
            <p className="mt-1 text-sm text-ink-soft">Linked from space weather. NASA DONKI reports solar events, not the dose you received.</p>
          </div>
        </header>
        <RiskSection key="radiation" group={radiation} />
      </section>
    )
  }

  if (!focus) {
    const off = vitals.filter((v) => v.status !== 'baseline')
    return (
      <section id="region-panel" aria-labelledby="panel-title" className={wrap} tabIndex={-1}>
        <header>
          <p className="text-xs font-semibold tracking-[0.08em] text-ink-soft uppercase">Overview</p>
          <h2 id="panel-title" className="mt-1 font-display text-xl font-semibold">
            {summarySentence(vitals)}
          </h2>
        </header>
        {off.length > 0 && (
          <ul className="grid gap-2">
            {off.map((v) => (
              <LinkedMeasure key={v.id} v={v} />
            ))}
          </ul>
        )}
        <p className="flex items-center gap-2 text-ink-soft">
          <MousePointerClick className="size-5 shrink-0 text-interactive" aria-hidden />
          Select a body region to see its measures and the linked NASA risks.
        </p>
      </section>
    )
  }

  const region = regions.find((r) => r.id === focus)
  const linked = vitals.filter((v) => VITAL_REGION[v.id] === focus)
  return (
    <section id="region-panel" aria-labelledby="panel-title" className={wrap} tabIndex={-1}>
      <header className="flex flex-wrap items-start justify-between gap-2">
        <h2 id="panel-title" className="font-display text-xl font-semibold">
          {regionTitle(region, focus)}
        </h2>
        {region?.observed === false || region?.comparable === false ? <span className="text-sm text-ink-soft">{region?.stateText}</span> : <StatusBadge status={region?.status ?? 'baseline'} />}
      </header>
      {patternTitles.length > 0 && (
        <a
          href={href('/prevention')}
          className="flex items-center gap-2 rounded-lg border border-hairline-strong px-3 py-2.5 text-[15px] text-ink no-underline hover:bg-surface-2"
        >
          <ShieldPlus className="size-4.5 shrink-0 text-brand" aria-hidden />
          <span className="flex-1">Part of an active pattern: {patternTitles.join(', ')}</span>
          <ArrowRight className="size-4 text-ink-soft" aria-hidden />
        </a>
      )}
      {linked.length > 0 ? (
        <ul className="grid gap-2" aria-label="Linked measures">
          {linked.map((v) => (
            <LinkedMeasure key={v.id} v={v} />
          ))}
        </ul>
      ) : (
        <p className="text-sm text-ink-soft">No daily measure is linked to this region yet.</p>
      )}
      <RiskSection key={focus} group={riskGroups[focus]} />
    </section>
  )
}
