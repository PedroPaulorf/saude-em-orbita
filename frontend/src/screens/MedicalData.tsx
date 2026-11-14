import { useEffect, useRef, useState } from 'react'
import { Database } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Panel, PanelHeader } from '@/components/app/Panel'
import references from '@/data/medical-references.json'
import { apiRequest, ApiError, type History } from '@/lib/api'
import { session, type SessionState } from '@/lib/session'
import type { MedicalObservation } from '@/lib/medical-types'

interface SimulationResult {
  id: string; crewId: string; createdAt: string
  input: { seed: number; trials: number; crewSize: number; days: number }
  result: { notice: string; events: { mean: number; p05: number; p95: number }; resources: { mean: number }; resourceShortfallFraction: number }
}

function Observations({ items }: { items: MedicalObservation[] }) {
  return <ul className="grid gap-3">{items.map(o => <li key={o.metric} className="rounded-lg bg-surface-2 p-3 text-sm">
    <p className="font-semibold">{o.metric}: {o.value} {o.unit} · {o.status}</p>
    <p className="text-ink-soft">{o.explanation}</p>
    <p className="mt-1 text-ink-soft">{o.method} · quality: {o.quality} · {new Date(o.observedAt).toLocaleString()}</p>
    <p className="break-words text-xs text-ink-soft">Rule: {o.ruleVersion ?? 'not evaluated'} · personal baseline: {o.baselineVersion ?? 'unavailable'}</p>
    {o.retrospective && <p className="text-xs text-ink-soft">Retrospective assessment using the baseline available at migration time.</p>}
  </li>)}</ul>
}

export function MedicalData({ state, section }: { state: SessionState; section?: string | null }) {
  const owner = state.profile!.id
  const pending = state.checkins.filter(c => c.sync === 'pending').length
  const saved = state.checkins.filter(c => c.sync === 'saved')
  const latest = [...saved].reverse().find(c => c.observations?.length)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [scenarios, setScenarios] = useState<SimulationResult[]>([])
  const [days, setDays] = useState(180), [crewSize, setCrewSize] = useState(4)
  const [rate, setRate] = useState(0.001), [resources, setResources] = useState(2)
  const requestAbort = useRef<AbortController | null>(null)
  useEffect(() => {
    const controller = new AbortController()
    requestAbort.current = controller
    return () => { controller.abort() }
  }, [])
  useEffect(() => {
    const id = section === 'sources' ? 'research-sources' : section === 'mission' ? 'mission-scenarios' : null
    if (!id) return
    const frame = requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ block: 'start' }))
    return () => cancelAnimationFrame(frame)
  }, [section])

  async function perform(action: (signal: AbortSignal) => Promise<void>) {
    const signal = requestAbort.current!.signal
    setBusy(true); setError('')
    try { await action(signal) }
    catch (cause) {
      if (signal.aborted) return
      if (cause instanceof ApiError && cause.status === 401) session.invalidate()
      else setError(cause instanceof Error ? cause.message : 'Could not reach server.')
    } finally { if (!signal.aborted) setBusy(false) }
  }

  async function refresh() {
    await perform(async signal => {
      await session.sync()
      if (signal.aborted || session.getSnapshot().profile?.id !== owner) return
      const history = await apiRequest<History<SimulationResult>>('/me/simulations?limit=20', undefined, signal, owner)
      if (!signal.aborted) setScenarios(history.items)
    })
  }

  async function runSimulation() {
    await perform(async signal => {
      const created = await apiRequest<SimulationResult>('/me/simulations', {
        seed: 42, trials: 2000, crewSize, days, availableResources: resources,
        conditions: [{ id: 'hypothetical-event', ratePerPersonDay: rate, resourcesPerEvent: 1 }],
      }, signal, owner)
      if (!signal.aborted && created.crewId === owner) setScenarios(list => [created, ...list].slice(0, 20))
    })
  }

  return <div className="mx-auto grid w-full max-w-4xl gap-5 px-4 py-6 md:px-8">
    <a href="#/" className="font-semibold text-interactive underline">Back to Home</a>
    <h1 className="font-display text-3xl font-semibold">Medical data & sources</h1>
    <Panel>
      <PanelHeader icon={<Database />} title={`Records for ${state.profile!.displayName}`} />
      <p className="text-sm text-ink-soft">{pending} check-ups pending · {saved.length} confirmed records in the loaded window.</p>
      <p className="text-sm text-ink-soft">Records are saved locally for your account and retried with the same identifier. Server storage does not mean medical review or transmission to Earth.</p>
      <Button disabled={state.syncing || busy} onClick={() => void refresh()} className="self-start">{state.syncing || busy ? 'Working…' : 'Sync & load saved scenarios'}</Button>
      {state.checkins.filter(c => c.sync === 'rejected').map(c => <p key={c.clientId} role="status" className="text-sm text-flag-ink">{c.syncError}</p>)}
      {error && <p role="alert" className="text-sm text-flag-ink">{error}</p>}
      {latest?.observations && <details><summary className="cursor-pointer font-semibold">Latest stored assessment</summary><Observations items={latest.observations} /></details>}
      {state.truncated && <p className="text-sm text-ink-soft">The loaded history is partial. Absence of a record does not mean absence of a symptom or measurement.</p>}
      <details><summary className="cursor-pointer font-semibold">Your confirmed check-ups</summary>
        {saved.map(record => <details key={record.clientId} className="border-t border-hairline py-2">
          <summary className="cursor-pointer text-sm">{new Date(record.at).toLocaleString()} · {record.kind}</summary>
          <Observations items={record.observations ?? []} />
          {Object.keys(record.behavioral).length > 0 && <p className="text-sm text-ink-soft">Self-report retained without a medical score: {Object.entries(record.behavioral).map(([key, value]) => `${key} ${value}/5`).join(', ')}.</p>}
          {record.healthDetails && <p className="text-sm text-ink-soft">Health details: {Object.entries(record.healthDetails).map(([key, value]) => `${key}: ${value}`).join(' · ')}</p>}
        </details>)}
      </details>
    </Panel>
    <Panel id="research-sources" className="scroll-mt-24">
      <PanelHeader title="NASA research references" />
      <p className="text-sm text-ink-soft">Architecture and methodology references. They do not validate the demonstration thresholds, prevention patterns or chat.</p>
      <ul className="grid gap-3">{references.map(ref => <li key={ref.id}>
        <a className="font-semibold text-interactive underline" href={`https://ntrs.nasa.gov/citations/${ref.id}`} target="_blank" rel="noreferrer">{ref.topic} · {ref.title}</a>
        <p className="text-sm text-ink-soft">{ref.summary}</p>
      </li>)}</ul>
      <p className="text-xs text-ink-soft">Summaries are included with the app; opening the original NTRS documents needs a connection.</p>
    </Panel>
    <Panel id="mission-scenarios" className="scroll-mt-24">
      <PanelHeader title="Educational mission scenario" subtitle="Inspired by Monte Carlo methodology; not NASA IMM." />
      <p className="text-sm text-ink-soft">Hypothetical independent events with a constant rate and one resource unit per event. These numbers are not medical incidence data. This scenario is separate from your check-ups.</p>
      <form onSubmit={event => { event.preventDefault(); void runSimulation() }} className="grid gap-3 sm:grid-cols-2">
        {[
          { label: 'Mission days', value: days, set: setDays, min: 1, max: 1000, step: 1 },
          { label: 'Crew size', value: crewSize, set: setCrewSize, min: 1, max: 12, step: 1 },
          { label: 'Hypothetical events / person / day', value: rate, set: setRate, min: 0, max: 0.01, step: 0.0001 },
          { label: 'Available resource units', value: resources, set: setResources, min: 0, max: 1000000, step: 1 },
        ].map(field => <label key={field.label} className="grid gap-1 text-sm font-semibold">{field.label}<input required type="number" min={field.min} max={field.max} step={field.step} value={Number.isNaN(field.value) ? '' : field.value} onChange={event => field.set(event.target.valueAsNumber)} className="h-11 min-w-0 rounded-lg border border-hairline bg-ground px-3 font-mono" /></label>)}
        <Button type="submit" disabled={busy} className="self-start justify-self-start">Simulate & save scenario</Button>
      </form>
      {scenarios.map(scenario => <details key={scenario.id} className="rounded-lg bg-surface-2 p-3 text-sm">
        <summary className="cursor-pointer font-semibold">{new Date(scenario.createdAt).toLocaleString()} · {scenario.input.days} days, {scenario.input.crewSize} crew</summary>
        <p>{scenario.result.notice}</p>
        <p>Mean events: {scenario.result.events.mean.toFixed(2)} · 5th–95th percentiles: {scenario.result.events.p05}–{scenario.result.events.p95}</p>
        <p>Mean resources: {scenario.result.resources.mean.toFixed(2)} · trials exceeding available resources: {(scenario.result.resourceShortfallFraction * 100).toFixed(1)}%</p>
        <p className="break-all text-xs text-ink-soft">Saved: {scenario.id} · {scenario.input.trials} trials · seed {scenario.input.seed}</p>
      </details>)}
    </Panel>
  </div>
}
