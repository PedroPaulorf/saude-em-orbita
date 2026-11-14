import { useMemo, useRef, useState } from 'react'
import { AvatarCard } from '@/components/app/AvatarCard'
import { BehavioralCheckInCard, HealthCheckUpCard } from '@/components/app/CheckUpCards'
import { HealthNotes } from '@/components/app/HealthNotes'
import { ReportCompact, ReportDialog } from '@/components/app/Report'
import { RoutineCard } from '@/components/app/RoutineCard'
import { SpaceWeatherCompact, SpaceWeatherDialog } from '@/components/app/SpaceWeather'
import { indicators, useSpaceWeather } from '@/lib/donki'
import { getBodyRegions, getTodayVitals } from '@/lib/health'
import { buildNotes } from '@/lib/notes'
import { usePatterns } from '@/lib/usePrevention'
import { latestCheckIn } from '@/lib/storage'
import { isTodayUtc, utcDay } from '@/lib/utils'
import { addWater, WATER_GOAL } from '@/lib/water'
import type { GameSummary } from '@/lib/game'
import type { Connection } from '@/types'

/*
  Home (plano v2, 7.1). Em 1280 px ou mais, três colunas:
    esquerda: Health check-up, Behavioral check-in · centro: avatar · direita: rotina, clima espacial, relatório
  e a faixa Health notes embaixo. A ordem do DOM é a do celular:
    avatar, rotina, check-ups, notas, clima espacial, relatório.
  Na grade larga, cada cartão da esquerda ocupa 3 de 6 linhas e cada um da direita 2 de 6,
  então as colunas fecham na mesma altura.
*/

/** Estado de hoje de cada check-up, a partir do último registro de cada tipo. */
function todayStatus() {
  const health = latestCheckIn('health')
  const behavioral = latestCheckIn('behavioral')
  return {
    healthDoneAt: isTodayUtc(health?.at) ? health!.at : undefined,
    behavioralDoneAt: isTodayUtc(behavioral?.at) ? behavioral!.at : undefined,
    behavioralAnswers: behavioral?.behavioral,
  }
}

export function Home({ connection, game }: { connection: Connection; game: GameSummary }) {
  const vitals = useMemo(() => getTodayVitals(), [])
  const regions = useMemo(() => getBodyRegions(vitals), [vitals])
  const today = useMemo(() => todayStatus(), [])
  const weather = useSpaceWeather()
  const activePatterns = usePatterns().filter((p) => p.active)
  const water = game.today.water
  const [weatherOpen, setWeatherOpen] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)
  const waterButton = useRef<HTMLButtonElement>(null)

  const healthDone = !!today.healthDoneAt
  const behavioralDone = !!today.behavioralDoneAt
  // O amarelo vai para o primeiro check-up pendente; com os dois feitos, nenhum botão da Home é amarelo.
  const primary = !healthDone ? 'health' : !behavioralDone ? 'behavioral' : null

  const sep = weather.mode === 'live' ? indicators(weather.state.snapshot).sep.featured : undefined
  const notes = buildNotes({
    vitals,
    healthDoneToday: healthDone,
    sepTime: sep?.time,
    sepDay: sep ? utcDay(sep.time) : undefined,
    water: { servings: water, goal: WATER_GOAL },
    patterns: activePatterns.map((p) => ({ id: p.def.id, title: p.def.title, present: p.present, total: p.total, status: p.status })),
  })

  function goToRoutine() {
    const card = document.getElementById('routine')
    card?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    waterButton.current?.focus({ preventScroll: true })
  }

  return (
    <div className="mx-auto max-w-[1360px] px-4 pt-4 pb-6 md:px-8">
      <h1 className="sr-only">Home</h1>
      <div className="grid gap-4 md:grid-cols-2 xl:gap-3.5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.75fr)_minmax(0,1fr)] xl:grid-rows-[repeat(6,auto)_auto]">
        <AvatarCard
          vitals={vitals}
          regions={regions}
          className="md:col-span-2 xl:col-span-1 xl:col-start-2 xl:row-span-6 xl:row-start-1"
        />
        <RoutineCard
          ref={waterButton}
          today={game.today}
          onWater={(d) => addWater(d)}
          className="md:col-span-2 xl:col-span-1 xl:col-start-3 xl:row-span-2 xl:row-start-1"
        />
        <HealthCheckUpCard
          vitals={vitals}
          doneAt={today.healthDoneAt}
          primary={primary === 'health'}
          className="xl:col-start-1 xl:row-span-3 xl:row-start-1"
        />
        <BehavioralCheckInCard
          answers={today.behavioralAnswers}
          doneAt={today.behavioralDoneAt}
          primary={primary === 'behavioral'}
          className="xl:col-start-1 xl:row-span-3 xl:row-start-4"
        />
        <HealthNotes
          notes={notes}
          onWeather={() => setWeatherOpen(true)}
          onRoutine={goToRoutine}
          className="md:col-span-2 xl:col-span-3 xl:row-start-7"
        />
        <SpaceWeatherCompact
          state={weather.state}
          onDetails={() => setWeatherOpen(true)}
          className="xl:col-start-3 xl:row-span-2 xl:row-start-3"
        />
        <ReportCompact
          vitals={vitals}
          patterns={activePatterns}
          connection={connection}
          onOpen={() => setReportOpen(true)}
          className="xl:col-start-3 xl:row-span-2 xl:row-start-5"
        />
      </div>

      <SpaceWeatherDialog
        open={weatherOpen}
        onOpenChange={setWeatherOpen}
        state={weather.state}
        mode={weather.mode}
        onModeChange={weather.setMode}
        onRetry={weather.refresh}
      />
      <ReportDialog open={reportOpen} onOpenChange={setReportOpen} vitals={vitals} patterns={activePatterns} connection={connection} />
    </div>
  )
}
