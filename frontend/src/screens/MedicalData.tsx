import { useState } from 'react'
import { Database } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Panel, PanelHeader } from '@/components/app/Panel'
import references from '@/data/medical-references.json'
import { loadCheckIns, useCheckInsVersion } from '@/lib/storage'
import { API_CONFIGURED, medicalRequest, retryRejected, serverHistory, type ServerCheckIn } from '@/lib/sync'
import type { Observation } from '@/lib/sync-core'

interface SimulationResult {
  id: string
  result: { notice: string; events: { mean: number; p05: number; p95: number }; resources: { mean: number }; resourceShortfallFraction: number }
}

function Observations({ items }: { items: Observation[] }) {
  return <ul className="grid gap-3">{items.map((o) => <li key={o.metric} className="rounded-lg bg-surface-2 p-3 text-sm">
    <p className="font-semibold">{o.metric}: {o.value} {o.unit} · {o.status}</p>
    <p className="text-ink-soft">{o.explanation}</p>
    <p className="mt-1 text-ink-soft">{o.method} · quality: {o.quality} · {new Date(o.observedAt).toLocaleString()}</p>
    <p className="break-words text-xs text-ink-soft">Rule: {o.ruleVersion ?? 'not evaluated'} · baseline: {o.baselineVersion ?? 'unknown'}</p>
  </li>)}</ul>
}

export function MedicalData() {
  useCheckInsVersion()
  const records = loadCheckIns()
  const entries = records.flatMap((r) => r.sync ? [r.sync] : [])
  const pending = records.filter((r) => r.sync?.state !== 'synced').length
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [history, setHistory] = useState<ServerCheckIn[] | null>(null)
  const [simulation, setSimulation] = useState<SimulationResult | null>(null)
  const [days, setDays] = useState(180)
  const [crewSize, setCrewSize] = useState(4)
  const [rate, setRate] = useState(0.001)
  const [resources, setResources] = useState(2)

  async function synchronize() {
    setBusy(true); setError('')
    try { await retryRejected(); setHistory(await serverHistory()) }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not reach server.') }
    finally { setBusy(false) }
  }

  async function runSimulation() {
    setBusy(true); setError(''); setSimulation(null)
    try {
      const response = await medicalRequest('/simulations', { method: 'POST', body: JSON.stringify({
        seed: 42, trials: 2000, crewSize, days, availableResources: resources,
        conditions: [{ id: 'hypothetical-event', ratePerPersonDay: rate, resourcesPerEvent: 1 }],
      }) })
      if (!response.ok) throw new Error(`Scenario rejected (HTTP ${response.status}). Check the input limits.`)
      setSimulation(await response.json())
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Simulation unavailable.') }
    finally { setBusy(false) }
  }

  const latest = [...entries].reverse().find((e) => e.observations?.length)
  return <div className="mx-auto grid w-full max-w-4xl gap-5 px-4 py-6 md:px-8">
    <a href="#/" className="font-semibold text-interactive underline">Back to Home</a>
    <h1 className="font-display text-3xl font-semibold">Medical data & sources</h1>
    <Panel>
      <PanelHeader icon={<Database />} title="Check-up storage" />
      <p className="text-sm text-ink-soft">{records.length} local records · {pending} awaiting server confirmation.</p>
      <p className="text-sm text-ink-soft">{API_CONFIGURED ? 'Check-ups are saved locally first and retried with the same identifier. Server storage does not mean medical review or transmission to Earth.' : 'Local mode. Configure the Health7 API to store check-ups in the shared database.'}</p>
      <Button disabled={!API_CONFIGURED || busy} onClick={() => void synchronize()} className="self-start">{busy ? 'Working…' : 'Sync & load server history'}</Button>
      {entries.filter((e) => e.error).map((e) => <p key={e.payload.clientId} role="status" className="text-sm text-flag-ink">{e.error}</p>)}
      {error && <p role="alert" className="text-sm text-flag-ink">{error}</p>}
      {latest?.observations && <details><summary className="cursor-pointer font-semibold">Latest stored assessment (available locally)</summary><Observations items={latest.observations} /></details>}
      {history && <details open><summary className="cursor-pointer font-semibold">Server history · {history.length} latest records</summary>
        <p className="my-2 text-sm text-ink-soft">Includes other devices. This view does not replace the history used by your local dashboard.</p>
        {history.map((record) => <details key={record.id} className="border-t border-hairline py-2">
          <summary className="cursor-pointer text-sm">{new Date(record.at).toLocaleString()} · {Object.keys(record.vitals).length ? 'Health' : 'Behavioral'} check-in</summary>
          <Observations items={record.observations} />
          {!record.observations.length && <p className="text-sm text-ink-soft">Self-report retained without a medical score: {Object.entries(record.behavioral).map(([key, value]) => `${key} ${value}/5`).join(', ')}.</p>}
        </details>)}
      </details>}
    </Panel>
    <Panel>
      <PanelHeader title="NASA research references" />
      <p className="text-sm text-ink-soft">Architecture and methodology references. They do not validate the demonstration thresholds, prevention patterns or chat.</p>
      <ul className="grid gap-3">{references.map((ref) => <li key={ref.id}>
        <a className="font-semibold text-interactive underline" href={`https://ntrs.nasa.gov/citations/${ref.id}`} target="_blank" rel="noreferrer">{ref.topic} · {ref.title}</a>
        <p className="text-sm text-ink-soft">{ref.summary}</p>
      </li>)}</ul>
      <p className="text-xs text-ink-soft">Reference summaries are bundled with the app; opening the original NTRS documents needs a connection.</p>
    </Panel>
    <Panel>
      <PanelHeader title="Educational mission scenario" subtitle="Inspired by Monte Carlo methodology; not NASA IMM." />
      <p className="text-sm text-ink-soft">Hypothetical independent events with a constant rate and one resource unit per event. These numbers are not medical incidence data. This scenario is separate from your check-ups.</p>
      <form onSubmit={(event) => { event.preventDefault(); void runSimulation() }} className="grid gap-3 sm:grid-cols-2">
        {[
          { label: 'Mission days', value: days, set: setDays, min: 1, max: 1000, step: 1 },
          { label: 'Crew size', value: crewSize, set: setCrewSize, min: 1, max: 12, step: 1 },
          { label: 'Hypothetical events / person / day', value: rate, set: setRate, min: 0, max: 0.01, step: 0.0001 },
          { label: 'Available resource units', value: resources, set: setResources, min: 0, max: 1000000, step: 1 },
        ].map((field) => <label key={field.label} className="grid gap-1 text-sm font-semibold">{field.label}<input required type="number" min={field.min} max={field.max} step={field.step} value={Number.isNaN(field.value) ? '' : field.value} onChange={(event) => field.set(event.target.valueAsNumber)} className="h-11 min-w-0 rounded-lg border border-hairline bg-ground px-3 font-mono" /></label>)}
        <Button type="submit" disabled={!API_CONFIGURED || busy} className="self-start justify-self-start">Simulate & save scenario</Button>
      </form>
      {!API_CONFIGURED && <p className="text-sm text-ink-soft">Connect the Health7 API to run and retain scenarios.</p>}
      {simulation && <div role="status" className="grid gap-2 rounded-lg bg-surface-2 p-3 text-sm">
        <p>{simulation.result.notice}</p>
        <p>Mean events: {simulation.result.events.mean.toFixed(2)} · 5th–95th percentiles: {simulation.result.events.p05}–{simulation.result.events.p95}</p>
        <p>Mean resources: {simulation.result.resources.mean.toFixed(2)} · trials exceeding available resources: {(simulation.result.resourceShortfallFraction * 100).toFixed(1)}%</p>
        <p className="break-all text-xs text-ink-soft">Saved scenario: {simulation.id} · 2,000 trials · seed 42</p>
      </div>}
    </Panel>
  </div>
}
