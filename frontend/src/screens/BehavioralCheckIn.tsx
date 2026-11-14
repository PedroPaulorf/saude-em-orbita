import { useEffect, useState } from 'react'
import { Grid3x3, Palette, Smile, Timer } from 'lucide-react'
import { CheckFlow, CheckSaved, Question, ScaleChoice } from '@/components/app/CheckFlow'
import { MemoryTest, ReactionTest, StroopTest } from '@/components/app/CognitiveTests'
import { compareReaction, loadCognitive, saveCognitive, type CognitiveResult } from '@/lib/cognitive'
import { behavioralQuestions } from '@/lib/health'
import { navigate } from '@/lib/route'
import { session } from '@/lib/session'
import { useSession } from '@/lib/use-session'

/*
  Check-in comportamental: primeiro três testes rápidos (reflexo, memória, atenção), depois as
  perguntas de humor, estresse e descanso. Os testes ficam neste aparelho (lib/cognitive.ts); as
  respostas vão para o servidor como antes. Nada é somado numa nota: cada resultado é comparado só
  com a própria pessoa, e nada disso é diagnóstico.
*/
type Step = 'reaction' | 'memory' | 'stroop' | string
const TESTS: { id: Step; title: string; Icon: typeof Timer }[] = [
  { id: 'reaction', title: 'How fast are your reflexes?', Icon: Timer },
  { id: 'memory', title: 'Remember the numbers', Icon: Grid3x3 },
  { id: 'stroop', title: 'Name the ink color', Icon: Palette },
]

export function BehavioralCheckIn() {
  const state = useSession()
  const steps: Step[] = [...TESTS.map((t) => t.id), ...behavioralQuestions.map((q) => q.id)]
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [tests, setTests] = useState<Omit<CognitiveResult, 'at'>>({})
  const [saved, setSaved] = useState<CognitiveResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const id = steps[step]
  const test = TESTS.find((t) => t.id === id)
  const q = behavioralQuestions.find((x) => x.id === id)
  const isLast = step === steps.length - 1

  useEffect(() => {
    if (saved) document.getElementById('saved-title')?.focus()
  }, [saved])

  async function next() {
    setError(null)
    if (!isLast) {
      setStep(step + 1)
      return
    }
    const result: CognitiveResult = { at: new Date().toISOString(), ...tests }
    try {
      if (tests.reaction || tests.memory || tests.stroop) saveCognitive(result)
      await session.save({ kind: 'behavioral', at: result.at, behavioral: answers })
    } catch (e) {
      setError((e as Error).message)
      return
    }
    setSaved(result)
  }

  if (saved) {
    // A comparação usa as sessões de ANTES desta (a última guardada é a de agora).
    const history = loadCognitive().filter((r) => r.at !== saved.at)
    const reaction = saved.reaction ? compareReaction(history, saved.reaction.median) : null
    return (
      <CheckSaved
        title="Behavioral check-in"
        status={state.syncing ? 'Saved on this device. Syncing…' : state.checkins.some((c) => c.sync === 'pending') ? 'Saved on this device. Waiting to sync.' : 'Saved.'}
      >
        <ul className="grid">
          {reaction && (
            <li className="flex items-baseline justify-between gap-3 border-t border-hairline py-3 first:border-t-0">
              <span className="font-semibold">Reflexes</span>
              <span className="text-right">
                <span className="font-mono text-xl">{reaction.value} ms</span>
                <span className="block text-sm text-ink-soft">
                  {reaction.baseline != null
                    ? `Your usual ${reaction.baseline} ms (${reaction.value - reaction.baseline > 0 ? '+' : ''}${reaction.value - reaction.baseline} ms)`
                    : `Building your baseline: ${reaction.sessions + 1} of 3 sessions`}
                </span>
              </span>
            </li>
          )}
          {saved.memory && (
            <li className="flex items-baseline justify-between gap-3 border-t border-hairline py-3 first:border-t-0">
              <span className="font-semibold">Memory</span>
              <span className="text-right">
                <span className="font-mono text-xl">{saved.memory.span || '—'}</span>
                <span className="block text-sm text-ink-soft">{saved.memory.rounds.filter((r) => r.correct).length} of {saved.memory.rounds.length} rounds right</span>
              </span>
            </li>
          )}
          {saved.stroop && (
            <li className="flex items-baseline justify-between gap-3 border-t border-hairline py-3 first:border-t-0">
              <span className="font-semibold">Attention</span>
              <span className="text-right">
                <span className="font-mono text-xl">
                  {saved.stroop.correct}/{saved.stroop.total}
                </span>
                <span className="block text-sm text-ink-soft">{saved.stroop.meanMs ? `${saved.stroop.meanMs} ms per answer` : ''}</span>
              </span>
            </li>
          )}
          <li className="flex items-baseline justify-between gap-3 border-t border-hairline py-3 first:border-t-0">
            <span className="font-semibold">Mood, stress, rest</span>
            <span className="font-mono text-xl">
              {answers.mood ?? '—'} · {answers.stress ?? '—'} · {answers.rest ?? '—'}
            </span>
          </li>
        </ul>
        <p className="text-sm text-ink-soft">
          Compared only with you. Not a diagnosis, and it does not replace your psychologist. Device delay and practice change the numbers.
        </p>
      </CheckSaved>
    )
  }

  return (
    <CheckFlow
      title="Behavioral check-in"
      step={step}
      total={steps.length}
      onBack={() => (step === 0 ? navigate('/') : setStep(step - 1))}
      onSubmit={next}
      onSkip={test && !tests[test.id as keyof typeof tests] ? () => setStep(step + 1) : undefined}
      nextLabel={isLast ? 'Save check-in' : 'Next'}
      nextDisabled={state.syncing || (test ? !tests[test.id as keyof typeof tests] : answers[id] == null)}
      icon={test ? <test.Icon /> : <Smile />}
    >
      {test ? (
        <>
          <Question>{test.title}</Question>
          {test.id === 'reaction' && <ReactionTest onDone={(reaction) => setTests((t) => ({ ...t, reaction }))} />}
          {test.id === 'memory' && <MemoryTest onDone={(memory) => setTests((t) => ({ ...t, memory }))} />}
          {test.id === 'stroop' && <StroopTest onDone={(stroop) => setTests((t) => ({ ...t, stroop }))} />}
        </>
      ) : (
        q && (
          <>
            <Question id={`q-${q.id}`}>{q.question}</Question>
            <ScaleChoice key={q.id} labelledBy={`q-${q.id}`} low={q.low} high={q.high} value={answers[q.id] ?? null} onChange={(v) => setAnswers((a) => ({ ...a, [q.id]: v }))} />
          </>
        )
      )}
      {error && <p role="alert" className="text-sm text-flag-ink">{error}</p>}
    </CheckFlow>
  )
}
