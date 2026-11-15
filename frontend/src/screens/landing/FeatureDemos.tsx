import { useEffect, useRef, useState } from 'react'
import { Bluetooth, ChevronLeft, ChevronRight, HeartPulse, Plus } from 'lucide-react'
import { Panel, PanelHeader } from '@/components/app/Panel'
import { Button } from '@/components/ui/button'
import { displayDate, monthCells, shiftMonth } from '@/lib/menstrual'
import { cn } from '@/lib/utils'
import { AppWindow, SimulatedChip } from './app-bits'
import { ScrollTrigger, useScene } from './motion'

/*
  Duas telas do app com dados simulados, para o bloco de recursos: o sensor Bluetooth de
  frequência cardíaca (components/app/BluetoothConnect) e o calendário menstrual
  (screens/MenstrualCalendar). Mesmos componentes, classes e textos; nada fala com o servidor
  nem com um aparelho de verdade, e nada é salvo.
*/

type Phase = 'disconnected' | 'connecting' | 'connected'

/** Sensor Bluetooth simulado: conecta, mostra a leitura mudando e "salva" quando a pessoa pede. */
export function WatchPanel() {
  const ref = useRef<HTMLDivElement>(null)
  const [phase, setPhase] = useState<Phase>('disconnected')
  const [bpm, setBpm] = useState(72)
  const [packets, setPackets] = useState(0)
  const [saved, setSaved] = useState<number | null>(null)

  // Conecta sozinho quando o bloco entra na tela (só com movimento permitido); o botão faz o mesmo.
  useScene(ref, '', ({ root }) => {
    ScrollTrigger.create({ trigger: root, start: 'top 60%', once: true, onEnter: () => setPhase((p) => (p === 'disconnected' ? 'connecting' : p)) })
  })
  useEffect(() => {
    if (phase !== 'connecting') return
    const t = setTimeout(() => setPhase('connected'), 900)
    return () => clearTimeout(t)
  }, [phase])
  useEffect(() => {
    if (phase !== 'connected') return
    const t = setInterval(() => {
      setBpm((b) => Math.min(84, Math.max(64, b + Math.round(Math.random() * 4 - 2))))
      setPackets((n) => n + 1)
    }, 1000)
    return () => clearInterval(t)
  }, [phase])

  const disconnect = () => {
    setPhase('disconnected')
    setPackets(0)
    setSaved(null)
  }

  return (
    <div ref={ref} className="mx-auto max-w-md">
      <AppWindow className="rotate-1">
        <Panel className="min-h-[490px]">
          <PanelHeader icon={<Bluetooth />} tone="blue" title="Connect a Bluetooth heart-rate sensor" subtitle="Live heart rate · compatible BLE transmitters" />
          <div className="flex flex-wrap gap-2">
            <Button disabled={phase !== 'disconnected'} onClick={() => setPhase('connecting')}>
              <Bluetooth aria-hidden />
              {phase === 'connecting' ? 'Connecting…' : 'Connect Bluetooth'}
            </Button>
            {phase !== 'disconnected' && (
              <Button variant="outline" onClick={disconnect}>
                {phase === 'connecting' ? 'Cancel connection' : 'Disconnect Bluetooth'}
              </Button>
            )}
          </div>
          <p className="text-sm">
            Bluetooth status: {phase}
            {phase === 'connected' && ' · Simulated sensor'}
          </p>
          {phase === 'connected' && (
            <>
              <div className="grid gap-2 rounded-lg bg-surface-2 p-4">
                <p className="inline-flex items-center gap-2 font-semibold">
                  <HeartPulse aria-hidden className="text-flag-ink" />
                  <span className="font-mono text-2xl">{bpm}</span> bpm
                </p>
                <p className="text-sm text-ink-soft">Fresh reading · Sensor contact: detected</p>
                <p className="text-xs text-ink-soft">{packets} valid packets received. General heart rate, not a resting measurement.</p>
              </div>
              <Button className="h-auto min-h-11 max-w-full self-start py-2 whitespace-normal" onClick={() => setSaved(bpm)}>
                Save current Bluetooth reading
              </Button>
            </>
          )}
          {saved != null && <p className="text-sm">Bluetooth reading saved: {saved} bpm. Not medically evaluated.</p>}
          <div className="mt-auto">
            <SimulatedChip />
          </div>
        </Panel>
      </AppWindow>
    </div>
  )
}

const iso = (d: Date) => d.toISOString().slice(0, 10)

/** Calendário menstrual simulado: os dias marcados são os que a pessoa toca; não há previsão nenhuma. */
export function CycleCalendar() {
  const [today] = useState(() => iso(new Date()))
  const [month, setMonth] = useState(today.slice(0, 7))
  // Exemplo inicial: cinco dias registrados, terminando há pouco mais de uma semana.
  const [days, setDays] = useState(() => new Set(Array.from({ length: 5 }, (_, i) => iso(new Date(Date.parse(today) - (12 - i) * 86400000)))))
  const cells = monthCells(month)
  const monthLabel = new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(month + '-01T00:00:00Z'))
  const toggle = (date: string) =>
    setDays((prev) => {
      const next = new Set(prev)
      if (!next.delete(date)) next.add(date)
      return next
    })

  return (
    <div className="mx-auto max-w-md">
      <AppWindow className="-rotate-1">
        <Panel aria-label="Month calendar" className="p-3 sm:p-5">
          <div className="flex items-center justify-between gap-2">
            <Button variant="ghost" size="icon" aria-label="Previous month" onClick={() => setMonth(shiftMonth(month, -1))}>
              <ChevronLeft />
            </Button>
            <p className="font-display text-lg font-semibold" aria-live="polite">
              {monthLabel}
            </p>
            <Button variant="ghost" size="icon" aria-label="Next month" disabled={month >= today.slice(0, 7)} onClick={() => setMonth(shiftMonth(month, 1))}>
              <ChevronRight />
            </Button>
          </div>
          <table className="w-full table-fixed border-separate border-spacing-0.5 text-center sm:border-spacing-1" aria-label={monthLabel}>
            <thead>
              <tr>
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
                  <th key={day} scope="col" className="py-2 text-xs font-normal text-ink-soft">
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: cells.length / 7 }, (_, row) => (
                <tr key={row}>
                  {cells.slice(row * 7, row * 7 + 7).map((date, col) => {
                    const recorded = !!date && days.has(date)
                    return (
                      <td key={col} className="p-0">
                        {date && (
                          <button
                            type="button"
                            disabled={date > today}
                            aria-label={`${displayDate(date)}${recorded ? ', recorded period' : ''}${date === today ? ', today' : ''}`}
                            aria-pressed={recorded}
                            aria-current={date === today ? 'date' : undefined}
                            onClick={() => toggle(date)}
                            className={cn(
                              'flex aspect-square min-h-11 w-full min-w-0 items-center justify-center rounded-lg border text-sm transition-colors disabled:opacity-40',
                              recorded ? 'border-interactive bg-interactive font-semibold text-sa-deep' : 'border-transparent bg-surface-2 hover:border-interactive',
                              date === today && 'ring-2 ring-interactive ring-offset-2 ring-offset-surface-1',
                            )}
                          >
                            {Number(date.slice(-2))}
                          </button>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-xs text-ink-soft">
            <span className="mr-1 inline-block size-2 rounded-full bg-interactive" /> Recorded period. A ring marks today (UTC). Select a day to add or edit.
          </p>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Button className="h-auto min-h-11 whitespace-normal" onClick={() => setDays((prev) => new Set(prev).add(today))}>
              <Plus aria-hidden /> Record a period
            </Button>
            <SimulatedChip />
          </div>
        </Panel>
      </AppWindow>
    </div>
  )
}
