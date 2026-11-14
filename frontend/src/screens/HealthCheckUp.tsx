import { useEffect, useId, useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { CheckFlow, CheckSaved, MeasureField, Question } from '@/components/app/CheckFlow'
import { StatusBadge } from '@/components/app/StatusBadge'
import { DemoTag } from '@/components/app/SourceTag'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { CHECKUP_VITALS } from '@/lib/baselines'
import { measureError, parseMeasure } from '@/lib/checkin'
import { getTodayVitals, vitalConfigs } from '@/lib/health'
import { PARAM_META } from '@/lib/param-meta'
import { reportItems, summarySentence } from '@/lib/present'
import { STOOL_OPTIONS, URINE_OPTIONS } from '@/lib/roadmap'
import { href, navigate } from '@/lib/route'
import { type HealthCheckIn } from '@/lib/storage'
import { session } from '@/lib/session'
import { useSession } from '@/lib/use-session'
import { cn } from '@/lib/utils'
import type { Vital } from '@/types'

/*
  Check-up de saúde: os sete parâmetros, um por etapa, em modo foco (tela clara, laranja).
  Pressão, frequência cardíaca, saturação, temperatura, frequência respiratória, sono, e urina e fezes.
  Cada medida pode ser pulada. Salva um registro { kind: 'health' } com vitals e healthDetails.
*/
const STEPS = [...CHECKUP_VITALS, 'elimination'] as const

/** Escolha única em pílulas grandes (rádio). */
function Choice({ label, options, value, onChange }: { label: string; options: readonly string[]; value?: string; onChange: (v: string) => void }) {
  const id = useId()
  return (
    <div className="grid gap-2">
      <p id={id} className="text-sm font-semibold text-ink-soft">{label}</p>
      <div role="radiogroup" aria-labelledby={id} className="grid grid-cols-2 gap-2">
        {options.map((o) => (
          <button
            key={o}
            type="button"
            role="radio"
            aria-checked={value === o}
            onClick={() => onChange(o)}
            className={cn(
              'min-h-12 rounded-lg border px-3 text-left text-[15px] font-semibold transition-colors',
              value === o ? 'border-transparent bg-sa-rocket-600 text-white' : 'border-hairline-strong bg-ground text-ink hover:bg-surface-2',
            )}
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  )
}

export function HealthCheckUp() {
  const state = useSession()
  const [step, setStep] = useState(0)
  const [raw, setRaw] = useState<Record<string, string>>({})
  const [skipped, setSkipped] = useState<Set<string>>(new Set())
  const [urine, setUrine] = useState<string>()
  const [stool, setStool] = useState<string>()
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState<Vital[] | null>(null)
  const id = STEPS[step]
  const isLast = step === STEPS.length - 1

  useEffect(() => {
    if (saved) document.getElementById('saved-title')?.focus()
  }, [saved])

  async function save() {
    const vitals: HealthCheckIn['vitals'] = {}
    for (const vid of CHECKUP_VITALS) {
      if (skipped.has(vid)) continue
      const parsed = parseMeasure(vid, raw[vid] ?? '')
      if (!parsed) continue
      vitals[vid] = parsed.value
      if (parsed.diastolic) vitals.bloodPressureDiastolic = parsed.diastolic
    }
    const other = note.trim()
    const healthDetails: { urine?: string; stool?: string } = {}
    if (urine) healthDetails.urine = urine === 'Other' && other ? `Other: ${other}` : urine
    if (stool) healthDetails.stool = stool === 'Other' && other ? `Other: ${other}` : stool
    if (!Object.keys(vitals).length && !Object.keys(healthDetails).length) {
      setError('Add at least one measure before saving.')
      return
    }
    try {
      await session.save({ kind: 'health', at: new Date().toISOString(), vitals, ...(Object.keys(healthDetails).length ? { healthDetails } : {}) })
    } catch (e) {
      setError((e as Error).message)
      return
    }
    setSaved(getTodayVitals())
  }

  function next() {
    if (id !== 'elimination') {
      if (!parseMeasure(id, raw[id] ?? '')) {
        setError(measureError(id))
        return
      }
      setSkipped((s) => { const n = new Set(s); n.delete(id); return n })
    }
    setError(null)
    if (isLast) void save()
    else setStep(step + 1)
  }

  function skip() {
    setError(null)
    if (id !== 'elimination') setSkipped((s) => new Set(s).add(id))
    if (isLast) void save()
    else setStep(step + 1)
  }

  function back() {
    setError(null)
    if (step === 0) navigate('/')
    else setStep(step - 1)
  }

  if (saved) {
    const items = reportItems(saved)
    return (
      <CheckSaved
        title="Health check-up"
        status={state.syncing ? 'Saved on this device. Syncing…' : state.checkins.some((c) => c.sync === 'pending') ? 'Saved on this device. Waiting to sync.' : state.error ? 'Saved on this device. Check sync status.' : 'Saved. Your roadmap is ready.'}
        action={
          <div className="flex flex-wrap items-center gap-3">
            <Button asChild size="lg" className="no-underline">
              <a href={href('/prevention')}>See your roadmap <ArrowRight aria-hidden /></a>
            </Button>
            <a href={href('/')} className="text-sm font-semibold text-ink-soft underline underline-offset-4 hover:text-ink">Back to Today</a>
          </div>
        }
      >
        <div className="grid gap-3">
          <p className="text-ink">{summarySentence(saved.filter((v) => CHECKUP_VITALS.includes(v.id)))}.</p>
          {items.length > 0 && (
            <>
              <ul className="grid">
                {items.map((v) => (
                  <li key={v.id} className="grid gap-1 border-t border-hairline py-3 first:border-t-0">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-semibold">{v.label}</span>
                      <StatusBadge status={v.status} />
                    </div>
                    <p className="font-mono text-sm text-ink-soft">
                      <span className="text-ink">{v.value} {v.unit}</span> · pre-flight {v.baseline} · {v.delta}
                    </p>
                    {v.rule && <p className="text-sm text-ink-soft">{v.rule}</p>}
                  </li>
                ))}
              </ul>
              <DemoTag className="self-start" />
            </>
          )}
        </div>
      </CheckSaved>
    )
  }

  const meta = PARAM_META[id]
  if (id === 'elimination') {
    return (
      <CheckFlow title="Health check-up" step={step} total={STEPS.length} onBack={back} onSubmit={next} onSkip={skip} nextLabel="Save check-up" nextDisabled={state.syncing} icon={<meta.Icon />}>
        <Question>How are your urine and stool today?</Question>
        <Choice label="Urine color" options={URINE_OPTIONS} value={urine} onChange={setUrine} />
        <Choice label="Bowel movement" options={STOOL_OPTIONS} value={stool} onChange={setStool} />
        {(urine === 'Other' || stool === 'Other') && (
          <label className="grid gap-2 text-sm font-semibold text-ink-soft">
            Describe it in a few words
            <Textarea value={note} maxLength={500} onChange={(e) => setNote(e.target.value)} className="bg-ground text-ink" />
          </label>
        )}
        <p className="text-sm text-ink-soft">A self-report with no clinical scale. It only shapes your routine steps.</p>
        {error && <p role="alert" className="text-sm text-flag-ink">{error}</p>}
      </CheckFlow>
    )
  }

  const c = vitalConfigs.find((x) => x.id === id)!
  const baseline = id === 'bloodPressure' ? `${c.baseline}/${c.baselineDiastolic}` : String(c.baseline)
  return (
    <CheckFlow
      title="Health check-up"
      step={step}
      total={STEPS.length}
      onBack={back}
      onSubmit={next}
      onSkip={skip}
      nextLabel="Next"
      nextDisabled={state.syncing}
      icon={<meta.Icon />}
    >
      <Question>{c.question}</Question>
      <MeasureField
        key={c.id}
        label={c.fieldLabel}
        unit={c.unit}
        hint={Number.isFinite(c.baseline) ? `Your pre-flight baseline is ${baseline} ${c.unit}.` : 'No pre-flight baseline on your profile.'}
        error={error ?? undefined}
        inputMode={id === 'bloodPressure' ? 'text' : 'decimal'}
        placeholder={id === 'bloodPressure' ? 'sys/dia' : undefined}
        autoComplete="off"
        autoFocus
        value={raw[c.id] ?? ''}
        onChange={(e) => {
          setRaw((r) => ({ ...r, [c.id]: e.target.value }))
          if (error) setError(null)
        }}
      />
    </CheckFlow>
  )
}
