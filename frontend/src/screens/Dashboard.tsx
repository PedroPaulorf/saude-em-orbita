import { useMemo, useRef, useState } from 'react'
import { BodyFigure, Button, ReportCard, RiskCard, SourceBadge, SpaceWeatherCard, VitalCard } from '@/components/h7'
import { RADIATION_RISKS, REGION_RISKS } from '@/data/regions'
import { useSpaceWeather } from '@/lib/donki'
import { getBodyRegions, getTodayVitals } from '@/lib/health'
import type { BodyRegionId, Connection } from '@/types'

/**
 * Painel, opção A do design system: medidas à esquerda, figura do corpo no centro,
 * ação principal, clima espacial e relatório à direita. No celular as colunas empilham.
 */
export function Dashboard({ connection, onStartCheckIn }: { connection: Connection; onStartCheckIn: () => void }) {
  const vitals = useMemo(() => getTodayVitals(), [])
  const regions = useMemo(() => getBodyRegions(vitals), [vitals])
  const weather = useSpaceWeather()
  // O que está aberto no centro: uma região do corpo ou o risco de radiação (vindo do clima espacial).
  const [focus, setFocus] = useState<BodyRegionId | 'radiation' | null>(null)
  const bodyPanel = useRef<HTMLElement>(null)
  const region = focus === 'radiation' ? null : focus
  const riskGroup = focus === 'radiation' ? RADIATION_RISKS : focus ? REGION_RISKS[focus] : null

  function openRadiationRisk() {
    setFocus('radiation')
    bodyPanel.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <main className="h7-screen items-start max-md:px-6 lg:grid-cols-[300px_1fr] xl:grid-cols-[300px_1fr_380px]">
      <section className="h7-stack" aria-labelledby="today">
        <div className="h7-row justify-between">
          <h2 id="today" className="h7-h2">
            Today
          </h2>
          <SourceBadge source="simulated" />
        </div>
        {vitals.map((v) => (
          <VitalCard key={v.id} vital={v} />
        ))}
      </section>

      <section ref={bodyPanel} className="h7-panel grid justify-items-center gap-6 max-md:p-4" aria-label="Body">
        <BodyFigure regions={regions} selected={region} onSelect={setFocus} />
        {riskGroup ? (
          <RiskCard key={focus} group={riskGroup} />
        ) : (
          <p className="h7-sm">Select a body region to see the linked NASA risk.</p>
        )}
      </section>

      <section className="h7-stack lg:col-span-2 xl:col-span-1">
        <Button variant="primary" block onClick={onStartCheckIn}>
          Start check-in
        </Button>
        <SpaceWeatherCard
          state={weather.state}
          mode={weather.mode}
          onModeChange={weather.setMode}
          onRetry={weather.refresh}
          onOpenRadiationRisk={openRadiationRisk}
        />
        <ReportCard vitals={vitals} connection={connection} />
      </section>
    </main>
  )
}
