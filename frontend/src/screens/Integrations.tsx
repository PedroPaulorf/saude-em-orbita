import { useCallback, useEffect, useRef, useState } from 'react'
import { Watch, Database } from 'lucide-react'
import { Panel, PanelHeader } from '@/components/app/Panel'
import { MissionTracking } from '@/components/app/MissionTracking'
import { IPhoneConnection } from '@/components/app/IPhoneConnection'
import { Button } from '@/components/ui/button'
import { apiRequest, apiBase, ApiError, createClientId } from '@/lib/api'
import { session } from '@/lib/session'
import { sources, metricInfo, parseNormalized, exampleFile, exampleCsv, type ParsedWearables, type WearableSource, type WearableHistory } from '@/lib/wearables'
import { readAppleFile } from '@/lib/apple-file'
import { nextImportBatch, pauseImport } from '@/lib/wearable-batches'

function download(name: string, text: string, type: string) {
  const url = URL.createObjectURL(new Blob([text], { type }))
  const a = document.createElement('a'); a.href = url; a.download = name; a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
interface Preview { data: ParsedWearables; clientId: string; progress: { offset: number; added: number; duplicates: number } }
export function Integrations({ owner }: { owner: string }) {
  const [source, setSource] = useState<WearableSource>('apple')
  const [preview, setPreview] = useState<Preview | null>(null)
  const [consent, setConsent] = useState(false)
  const [busy, setBusy] = useState(false), [reading, setReading] = useState(false)
  const [error, setError] = useState(''), [message, setMessage] = useState('')
  const [history, setHistory] = useState<WearableHistory | null>(null)
  const [loading, setLoading] = useState(true)
  const [readProgress, setReadProgress] = useState(0)
  const readController = useRef<AbortController | null>(null), uploadController = useRef<AbortController | null>(null)
  const lifetime = useRef<AbortController | null>(null), fileVersion = useRef(0)
  const fileInput = useRef<HTMLInputElement>(null)
  const adapter = sources.find(s => s.id === source)!
  const reportError = useCallback((cause: unknown, signal: AbortSignal) => {
    if (signal.aborted) return
    if (cause instanceof ApiError && cause.status === 401) session.invalidate()
    else setError(cause instanceof Error ? cause.message : 'Request failed.')
  }, [])
  const fetchHistory = useCallback((signal: AbortSignal) => apiRequest<WearableHistory>('/me/wearables', undefined, signal, owner), [owner])
  const load = useCallback(async (signal: AbortSignal) => {
    try {
      const data = await fetchHistory(signal)
      if (!signal.aborted && data.crewId === owner) setHistory(data)
    } catch (cause) { reportError(cause, signal) }
    finally { if (!signal.aborted) setLoading(false) }
  }, [fetchHistory, owner, reportError])
  useEffect(() => {
    const controller = new AbortController(); lifetime.current = controller
    void fetchHistory(controller.signal).then(data => {
      if (!controller.signal.aborted && data.crewId === owner) setHistory(data)
    }).catch(cause => reportError(cause, controller.signal)).finally(() => {
      if (!controller.signal.aborted) setLoading(false)
    })
    return () => { controller.abort(); readController.current?.abort(); uploadController.current?.abort() }
    // Component is keyed by account; requests are also bound to its authenticated owner.
  }, [fetchHistory, owner, reportError])
  function resetFile() {
    readController.current?.abort()
    fileVersion.current++; setPreview(null); setConsent(false); setError(''); setMessage(''); setReading(false)
    if (fileInput.current) fileInput.current.value = ''
  }
  async function readFile(file: File) {
    const version = ++fileVersion.current, signal = lifetime.current!.signal
    readController.current?.abort(); readController.current = new AbortController(); setReadProgress(0)
    setPreview(null); setConsent(false); setError(''); setMessage(''); setReading(true)
    try {
      const extension = file.name.split('.').pop()?.toLowerCase()
      if (!['json', 'csv', 'xml'].includes(extension ?? '')) throw new Error('Choose JSON, CSV or extracted Apple XML; ZIP is not supported.')
      const limit = extension === 'xml' ? 200 : 10
      if (file.size > limit * 1024 * 1024) throw new Error(`File exceeds ${limit} MB. Apple XML supports 200 MB; JSON/CSV supports 10 MB.`)
      if (extension === 'xml' && source !== 'apple') throw new Error('Apple Health XML requires the Apple adapter.')
      const data = extension === 'xml'
        ? await readAppleFile(file, readController.current.signal, setReadProgress)
        : parseNormalized(await file.text(), source, extension === 'csv')
      if (signal.aborted || version !== fileVersion.current) return
      setPreview({ data, clientId: createClientId(), progress: { offset: 0, added: 0, duplicates: 0 } })
    } catch (cause) { if (version === fileVersion.current) reportError(cause, signal) }
    finally { if (!signal.aborted && version === fileVersion.current) setReading(false) }
  }
  async function save() {
    if (!preview || !consent || busy) return
    const rootSignal = lifetime.current!.signal
    uploadController.current = new AbortController()
    const signal = AbortSignal.any([rootSignal, uploadController.current.signal])
    setBusy(true); setError(''); setMessage('')
    let progress = { ...preview.progress }
    try {
      while (progress.offset < preview.data.samples.length) {
        if (signal.aborted) throw new DOMException('Paused', 'AbortError')
        const batch = nextImportBatch(preview.data, preview.clientId, progress.offset)
        const response = await apiRequest<{ crewId: string; clientId: string; added: number; duplicates: number }>('/me/wearables/imports', batch, signal, owner)
        if (signal.aborted) throw new DOMException('Paused', 'AbortError')
        if (response.crewId !== owner || response.clientId !== batch.clientId) throw new Error('Unexpected import confirmation. Verify your account before retrying.')
        progress = { offset: progress.offset + batch.samples.length, added: progress.added + response.added, duplicates: progress.duplicates + response.duplicates }
        const checkpoint = progress
        setPreview(current => current?.clientId === preview.clientId ? { ...current, progress: checkpoint } : current)
        setMessage(`Confirmed ${progress.offset.toLocaleString()} / ${preview.data.samples.length.toLocaleString()} measurements · ${progress.added.toLocaleString()} added · ${progress.duplicates.toLocaleString()} duplicates. Keep this page open.`)
        if (progress.offset < preview.data.samples.length) await pauseImport(signal)
      }
      setMessage(`Import saved: ${progress.added} added, ${progress.duplicates} duplicates. No medical assessment was generated.`)
      setPreview(null); setConsent(false)
      if (fileInput.current) fileInput.current.value = ''
      setLoading(true); await load(signal)
    } catch (cause) {
      if (signal.aborted && !rootSignal.aborted) setMessage(`Import paused after ${progress.offset.toLocaleString()} confirmed measurements. Resume to continue without duplicates.`)
      else if (cause instanceof ApiError && cause.retryable) setError('Import interrupted. Confirmed batches remain saved. Keep this preview and retry; the next batch keeps its identifier. If rate-limited, wait one minute before resuming.')
      else reportError(cause, signal)
    } finally { if (!rootSignal.aborted) setBusy(false) }
  }
  return <div className="mx-auto grid w-full max-w-5xl gap-5 px-4 py-6 md:px-8">
    <a href="#/" className="font-semibold text-interactive underline">Back to Home</a>
    <h1 className="font-display text-3xl font-semibold">Mission & device integrations</h1>
    <IPhoneConnection apiOrigin={apiBase(import.meta.env.VITE_API_URL).replace(/\/api\/v1$/, '')} history={history} />
    <MissionTracking />
    <Panel>
      <PanelHeader icon={<Watch />} title="Supported import paths" subtitle="File import available · automatic sync not connected" />
      <div className="grid gap-4 md:grid-cols-2">{sources.map(s => <article key={s.id} className="min-w-0 rounded-lg bg-surface-2 p-4">
        <h3 className="font-semibold">{s.name}</h3><p className="mt-1 text-sm font-semibold">{s.route}</p>
        <p className="mt-2 text-sm text-ink-soft">{s.help}</p>
        <a href={s.url} target="_blank" rel="noreferrer" className="mt-2 inline-block text-sm text-interactive underline">Official documentation ↗</a>
      </article>)}</div>
    </Panel>
    <Panel>
      <PanelHeader id="apple-file-import" title="Import measurements" subtitle="Preview locally, then save to your signed-in account." />
      <p className="text-sm text-ink-soft">Samsung, Garmin and ActLumus files must follow the Health7 template; proprietary raw exports need mapping first. Source and device labels are supplied by the file and are not verified by a manufacturer.</p>
      <div className="grid gap-1 font-semibold"><label htmlFor="wearable-source">Data source</label>
        <select id="wearable-source" className="min-h-11 rounded-lg border border-hairline bg-surface-2 p-2" value={source} disabled={busy || reading} onChange={e => { setSource(e.target.value as WearableSource); resetFile() }}>
          {sources.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>
      <p className="text-sm text-ink-soft">{adapter.help}</p>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={() => download(`health7-${source}-example.json`, JSON.stringify(exampleFile(source), null, 2), 'application/json')}>Download JSON template</Button>
        <Button variant="outline" onClick={() => download(`health7-${source}-example.csv`, exampleCsv(source), 'text/csv')}>Download CSV template</Button>
      </div>
      <p className="text-xs text-ink-soft">Apple XML: maximum 200 MB and one million supported measurements, sent automatically in batches of up to 500 after confirmation. Supports steps, walking/running distance, walking speed, active and basal energy, heart rate, resting heart rate, oxygen saturation, respiratory rate, body mass and sleeping wrist temperature. Sleep categories and other types are skipped and counted. JSON/CSV: maximum 10 MB and 500 measurements per file. Normalized requests stay below 256 KiB. Templates are fictional examples.</p>
      <label className="grid gap-2 font-semibold">Measurement file
        <input ref={fileInput} type="file" accept={source === 'apple' ? '.json,.csv,.xml' : '.json,.csv'} disabled={busy || reading} className="min-h-11 max-w-full rounded-lg border border-hairline p-2 text-sm" onChange={e => { if (e.target.files?.[0]) void readFile(e.target.files[0]) }} />
      </label>
      {reading && <div role="status"><p>Reading file locally… {readProgress}% · Nothing is being uploaded.</p><Button variant="outline" onClick={resetFile}>Cancel reading</Button></div>}
      {preview && <div className="grid gap-3 rounded-lg bg-surface-2 p-4">
        <h3 className="font-semibold">Import preview</h3>
        <p>{preview.data.samples.length} samples · {preview.data.quality === 'example' ? 'Fictional example data' : 'Unverified measurements'} · {preview.data.skipped} unsupported XML records skipped</p>
        <ul className="grid gap-2 text-sm">{preview.data.samples.slice(0, 5).map((s, i) => <li key={i} className="break-words">{metricInfo[s.metric][0]}: {s.value} {s.unit} · {s.device} · {new Date(s.at).toLocaleString()}{s.endAt ? ` – ${new Date(s.endAt).toLocaleString()}` : ''}</li>)}</ul>
        {preview.data.samples.length > 5 && <details><summary className="cursor-pointer text-sm font-semibold">Review sample preview (up to 100 of {preview.data.samples.length.toLocaleString()} measurements)</summary>
          <ul className="mt-2 grid max-h-80 gap-2 overflow-y-auto text-sm">{preview.data.samples.slice(5, 100).map((s, i) => <li key={i} className="break-words">{metricInfo[s.metric][0]}: {s.value} {s.unit} · {s.device} · {new Date(s.at).toLocaleString()}{s.endAt ? ` – ${new Date(s.endAt).toLocaleString()}` : ''}</li>)}</ul>
        </details>}
        <label className="flex items-start gap-2 text-sm"><input type="checkbox" checked={consent} disabled={busy} onChange={e => setConsent(e.target.checked)} className="mt-1 size-5 shrink-0" />I reviewed the source, units and data quality and authorize saving these records to my account.</label>
        <div className="flex flex-wrap gap-2"><Button disabled={!consent || busy} onClick={() => void save()}>{busy ? 'Saving…' : preview.progress.offset ? 'Resume import' : 'Save imported measurements'}</Button>{busy && <Button variant="outline" onClick={() => uploadController.current?.abort()}>Pause import</Button>}<Button variant="outline" disabled={busy} onClick={resetFile}>Discard preview</Button></div>
        <p className="text-xs text-ink-soft">Only normalized measurements are sent after confirmation. Large imports can take several minutes. Keep this page open to retain progress; after closing it, reselect the original file and existing records will be deduplicated. Pausing does not undo already saved batches.</p>
      </div>}
      {error && <p role="alert" className="break-words text-sm text-flag-ink">{error}</p>}
      {message && <p role="status" className="text-sm">{message}</p>}
    </Panel>
    <Panel>
      <PanelHeader icon={<Database />} title="Imported measurement history" />
      <p className="text-sm text-ink-soft">These records are stored separately from simulated check-ups. They do not change your baseline, body map, alerts or mission simulation. Skin temperature, light and heart rate during activity retain their own meanings.</p>
      <Button variant="outline" className="self-start" disabled={loading || busy} onClick={() => { setError(''); setLoading(true); void load(lifetime.current!.signal) }}>{loading ? 'Loading…' : 'Refresh imported history'}</Button>
      {history && <>
        <p role="status">{history.total} imported samples saved for this account.{history.truncated ? ' Showing the latest 100 only.' : ''}</p>
        <ul className="grid gap-3">{history.items.map(s => <li key={s.id} className="min-w-0 break-words rounded-lg bg-surface-2 p-3 text-sm">
          <p className="font-semibold">{metricInfo[s.metric][0]}: {s.value} {s.unit}</p>
          <p>{sources.find(item => item.id === s.source)?.name} · {s.device}</p>
          <p>{new Date(s.at).toLocaleString()}{s.endAt ? ` – ${new Date(s.endAt).toLocaleString()}` : ''}</p>
          <p className="text-ink-soft">{s.quality === 'example' ? 'Fictional example' : 'Unverified · user-declared source'} · Not medically evaluated</p>
        </li>)}</ul>
      </>}
    </Panel>
  </div>
}
