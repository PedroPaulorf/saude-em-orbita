import { useEffect, useState } from 'react'
import { CheckFlow, CheckSaved, MeasureField, Question } from '@/components/app/CheckFlow'
import { StatusBadge } from '@/components/app/StatusBadge'
import { DemoTag } from '@/components/app/SourceTag'
import { measureError, parseMeasure } from '@/lib/checkin'
import { getTodayVitals, manualVitalConfigs as vitalConfigs } from '@/lib/health'
import { reportItems, summarySentence } from '@/lib/present'
import { navigate } from '@/lib/route'
import { saveCheckIn, type HealthCheckIn } from '@/lib/storage'
import type { Vital } from '@/types'

/** Check-up de saúde: uma medida por etapa. Salva um registro { kind: 'health' }. */
export function HealthCheckUp() {
  const [step, setStep] = useState(0)
  const [raw, setRaw] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState<Vital[] | null>(null)
  const c = vitalConfigs[step]

  useEffect(() => {
    if (saved) document.getElementById('saved-title')?.focus()
  }, [saved])

  function next() {
    if (!parseMeasure(c.id, raw[c.id] ?? '')) {
      setError(measureError(c.id))
      return
    }
    setError(null)
    if (step < vitalConfigs.length - 1) {
      setStep(step + 1)
      return
    }
    const vitals: HealthCheckIn['vitals'] = {}
    for (const cfg of vitalConfigs) {
      const parsed = parseMeasure(cfg.id, raw[cfg.id] ?? '')
      if (!parsed) continue
      vitals[cfg.id] = parsed.value
      if (parsed.diastolic) vitals.bloodPressureDiastolic = parsed.diastolic
    }
    saveCheckIn({ kind: 'health', at: new Date().toISOString(), vitals })
    setSaved(getTodayVitals())
  }

  function back() {
    setError(null)
    if (step === 0) navigate('/')
    else setStep(step - 1)
  }

  if (saved) {
    const items = reportItems(saved)
    return (
      <CheckSaved title="Health check-up">
        <div className="grid gap-3">
          <p className="text-ink">{summarySentence(saved)}.</p>
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
                      <span className="text-ink">
                        {v.value} {v.unit}
                      </span>{' '}
                      · baseline {v.baseline} · {v.delta}
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

  const baseline = c.id === 'bloodPressure' ? `${c.baseline}/${c.baselineDiastolic}` : String(c.baseline)
  const isLast = step === vitalConfigs.length - 1
  return (
    <CheckFlow
      title="Health check-up"
      step={step}
      total={vitalConfigs.length}
      onBack={back}
      onSubmit={next}
      nextLabel={isLast ? 'Save check-up' : 'Next'}
    >
      <Question>{c.question}</Question>
      <MeasureField
        key={c.id}
        label={c.fieldLabel}
        unit={c.unit}
        hint={`Your baseline is ${baseline} ${c.unit}.`}
        error={error ?? undefined}
        inputMode={c.id === 'bloodPressure' ? 'text' : 'decimal'}
        placeholder={c.id === 'bloodPressure' ? 'sys/dia' : undefined}
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
