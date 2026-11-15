import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { Bluetooth, HeartPulse } from 'lucide-react'
import { Panel, PanelHeader } from './Panel'
import { Button } from '@/components/ui/button'
import { apiRequest, ApiError, createClientId } from '@/lib/api'
import { session } from '@/lib/session'
import { HeartRateConnection, bluetoothAccess, bluetoothUnavailable, type LiveHeartRate } from '@/lib/bluetooth'

export function BluetoothConnect({ owner, onSaved }: { owner: string; onSaved: () => void }) {
  const [connection] = useState(() => new HeartRateConnection())
  const state = useSyncExternalStore(connection.subscribe, connection.getSnapshot)
  const [consent, setConsent] = useState(false), [busy, setBusy] = useState(false)
  const [error, setError] = useState(''), [message, setMessage] = useState('')
  const [pending, setPending] = useState<{ clientId: string; reading: LiveHeartRate } | null>(null)
  const [clock, setClock] = useState(() => Date.now())
  const lifetime = useRef<AbortController | null>(null)
  useEffect(() => {
    const controller = new AbortController(); lifetime.current = controller
    const timer = window.setInterval(() => setClock(Date.now()), 1000)
    return () => { controller.abort(); window.clearInterval(timer); connection.disconnect() }
  }, [connection])
  const access = bluetoothAccess(), unavailable = bluetoothUnavailable(window.isSecureContext, access)
  const active = ['choosing', 'connecting', 'connected'].includes(state.phase)
  const fresh = state.reading && clock - Date.parse(state.reading.at) <= 15000
  async function save() {
    if (!consent || busy) return
    const snapshot = pending ?? (state.reading && state.phase === 'connected' && Date.now() - Date.parse(state.reading.at) <= 15000
      ? { clientId: createClientId(), reading: { ...state.reading } } : null)
    if (!snapshot) { setError('Wait for a fresh heart-rate reading before saving.'); return }
    const signal = lifetime.current!.signal
    setPending(snapshot); setBusy(true); setError(''); setMessage('')
    try {
      const r = snapshot.reading
      const result = await apiRequest<{ crewId: string; added: number; duplicates: number }>('/me/wearables/imports', {
        version: 1, source: 'bluetooth', format: 'bluetooth-hrs-v1', quality: 'unverified', clientId: snapshot.clientId,
        samples: [{ device: r.device, metric: 'heartRate', value: r.bpm, unit: 'bpm', at: r.at }],
      }, signal, owner)
      if (signal.aborted || result.crewId !== owner) return
      setPending(null)
      setMessage(`Bluetooth reading saved: ${result.added} added, ${result.duplicates} duplicates. Not medically evaluated.`)
      onSaved()
    } catch (cause) {
      if (signal.aborted) return
      if (cause instanceof ApiError && cause.status === 401) session.invalidate()
      else setError('Could not confirm saving. Retry the same frozen reading to avoid duplicates. ' + (cause instanceof ApiError && cause.status > 0 ? cause.message : 'Check your connection to the Health7 server.'))
    } finally { if (!signal.aborted) setBusy(false) }
  }
  return <Panel id="bluetooth-connection" className="scroll-mt-24">
    <PanelHeader icon={<Bluetooth />} tone="blue" title="Connect a Bluetooth heart-rate sensor" subtitle="Live heart rate · compatible BLE transmitters" />
    <p className="text-sm text-ink-soft">Turn on heart-rate broadcasting on the watch or sensor, keep it nearby, then select it in the browser’s device chooser. Only devices advertising the standard Heart Rate service appear. No scan runs before you press Connect.</p>
    <details className="rounded-lg bg-surface-2 p-3 text-sm">
      <summary className="cursor-pointer font-semibold">Is my device compatible with direct Bluetooth?</summary>
      <p className="mt-2">A Bluetooth pairing in Windows alone does not provide health data. The sensor or its transmitter app must advertise the standard Heart Rate service. Check the device’s broadcast feature and documentation.</p>
      <p className="mt-2">For Galaxy Fit3, use the phone integration above. Do not expect the Fit3 to appear as a standard heart-rate transmitter here. This direct connection reads heart rate only; it does not download sleep, oxygen or Samsung Health history.</p>
    </details>
    {unavailable && <p role="status" className="text-sm text-flag-ink">{unavailable}</p>}
    <div className="flex flex-wrap gap-2">
      <Button disabled={!!unavailable || active} onClick={() => { setError(''); setMessage(''); if (access) void connection.connect(access) }}><Bluetooth aria-hidden />{state.phase === 'choosing' ? 'Choose a device…' : state.phase === 'connecting' ? 'Connecting…' : 'Connect Bluetooth'}</Button>
      {active && <Button variant="outline" onClick={connection.disconnect}>{state.phase === 'choosing' || state.phase === 'connecting' ? 'Cancel connection' : 'Disconnect Bluetooth'}</Button>}
    </div>
    <p role="status" className="text-sm">Bluetooth status: {state.phase}{state.deviceName ? ` · ${state.deviceName}` : ''}</p>
    {state.phase === 'connected' && <div className="grid gap-2 rounded-lg bg-surface-2 p-4" aria-label="Live Bluetooth measurement">
      <p className="inline-flex items-center gap-2 font-semibold"><HeartPulse aria-hidden />{state.reading ? `${state.reading.bpm} bpm` : 'Waiting for a valid reading…'}</p>
      {state.reading && <>
        <p className="text-sm">Received on this computer: {new Date(state.reading.at).toLocaleString()}</p>
        <p className="text-sm text-ink-soft">{fresh ? 'Fresh reading' : 'No fresh reading in the last 15 seconds. Saving this live value is disabled.'} · Sensor contact: {state.reading.contact}</p>
      </>}
      <p className="text-xs text-ink-soft">{state.packets} valid packets received. General heart rate, not a resting measurement. Device names and measurements are not manufacturer-verified.</p>
    </div>}
    {state.error && <p role="alert" className="text-sm text-flag-ink">{state.error}</p>}
    {(state.phase === 'connected' || pending) && <>
      <label className="flex items-start gap-2 text-sm"><input type="checkbox" className="mt-1 size-5 shrink-0" checked={consent} disabled={busy} onChange={e => setConsent(e.target.checked)} />I authorize saving the selected Bluetooth reading to my Health7 account when I press Save.</label>
      {pending && <p className="text-sm">Frozen reading awaiting confirmation: {pending.reading.bpm} bpm · {new Date(pending.reading.at).toLocaleString()}. New notifications do not replace this retry.</p>}
      <div className="flex flex-wrap gap-2"><Button className="h-auto min-h-11 max-w-full py-2 whitespace-normal" disabled={busy || !consent || (!pending && (!fresh || state.phase !== 'connected'))} onClick={() => void save()}>{busy ? 'Saving reading…' : pending ? 'Retry Bluetooth reading' : 'Save current Bluetooth reading'}</Button>
        {pending && <Button variant="outline" disabled={busy} onClick={() => { setPending(null); setError('') }}>Discard pending snapshot</Button>}
      </div>
    </>}
    {error && <p role="alert" className="text-sm text-flag-ink">{error}</p>}
    {message && <p role="status" className="text-sm">{message}</p>}
    <p className="text-xs text-ink-soft">Reception stays in this tab. Only an explicitly saved snapshot reaches the server and imported history; it does not change simulated check-ups or clinical alerts. Leaving this page or signing out disconnects the sensor and clears unsaved readings.</p>
  </Panel>
}
