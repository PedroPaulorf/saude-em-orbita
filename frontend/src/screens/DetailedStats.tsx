import { useEffect, useMemo } from 'react'
import { PersonalRecords } from './Stats'
import type { Profile, Symptom } from '@/lib/api'
import type { CheckIn } from '@/lib/storage'
import { Cpu, PenLine } from 'lucide-react'
import { BodyAvatar } from '@/components/app/BodyAvatar'
import { RegionPanel } from '@/components/app/RegionPanel'
import { StatusBadge } from '@/components/app/StatusBadge'
import { RADIATION_RISKS, REGION_RISKS } from '@/data/regions'
import { getBodyRegions, getTodayVitals, normalizeRegion } from '@/lib/health'
import { VITAL_REGION } from '@/lib/notes'
import { navigate } from '@/lib/route'
import { usePatterns } from '@/lib/usePrevention'
import { cn } from '@/lib/utils'
import type { BodyRegionId } from '@/types'

/*
  Detailed stats (plano v2, 7.3): a tela focada no avatar.
  Desktop: medidas de hoje à esquerda, avatar grande no centro, painel da região à direita.
  A região escolhida fica na URL (#/stats?region=head), então a Home e o clima espacial podem abrir
  esta tela já com uma região ou com o risco de radiação (?risk=radiation).
*/

/** Em telas estreitas o painel fica embaixo do avatar: rola até ele quando a pessoa escolhe uma região. */
function revealPanel() {
  if (window.matchMedia('(max-width: 1279px)').matches) {
    document.getElementById('region-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

export function DetailedStats({ params, profile, checkins, symptoms, truncated, historyLoaded }: { params: URLSearchParams; profile: Profile; checkins: CheckIn[]; symptoms: Symptom[]; truncated: boolean; historyLoaded: boolean }) {
  const vitals = useMemo(() => getTodayVitals(profile, checkins), [profile, checkins])
  const regions = useMemo(() => getBodyRegions(vitals), [vitals])
  // Padrões ativos com sinal de medida presente em cada região (para "Part of an active pattern").
  const activeByRegion = usePatterns()
    .filter((p) => p.active)
    .flatMap((p) => p.signs.filter((s) => s.state === 'present' && s.measure).map((s) => ({ region: VITAL_REGION[s.measure!], title: p.def.title })))

  const regionParam = params.get('region') as BodyRegionId | null
  const focus: BodyRegionId | 'radiation' | null =
    params.get('risk') === 'radiation' ? 'radiation' : regionParam ? normalizeRegion(regionParam) : null
  const selected = focus === 'radiation' ? null : focus

  // Chegou de outra tela já com região ou risco: mostra o painel.
  useEffect(() => {
    // depois do "volta ao topo" que o App faz ao trocar de tela
    if (focus) requestAnimationFrame(() => requestAnimationFrame(revealPanel))
    // só na primeira montagem
    // oxlint-disable-next-line react/exhaustive-deps
  }, [])

  function select(id: BodyRegionId) {
    navigate('/stats', { region: id }, { replace: true })
    requestAnimationFrame(revealPanel)
  }

  return (
    <div className="mx-auto max-w-[1360px] px-4 pt-4 pb-8 md:px-8">
      <h1 className="mb-4 font-display text-2xl font-semibold">Detailed stats</h1>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.45fr)_minmax(0,1.1fr)] xl:items-start">
        {/* Centro: avatar */}
        <section
          aria-labelledby="body-title"
          className="flex min-w-0 flex-col gap-4 rounded-xl border border-hairline bg-surface-1 p-5 xl:order-2"
        >
          <header className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="body-title" className="font-display text-lg font-semibold">
              Body map
            </h2>
            <p className="text-sm text-ink-soft">Profile body figure · {profile.bodyModel}</p>
          </header>
          <div className="flex flex-1 items-center justify-center pt-2 [--avatar-h:320px] sm:[--avatar-h:440px] xl:[--avatar-h:min(54vh,470px)]">
            <BodyAvatar regions={regions} selected={selected} onSelect={select} gender={profile.bodyModel} className="w-full" />
          </div>
          <p className="text-center text-sm text-ink-soft">Select a region, or use Tab and Enter.</p>
        </section>

        {/* Direita: painel da região */}
        <RegionPanel
          focus={focus}
          regions={regions}
          vitals={vitals}
          riskGroups={REGION_RISKS}
          radiation={RADIATION_RISKS}
          patternTitles={selected ? [...new Set(activeByRegion.filter((x) => x.region === selected).map((x) => x.title))] : []}
          className="xl:order-3"
        />

        {/* Esquerda: as quatro medidas de hoje */}
        <section
          aria-labelledby="measures-title"
          className="flex min-w-0 flex-col gap-1 rounded-xl border border-hairline bg-surface-1 p-5 lg:col-span-2 xl:order-1 xl:col-span-1"
        >
          <h2 id="measures-title" className="font-display text-lg font-semibold">
            Today&apos;s measures
          </h2>
          <p className="mb-1 text-sm text-ink-soft">
            {vitals.filter(v => v.observed !== false).length} recorded measures from {new Set(vitals.map((v) => v.source)).size} sources, in one place. Device feeds are
            simulated in this demo.
          </p>
          <ul className="grid sm:grid-cols-2 sm:gap-x-6 xl:grid-cols-1">
            {vitals.map((v) => {
              const region = VITAL_REGION[v.id]
              const active = selected === region
              return (
                <li key={v.id} className="border-t border-hairline first:border-t-0 sm:[&:nth-child(2)]:border-t-0 xl:[&:nth-child(2)]:border-t">
                  <button
                    type="button"
                    onClick={() => select(region)}
                    aria-pressed={active}
                    className={cn(
                      '-mx-2 grid w-[calc(100%+1rem)] gap-1 rounded-lg px-2 py-3 text-left transition-colors hover:bg-surface-2',
                      active && 'bg-surface-2',
                    )}
                  >
                    <span className="flex items-center justify-between gap-2">
                      <span className="text-sm text-ink-soft">{v.label}</span>
                      <>{v.observed === false || v.comparable === false ? <span className="text-xs text-ink-soft">{v.observed === false ? 'No measurement recorded' : 'No personal baseline available'}</span> : <StatusBadge status={v.status} />}</>
                    </span>
                    <span className="font-mono text-[40px] leading-none text-ink">
                      {v.value}
                      <span className="ml-1.5 text-base text-ink-soft">{v.unit}</span>
                    </span>
                    <span className="font-mono text-[13px] text-ink-soft">
                      baseline {v.baseline} · <span className="text-ink">{v.delta}</span>
                    </span>
                    <span className="mt-0.5 inline-flex items-center gap-1.5 text-xs text-ink-soft">
                      {v.input === 'device' ? <Cpu className="size-3.5" aria-hidden /> : <PenLine className="size-3.5" aria-hidden />}
                      {v.source}
                      <span className="sr-only">{v.input === 'device' ? ', device feed' : ', from your check-up'}</span>
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </section>
      </div>
      {selected && <PersonalRecords profile={profile} checkins={checkins} symptoms={symptoms} region={selected} truncated={truncated} historyLoaded={historyLoaded} />}
    </div>
  )
}
