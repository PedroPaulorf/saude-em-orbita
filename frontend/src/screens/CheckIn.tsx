import { useState, type FormEvent } from 'react'
import { Button, Field, ScaleInput, SourceBadge } from '@/components/h7'
import { behavioralQuestions, configForProfile, vitalConfigs } from '@/lib/health'
import type { CheckIn as CheckInRecord } from '@/lib/storage'
import { createClientId, type Profile } from '@/lib/api'
import { session } from '@/lib/session'

/*
  Check-up diário: uma pergunta por etapa, sem formulário longo.
  Primeiro o check-up de saúde, depois o check-in comportamental, cada um com seu contador.
*/

type Step = { flow: 'health'; index: number } | { flow: 'behavioral'; index: number }

const HEALTH_STEPS = vitalConfigs.length
const BEHAVIORAL_STEPS = behavioralQuestions.length

/** Lê o texto do campo. Pressão no formato "118/76"; o resto, número com ponto ou vírgula. */
function parse(id: string, raw: string): { value: number; diastolic?: number } | null {
  const text = raw.trim().replace(',', '.')
  if (id === 'bloodPressure') {
    const m = /^(\d{2,3})\s*\/\s*(\d{2,3})$/.exec(text)
    return m ? { value: Number(m[1]), diastolic: Number(m[2]) } : null
  }
  const n = Number(text)
  return text !== '' && Number.isFinite(n) && n > 0 ? { value: n } : null
}

export function CheckIn({ onDone, onCancel, profile }: { profile: Profile; onDone: () => void; onCancel: () => void }) {
  const [step, setStep] = useState<Step>({ flow: 'health', index: 0 })
  const [raw, setRaw] = useState<Record<string, string>>({})
  const [scale, setScale] = useState<Record<string, number>>({})
  const [error, setError] = useState<string | null>(null)

  const [saving, setSaving] = useState(false)
  const [clientId] = useState(() => createClientId())
  async function finish() {
    const vitals: CheckInRecord['vitals'] = {}
    for (const c of vitalConfigs) {
      const parsed = parse(c.id, raw[c.id] ?? '')
      if (!parsed) continue
      vitals[c.id] = parsed.value
      if (parsed.diastolic) vitals.bloodPressureDiastolic = parsed.diastolic
    }
    setSaving(true)
    try {
      await session.save({ clientId, source: 'simulated', at: new Date().toISOString(), vitals, behavioral: scale })
      onDone()
    } catch(error) { setError((error as Error).message) }
    finally { setSaving(false) }
  }

  function next(e?: FormEvent) {
    e?.preventDefault()
    setError(null)
    if (step.flow === 'health') {
      const c = vitalConfigs[step.index]
      if (!parse(c.id, raw[c.id] ?? '')) {
        setError(c.id === 'bloodPressure' ? 'Type it as systolic/diastolic, for example 118/76.' : 'Type a number.')
        return
      }
      if (step.index < HEALTH_STEPS - 1) setStep({ flow: 'health', index: step.index + 1 })
      else setStep({ flow: 'behavioral', index: 0 })
    } else {
      if (step.index < BEHAVIORAL_STEPS - 1) setStep({ flow: 'behavioral', index: step.index + 1 })
      else finish()
    }
  }

  function back() {
    setError(null)
    if (step.flow === 'behavioral') {
      if (step.index > 0) setStep({ flow: 'behavioral', index: step.index - 1 })
      else setStep({ flow: 'health', index: HEALTH_STEPS - 1 })
    } else if (step.index > 0) setStep({ flow: 'health', index: step.index - 1 })
    else onCancel()
  }

  const isLast = step.flow === 'behavioral' && step.index === BEHAVIORAL_STEPS - 1

  return (
    <main className="h7-screen max-md:px-6">
      <form className="h7-card mx-auto w-full max-w-xl gap-6 p-6" onSubmit={next} noValidate>
        {step.flow === 'health' ? (
          <HealthStep
            profile={profile}
            index={step.index}
            value={raw[vitalConfigs[step.index].id] ?? ''}
            error={error}
            onChange={(v) => setRaw((r) => ({ ...r, [vitalConfigs[step.index].id]: v }))}
          />
        ) : (
          <BehavioralStep
            index={step.index}
            value={scale[behavioralQuestions[step.index].id] ?? null}
            onChange={(v) => setScale((s) => ({ ...s, [behavioralQuestions[step.index].id]: v }))}
          />
        )}

        {error && step.flow === 'behavioral' && <p role='alert'>{error}</p>}
        <div className="h7-row justify-between">
          <Button onClick={back}>{step.flow === 'health' && step.index === 0 ? 'Cancel' : 'Back'}</Button>
          <Button
            type="submit"
            variant="primary"
            disabled={saving || step.flow === 'behavioral' && scale[behavioralQuestions[step.index].id] == null}
          >
            {isLast ? 'Save check-in' : 'Next'}
          </Button>
        </div>
      </form>
    </main>
  )
}

function HealthStep({
  profile,
  index,
  value,
  error,
  onChange,
}: {
  profile: Profile
  index: number
  value: string
  error: string | null
  onChange: (v: string) => void
}) {
  const c = configForProfile(profile)[index]
  const baseline = c.id === 'bloodPressure' ? `${c.baseline}/${c.baselineDiastolic}` : String(c.baseline)
  return (
    <>
      <div className="h7-card__head">
        <span className="h7-meta">
          Health check-up · {index + 1} of {HEALTH_STEPS}
        </span>
        <SourceBadge source="simulated" />
      </div>
      <h1 className="h7-h1">{c.question}</h1>
      <Field
        key={c.id}
        label={c.fieldLabel}
        unit={c.unit}
        hint={`Your baseline is ${baseline} ${c.unit}.`}
        error={error ?? undefined}
        inputMode={c.id === 'bloodPressure' ? 'text' : 'decimal'}
        placeholder={c.id === 'bloodPressure' ? '118/76' : undefined}
        autoFocus
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </>
  )
}

function BehavioralStep({
  index,
  value,
  onChange,
}: {
  index: number
  value: number | null
  onChange: (v: number) => void
}) {
  const q = behavioralQuestions[index]
  return (
    <>
      <div className="h7-card__head">
        <span className="h7-meta">
          Behavioral health check-in · {index + 1} of {BEHAVIORAL_STEPS}
        </span>
      </div>
      <h1 className="h7-h1">{q.question}</h1>
      <ScaleInput key={q.id} label={q.question} hideLabel low={q.low} high={q.high} value={value} onChange={onChange} />
      <p className="h7-sm">A self-report, not a diagnosis. It does not replace your psychologist.</p>
    </>
  )
}
