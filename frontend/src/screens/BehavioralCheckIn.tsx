import { useEffect, useState } from 'react'
import { CheckFlow, CheckSaved, Question, ScaleChoice } from '@/components/app/CheckFlow'
import { behavioralQuestions } from '@/lib/health'
import { navigate } from '@/lib/route'
import { saveCheckIn } from '@/lib/storage'

/**
 * Check-in de saúde comportamental ("Behavioral check-in"; o quadro dizia "Mental check-up").
 * Uma pergunta por etapa, escala de 1 a 5, sem pontuação somada. Salva { kind: 'behavioral' }.
 */
export function BehavioralCheckIn() {
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [saved, setSaved] = useState(false)
  const q = behavioralQuestions[step]
  const isLast = step === behavioralQuestions.length - 1

  useEffect(() => {
    if (saved) document.getElementById('saved-title')?.focus()
  }, [saved])

  function next() {
    if (!isLast) {
      setStep(step + 1)
      return
    }
    saveCheckIn({ kind: 'behavioral', at: new Date().toISOString(), behavioral: answers })
    setSaved(true)
  }

  if (saved) {
    return (
      <CheckSaved title="Behavioral check-in">
        <p className="text-ink">Your answers are saved as you gave them. They are not scored.</p>
        <p className="text-sm text-ink-soft">A self-report, not a diagnosis. It does not replace your psychologist.</p>
      </CheckSaved>
    )
  }

  return (
    <CheckFlow
      title="Behavioral check-in"
      step={step}
      total={behavioralQuestions.length}
      onBack={() => (step === 0 ? navigate('/') : setStep(step - 1))}
      onSubmit={next}
      nextLabel={isLast ? 'Save check-in' : 'Next'}
      nextDisabled={answers[q.id] == null}
    >
      <Question id={`q-${q.id}`}>{q.question}</Question>
      <ScaleChoice
        key={q.id}
        labelledBy={`q-${q.id}`}
        low={q.low}
        high={q.high}
        value={answers[q.id] ?? null}
        onChange={(v) => setAnswers((a) => ({ ...a, [q.id]: v }))}
      />
      <p className="text-sm text-ink-soft">A self-report, not a diagnosis. It does not replace your psychologist.</p>
    </CheckFlow>
  )
}
