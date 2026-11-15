import { useEffect, useRef, useState, type FormEvent } from 'react'
import { CalendarDays, ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { Panel, PanelHeader } from '@/components/app/Panel'
import { Button } from '@/components/ui/button'
import { apiRequest, ApiError, createClientId, type Profile } from '@/lib/api'
import { session } from '@/lib/session'
import { cycleSymptoms, displayDate, duration, monthBounds, monthCells, periodOnDate, shiftMonth, type MenstrualHistory, type MenstrualInput, type MenstrualPeriod } from '@/lib/menstrual'
import source from '@/data/menstrual-source.json'

const inputClass = 'block min-h-11 w-full min-w-0 rounded-lg border border-hairline bg-surface-2 px-3 py-2 text-ink'
const flowNames = { unspecified: 'Not specified', spotting: 'Spotting', light: 'Light', moderate: 'Moderate', heavy: 'Heavy' }
const labelOf = (s: string) => s.replaceAll('-', ' ').replace(/^./, c => c.toUpperCase())
type Draft = MenstrualInput & { clientId: string; id?: string; version?: number }
const emptyDraft = (date: string): Draft => ({ clientId: createClientId(), startDate: date, endDate: null, flow: 'unspecified', pain: null, symptoms: [], note: '' })

export function MenstrualCalendar({ profile }: { profile: Profile }) {
  if (profile.bodyModel !== 'female') return <div className="mx-auto max-w-5xl p-4 md:p-8"><Panel><PanelHeader title="Menstrual calendar" /><p>This calendar is available in the female profile.</p><a href="#/" className="text-interactive underline">Back to home</a></Panel></div>
  return <CalendarForAccount key={profile.id} profile={profile} />
}
function CalendarForAccount({ profile }: { profile: Profile }) {
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7))
  // A month change aborts outstanding requests and discards the unsaved form.
  return <MonthView key={month} month={month} onMonth={setMonth} profile={profile} />
}
function MonthView({ month, onMonth, profile }: { month: string; onMonth: (month: string) => void; profile: Profile }) {
  const [history, setHistory] = useState<MenstrualHistory | null>(null)
  const [draft, setDraft] = useState<Draft | null>(null)
  const [busy, setBusy] = useState(false), [loading, setLoading] = useState(true)
  const [error, setError] = useState(''), [message, setMessage] = useState('')
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const lifetime = useRef<AbortController | null>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const bounds = monthBounds(month), today = history?.today ?? new Date().toISOString().slice(0, 10)
  const items = history?.items ?? [], cells = monthCells(month)
  const referenceProfile = source.profiles.find(p => p.crewId === profile.nexus?.crewId)
  const monthLabel = new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(month + '-01T00:00:00Z'))
  function report(cause: unknown, signal: AbortSignal) {
    if (signal.aborted) return
    if (cause instanceof ApiError && cause.status === 401) { session.invalidate(); return }
    setError(cause instanceof ApiError && cause.status === 0 ? 'Could not confirm saving or loading. Reconnect and reload before trying again.' : cause instanceof Error ? cause.message : 'Request failed.')
  }
  async function fetchHistory(signal: AbortSignal) {
    const data = await apiRequest<MenstrualHistory>(`/me/menstrual?from=${bounds.from}&to=${bounds.to}`, undefined, signal, profile.id)
    if (!signal.aborted && data.crewId === profile.id) setHistory(data)
  }
  useEffect(() => {
    const controller = new AbortController(); lifetime.current = controller
    void fetchHistory(controller.signal).catch(cause => report(cause, controller.signal)).finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
    // MonthView is keyed by month and account, so this request has an immutable owner/window.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  function edit(record: MenstrualPeriod) {
    setDraft({ ...record }); setConfirmDelete(null); setError(''); setMessage('')
    requestAnimationFrame(() => { formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }); formRef.current?.querySelector('input')?.focus({ preventScroll: true }) })
  }
  function update(patch: Partial<Draft>) { setDraft(previous => previous ? { ...previous, ...patch } : null) }
  async function save(event: FormEvent) {
    event.preventDefault(); if (!draft || busy) return
    const signal = lifetime.current!.signal
    setBusy(true); setError(''); setMessage('')
    const { startDate, endDate, flow, pain, symptoms, note } = draft
    const input = { startDate, endDate, flow, pain, symptoms, note }
    try {
      await apiRequest<MenstrualPeriod>(draft.id ? `/me/menstrual/periods/${draft.id}` : '/me/menstrual/periods', draft.id ? { ...input, version: draft.version } : { ...input, clientId: draft.clientId }, signal, profile.id)
      if (signal.aborted) return
      setDraft(null); setMessage('Period saved to your account.')
      await fetchHistory(signal)
    } catch (cause) { report(cause, signal) } finally { if (!signal.aborted) setBusy(false) }
  }
  async function remove(record: MenstrualPeriod) {
    if (busy) return
    const signal = lifetime.current!.signal; setBusy(true); setError(''); setMessage('')
    try {
      await apiRequest(`/me/menstrual/periods/${record.id}/delete`, { version: record.version }, signal, profile.id)
      if (signal.aborted) return
      setConfirmDelete(null); if (draft?.id === record.id) setDraft(null)
      setMessage('Period deleted.'); await fetchHistory(signal)
    } catch (cause) { report(cause, signal) } finally { if (!signal.aborted) setBusy(false) }
  }
  return <div className="mx-auto flex max-w-5xl flex-col gap-5 px-4 py-5 md:px-8">
    <div><a href="#/" className="text-sm text-interactive underline">Back to home</a><h1 className="mt-2 font-display text-3xl font-semibold">Menstrual calendar</h1>
      <p className="mt-2 text-ink-soft">Choose to record your periods, flow and symptoms. Dates are self-reported; the calendar does not predict ovulation, fertility or the next period.</p></div>
    {error && <div role="alert" className="rounded-lg border border-hairline bg-surface-1 p-4"><p>{error}</p><Button variant="outline" className="mt-2" disabled={busy} onClick={() => { setError(''); setLoading(true); void fetchHistory(lifetime.current!.signal).catch(cause => report(cause, lifetime.current!.signal)).finally(() => setLoading(false)) }}>Reload calendar</Button></div>}
    {message && <p role="status" className="text-sm font-semibold">{message}</p>}
    <div className="grid items-start gap-5 lg:grid-cols-[1.2fr_1fr]">
      <Panel aria-label="Month calendar" className="p-3 sm:p-5">
        <div className="flex items-center justify-between gap-2"><Button variant="ghost" size="icon" aria-label="Previous month" disabled={busy || month <= '1900-01'} onClick={() => onMonth(shiftMonth(month, -1))}><ChevronLeft /></Button>
          <h2 className="font-display text-lg font-semibold" aria-live="polite">{monthLabel}</h2>
          <Button variant="ghost" size="icon" aria-label="Next month" disabled={busy || month >= today.slice(0, 7)} onClick={() => onMonth(shiftMonth(month, 1))}><ChevronRight /></Button></div>
        <label className="text-sm">Go to month<input aria-label="Go to month" type="month" min="1900-01" max={today.slice(0, 7)} value={month} disabled={busy} className={inputClass} onChange={e => { if (/^\d{4}-\d{2}$/.test(e.target.value) && e.target.value >= '1900-01' && e.target.value <= today.slice(0, 7)) onMonth(e.target.value) }} /></label>
        {loading ? <p role="status">Loading calendar…</p> : history ? <>
          <table className="w-full table-fixed border-separate border-spacing-0.5 text-center sm:border-spacing-1" aria-label={monthLabel}><thead><tr>{['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => <th key={day} scope="col" className="py-2 text-xs font-normal text-ink-soft">{day}</th>)}</tr></thead>
            <tbody>{Array.from({ length: cells.length / 7 }, (_, row) => <tr key={row}>{cells.slice(row * 7, row * 7 + 7).map((date, col) => {
              const record = date ? periodOnDate(items, date, today) : undefined
              return <td key={col} className="p-0">{date && <button type="button" disabled={busy || date > today} aria-label={`${displayDate(date)}${record ? ', recorded period' : ''}${date === today ? ', today' : ''}`} aria-current={date === today ? 'date' : undefined}
                className={`flex aspect-square min-h-11 w-full min-w-0 items-center justify-center rounded-lg border text-sm transition-colors disabled:opacity-40 ${record ? 'border-interactive bg-interactive font-semibold text-sa-deep' : 'border-transparent bg-surface-2 hover:border-interactive'} ${date === today ? 'ring-2 ring-interactive ring-offset-2 ring-offset-surface-1' : ''}`}
                onClick={() => record ? edit(record) : (setDraft(emptyDraft(date)), setMessage(''), setError(''))}>{Number(date.slice(-2))}</button>}</td>
            })}</tr>)}</tbody></table>
          <p className="text-xs text-ink-soft"><span className="mr-1 inline-block size-2 rounded-full bg-interactive" /> Recorded period. A ring marks today (UTC). Select a day to add or edit.</p>
        </> : <p>Calendar unavailable. Reload to try again.</p>}
        <Button disabled={busy || !history} className="h-auto min-h-11 whitespace-normal" onClick={() => { setDraft(emptyDraft(month === today.slice(0, 7) ? today : bounds.from)); setConfirmDelete(null); setMessage(''); setError('') }}><Plus aria-hidden /> Record a period</Button>
      </Panel>
      {draft ? <Panel><PanelHeader icon={<CalendarDays />} tone="blue" title={draft.id ? 'Edit period' : 'Record a period'} subtitle="Summary for this period; leave unknown values blank." />
        <form ref={formRef} onSubmit={save} className="flex flex-col gap-4">
          <fieldset disabled={busy} className="flex min-w-0 flex-col gap-4">
            <label className="text-sm">Start date<input type="date" required min="1900-01-01" max={today} value={draft.startDate} onChange={e => update({ startDate: e.target.value })} className={inputClass} /></label>
            <label className="text-sm">End date<input type="date" min={draft.startDate} max={today} value={draft.endDate ?? ''} onChange={e => update({ endDate: e.target.value || null })} className={inputClass} /><span className="mt-1 block text-xs text-ink-soft">Leave blank only if still ongoing. An ongoing record extends to today until you enter its end date.</span></label>
            <label className="text-sm">Flow<select aria-label="Flow" className={inputClass} value={draft.flow} onChange={e => update({ flow: e.target.value as Draft['flow'] })}>{Object.entries(flowNames).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
            <label className="text-sm">Pain (0–10, optional)<input type="number" min="0" max="10" step="1" value={draft.pain ?? ''} onChange={e => update({ pain: e.target.value === '' ? null : Number(e.target.value) })} className={inputClass} /></label>
            <fieldset className="min-w-0"><legend className="mb-2 text-sm">Symptoms (optional)</legend><div className="grid gap-2 sm:grid-cols-2">{cycleSymptoms.map(symptom => <label key={symptom} className="flex min-h-9 items-center gap-2 text-sm"><input type="checkbox" checked={draft.symptoms.includes(symptom)} onChange={e => update({ symptoms: e.target.checked ? [...draft.symptoms, symptom] : draft.symptoms.filter(s => s !== symptom) })} />{labelOf(symptom)}</label>)}</div></fieldset>
            <label className="text-sm">Notes (optional)<textarea rows={3} maxLength={1000} value={draft.note} onChange={e => update({ note: e.target.value })} className={inputClass} /></label>
          </fieldset>
          <p className="text-xs text-ink-soft">Saving sends these entries to your Health7 account. Unsaved entries are discarded when you leave this month. No entries are added from the research dataset.</p>
          <div className="flex flex-wrap gap-2"><Button type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save period'}</Button><Button type="button" variant="ghost" disabled={busy} onClick={() => setDraft(null)}>Cancel</Button></div>
        </form></Panel> : <Panel><PanelHeader title="Your period records" subtitle="Optional tracking" />
          {items.length ? <><p className="font-semibold">{items.length} period record{items.length === 1 ? '' : 's'} in this month</p><p className="text-sm text-ink-soft">Select a highlighted day to edit a period or enter its end date. Your saved records are listed below.</p></> : <p className="text-sm text-ink-soft">Select a day or “Record a period” to begin. If you do not menstruate or do not want to track, you can leave this calendar empty.</p>}
        </Panel>}
    </div>
    <Panel><PanelHeader title="Records in this month" subtitle="Self-reported records saved to your account" />
      {!loading && history && !items.length && <p>No periods recorded in this month.</p>}
      {history?.truncated && <p role="alert">Some records are omitted. Select a smaller date window through the API.</p>}
      <ul className="divide-y divide-hairline">{items.map(record => <li key={record.id} className="flex flex-col gap-3 py-4 first:pt-0">
        <div><h3 className="font-semibold">{displayDate(record.startDate)} – {record.endDate ? displayDate(record.endDate) : 'Ongoing'}</h3>
          <p className="text-sm text-ink-soft">{duration(record, today)} days{record.endDate ? '' : ' so far (as reported)'} · Flow: {flowNames[record.flow]} · Pain: {record.pain === null ? 'Not recorded' : `${record.pain}/10`}</p>
          {record.symptoms.length > 0 && <p className="text-sm">{record.symptoms.map(labelOf).join(', ')}</p>}{record.note && <p className="mt-1 whitespace-pre-wrap break-words text-sm">{record.note}</p>}</div>
        <div className="flex flex-wrap gap-2"><Button variant="outline" disabled={busy} onClick={() => edit(record)} aria-label={`Edit period starting ${displayDate(record.startDate)}`}>Edit</Button>
          <Button variant="ghost" disabled={busy} onClick={() => setConfirmDelete(record.id)} aria-label={`Delete period starting ${displayDate(record.startDate)}`}>Delete</Button></div>
        {confirmDelete === record.id && <div className="rounded-lg border border-hairline p-3"><p className="mb-2 text-sm">Delete this saved period? This removes its dates, symptoms and notes.</p><div className="flex flex-wrap gap-2"><Button disabled={busy} onClick={() => void remove(record)}>Confirm delete</Button><Button variant="ghost" disabled={busy} onClick={() => setConfirmDelete(null)}>Keep record</Button></div></div>}
      </li>)}</ul>
    </Panel>
    <Panel><PanelHeader title="Dataset & methodology" />
      <p className="text-sm text-ink-soft">The supplied NEXUS workbook contains {source.profiles.length} synthetic crew profiles. Female profiles: {source.profiles.filter(p => p.sexAtBirth === 'F').map(p => p.crewId).join(', ')}. It provides profile context, without menstrual dates or cycle lengths. This calendar uses only the dates you enter.</p>
      {referenceProfile && <p className="text-sm">Research profile: {referenceProfile.crewId} · {referenceProfile.role} · source sex_at_birth: {referenceProfile.sexAtBirth}. This does not establish menstruation or a cycle.</p>}
      <a href={source.sourceUrl} target="_blank" rel="noreferrer" className="text-sm font-semibold text-interactive underline">Open supplied NEXUS dataset</a>
      <p className="text-xs text-ink-soft">Calendar dates use YYYY-MM-DD without time conversion. Today uses UTC. Flow, pain and symptoms are optional observations; they do not generate clinical alerts.</p>
      <p className="text-xs text-ink-soft">Recording fields follow <a className="text-interactive underline" href="https://womenshealth.gov/menstrual-cycle/your-menstrual-cycle" target="_blank" rel="noreferrer">Office on Women’s Health guidance on keeping a period record</a>. No fertility or contraceptive calculations are made.</p>
    </Panel>
  </div>
}
