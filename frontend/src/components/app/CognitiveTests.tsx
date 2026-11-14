import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Check, X } from 'lucide-react'
import { median, shuffle, type CognitiveResult } from '@/lib/cognitive'
import { cn } from '@/lib/utils'

/*
  Os três testes rápidos do check-in comportamental. Cada um chama onDone com o seu resultado.
  Toque com pointerdown (menos atraso que click) e teclado (Espaço/Enter) onde faz sentido.
*/

// =====================================================================
// 1. Reflexo: luzes de largada
// =====================================================================

const TRIALS = 3
type Phase = 'idle' | 'lighting' | 'armed' | 'go' | 'result' | 'jump'

/**
 * Cinco pares de luzes acendem, um por segundo; depois de 0,5 a 2,5 s todas apagam. Toque assim que
 * apagarem. Tocar antes queima a largada e a tentativa recomeça. Três tentativas; vale a mediana.
 */
export function ReactionTest({ onDone }: { onDone: (r: NonNullable<CognitiveResult['reaction']>) => void }) {
  const [phase, setPhase] = useState<Phase>('idle')
  const [lit, setLit] = useState(0)
  const [trials, setTrials] = useState<number[]>([])
  const [last, setLast] = useState<number | null>(null)
  const jumps = useRef(0)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])
  const t0 = useRef(0)

  const clear = () => {
    timers.current.forEach(clearTimeout)
    timers.current = []
  }
  useEffect(() => clear, [])

  // Marca o início quando o quadro com as luzes apagadas já foi pintado.
  useLayoutEffect(() => {
    if (phase !== 'go') return
    const id = requestAnimationFrame(() => {
      t0.current = performance.now()
    })
    return () => cancelAnimationFrame(id)
  }, [phase])

  function start() {
    clear()
    setLast(null)
    setLit(0)
    setPhase('lighting')
    for (let i = 1; i <= 5; i++) timers.current.push(setTimeout(() => setLit(i), i * 900))
    timers.current.push(setTimeout(() => setPhase('armed'), 5 * 900))
    const hold = 5 * 900 + 500 + Math.random() * 2000
    timers.current.push(
      setTimeout(() => {
        setLit(0)
        setPhase('go')
      }, hold),
    )
  }

  function tap() {
    if (phase === 'idle' || phase === 'result' || phase === 'jump') {
      if (trials.length < TRIALS) start()
      return
    }
    if (phase === 'lighting' || phase === 'armed') {
      clear()
      jumps.current++
      setLit(0)
      setPhase('jump')
      return
    }
    if (phase === 'go' && t0.current) {
      const ms = Math.round(performance.now() - t0.current)
      t0.current = 0
      const next = [...trials, ms]
      setTrials(next)
      setLast(ms)
      setPhase('result')
      if (next.length === TRIALS) onDone({ trials: next, median: median(next), jumpStarts: jumps.current })
    }
  }

  const done = trials.length === TRIALS
  const message =
    phase === 'idle'
      ? 'Tap to start. When all the lights go out, tap as fast as you can.'
      : phase === 'lighting' || phase === 'armed'
        ? 'Wait for the lights to go out…'
        : phase === 'go'
          ? 'Go!'
          : phase === 'jump'
            ? 'Jump start. Tap to try again.'
            : done
              ? `Done. Median ${median(trials)} ms.`
              : `${last} ms. Tap for the next start.`

  return (
    <div className="grid gap-4">
      <button
        type="button"
        onPointerDown={(e) => {
          e.preventDefault()
          if (!done) tap()
        }}
        onKeyDown={(e) => {
          if ((e.key === ' ' || e.key === 'Enter') && !done) {
            e.preventDefault()
            tap()
          }
        }}
        disabled={done}
        aria-label={message}
        className="grid touch-none gap-5 rounded-xl bg-[#05080f] px-4 py-6 select-none disabled:cursor-default"
      >
        <span aria-hidden className="grid grid-cols-5 gap-2 sm:gap-3">
          {Array.from({ length: 5 }, (_, i) => (
            <span key={i} className="grid justify-items-center gap-2 rounded-lg bg-[#141a26] py-2.5">
              {[0, 1].map((k) => (
                <span
                  key={k}
                  className={cn(
                    'size-9 rounded-full transition-colors duration-75 sm:size-11',
                    i < lit ? 'bg-sa-rocket shadow-[0_0_16px_4px_rgb(228_55_0/0.6)]' : 'bg-[#2a0d06]',
                  )}
                />
              ))}
            </span>
          ))}
        </span>
        <span className={cn('text-center text-lg font-bold', phase === 'go' ? 'text-sa-yellow' : phase === 'jump' ? 'text-flag-ink' : 'text-white')} aria-live="polite">
          {message}
        </span>
      </button>
      <ol className="grid grid-cols-3 gap-2" aria-label="Attempts">
        {Array.from({ length: TRIALS }, (_, i) => (
          <li key={i} className={cn('rounded-lg border px-3 py-2 text-center', trials[i] != null ? 'border-sa-rocket-600 bg-surface-2' : 'border-hairline')}>
            <span className="block text-xs text-ink-soft">Start {i + 1}</span>
            <span className="font-mono text-xl">{trials[i] != null ? `${trials[i]} ms` : '—'}</span>
          </li>
        ))}
      </ol>
    </div>
  )
}

// =====================================================================
// 2. Memória: grade 4×4
// =====================================================================

const ROUNDS = [4, 5, 6]
const CELLS = 16

/**
 * Números de 1 a N aparecem em casas da grade por alguns segundos e somem. Toque as casas em ordem,
 * 1 primeiro. Um erro encerra a rodada. Três rodadas: 4, 5 e 6 números.
 */
export function MemoryTest({ onDone }: { onDone: (r: NonNullable<CognitiveResult['memory']>) => void }) {
  const [round, setRound] = useState(0)
  const [phase, setPhase] = useState<'ready' | 'show' | 'recall' | 'feedback' | 'done'>('ready')
  const [cells, setCells] = useState<number[]>([]) // cells[k] = casa do número k+1
  const [tapped, setTapped] = useState<number[]>([])
  const [wrong, setWrong] = useState<number | null>(null)
  const [results, setResults] = useState<{ n: number; correct: boolean }[]>([])
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  useEffect(() => () => clearTimeout(timer.current), [])

  const n = ROUNDS[round]

  function begin() {
    const picked = shuffle(Array.from({ length: CELLS }, (_, i) => i)).slice(0, n)
    setCells(picked)
    setTapped([])
    setWrong(null)
    setPhase('show')
    timer.current = setTimeout(() => setPhase('recall'), 1200 + n * 450)
  }

  function finishRound(correct: boolean) {
    const next = [...results, { n, correct }]
    setResults(next)
    setPhase('feedback')
    timer.current = setTimeout(() => {
      if (round + 1 < ROUNDS.length) {
        setRound(round + 1)
        setPhase('ready')
      } else {
        setPhase('done')
        onDone({ rounds: next, span: Math.max(0, ...next.filter((r) => r.correct).map((r) => r.n)) })
      }
    }, 1100)
  }

  function pick(cell: number) {
    if (phase !== 'recall' || tapped.includes(cell)) return
    const expected = cells[tapped.length]
    if (cell !== expected) {
      setWrong(cell)
      finishRound(false)
      return
    }
    const next = [...tapped, cell]
    setTapped(next)
    if (next.length === n) finishRound(true)
  }

  const numberAt = (cell: number) => cells.indexOf(cell) + 1 // 0 = vazia
  const last = results.at(-1)

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between text-sm">
        <span className="text-ink-soft">
          Round <span className="font-mono text-ink">{Math.min(round + 1, ROUNDS.length)}</span> of {ROUNDS.length} · <span className="font-mono text-ink">{n}</span> numbers
        </span>
        <span aria-live="polite" className="font-semibold">
          {phase === 'show' ? 'Memorize' : phase === 'recall' ? `Tap ${tapped.length + 1}` : phase === 'feedback' ? (last?.correct ? 'Correct' : 'Not this time') : ''}
        </span>
      </div>

      <div className="relative">
        <div role="grid" aria-label="Memory grid" className="grid grid-cols-4 gap-2">
          {Array.from({ length: CELLS }, (_, cell) => {
            const num = numberAt(cell)
            const order = tapped.indexOf(cell)
            const show = phase === 'show' || (phase === 'feedback' && num > 0)
            return (
              <button
                key={cell}
                type="button"
                role="gridcell"
                disabled={phase !== 'recall'}
                onPointerDown={(e) => {
                  e.preventDefault()
                  pick(cell)
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    pick(cell)
                  }
                }}
                aria-label={show && num ? `Number ${num}` : order >= 0 ? `Tapped ${order + 1}` : 'Cell'}
                className={cn(
                  'grid aspect-square place-items-center rounded-lg font-mono text-3xl font-bold transition-colors',
                  wrong === cell
                    ? 'bg-sa-martian text-white'
                    : order >= 0
                      ? 'bg-sa-rocket-600 text-white'
                      : show && num
                        ? 'bg-sa-yellow text-sa-deep'
                        : 'bg-surface-2 text-transparent',
                  phase === 'recall' && order < 0 && 'hover:bg-surface-3',
                )}
              >
                {show && num ? num : order >= 0 ? order + 1 : ''}
              </button>
            )
          })}
        </div>
        {phase === 'ready' && (
          <div className="absolute inset-0 grid place-items-center rounded-lg bg-ground/85">
            <button type="button" onClick={begin} className="rounded-lg bg-sa-rocket-600 px-6 py-3 text-lg font-bold text-white hover:bg-sa-rocket">
              {round === 0 ? 'Show the numbers' : `Next round: ${n} numbers`}
            </button>
          </div>
        )}
      </div>
      <p className="text-sm text-ink-soft">Memorize where each number is. When they hide, tap them in order, 1 first.</p>
    </div>
  )
}

// =====================================================================
// 3. Atenção: Stroop
// =====================================================================

const INKS = [
  { name: 'Red', className: 'text-sa-rocket', swatch: 'bg-sa-rocket' },
  { name: 'Blue', className: 'text-sa-yonder', swatch: 'bg-sa-yonder' },
  { name: 'Yellow', className: 'text-sa-yellow', swatch: 'bg-sa-yellow' },
  { name: 'White', className: 'text-white', swatch: 'bg-white' },
]
const STROOP_TRIALS = 8

function makeTrials() {
  // 6 incongruentes e 2 congruentes, embaralhados.
  return shuffle(
    Array.from({ length: STROOP_TRIALS }, (_, i) => {
      const word = Math.floor(Math.random() * INKS.length)
      const ink = i < 2 ? word : (word + 1 + Math.floor(Math.random() * (INKS.length - 1))) % INKS.length
      return { word, ink }
    }),
  )
}

/** A palavra é uma cor, pintada com outra. Toque a cor da TINTA. Oito rodadas. */
export function StroopTest({ onDone }: { onDone: (r: NonNullable<CognitiveResult['stroop']>) => void }) {
  const [trials] = useState(makeTrials)
  const [i, setI] = useState(-1) // -1: antes de começar
  const [answers, setAnswers] = useState<{ ok: boolean; ms: number }[]>([])
  const [flash, setFlash] = useState<boolean | null>(null)
  const t0 = useRef(0)

  useLayoutEffect(() => {
    if (i < 0 || i >= trials.length) return
    const id = requestAnimationFrame(() => {
      t0.current = performance.now()
    })
    return () => cancelAnimationFrame(id)
  }, [i, trials.length])

  function answer(ink: number) {
    if (i < 0 || i >= trials.length || !t0.current) return
    const ms = Math.round(performance.now() - t0.current)
    t0.current = 0
    const ok = ink === trials[i].ink
    const next = [...answers, { ok, ms }]
    setAnswers(next)
    setFlash(ok)
    setTimeout(() => setFlash(null), 250)
    if (i + 1 === trials.length) {
      const right = next.filter((a) => a.ok)
      onDone({ correct: right.length, total: next.length, meanMs: right.length ? Math.round(right.reduce((s, a) => s + a.ms, 0) / right.length) : 0 })
    }
    setI(i + 1)
  }

  const done = i >= trials.length
  const t = trials[Math.max(0, Math.min(i, trials.length - 1))]
  return (
    <div className="grid gap-4">
      <div className="relative grid h-36 place-items-center rounded-xl bg-[#05080f]">
        {i < 0 ? (
          <button type="button" onClick={() => setI(0)} className="rounded-lg bg-sa-rocket-600 px-6 py-3 text-lg font-bold text-white hover:bg-sa-rocket">
            Start
          </button>
        ) : done ? (
          <p className="text-lg font-bold text-white">
            {answers.filter((a) => a.ok).length} of {answers.length} right
          </p>
        ) : (
          <p aria-live="polite" className={cn('font-display text-6xl font-black tracking-wide', INKS[t.ink].className)}>
            <span className="sr-only">Word {INKS[t.word].name} in ink {INKS[t.ink].name}: </span>
            <span aria-hidden>{INKS[t.word].name.toUpperCase()}</span>
          </p>
        )}
        {flash != null && (
          <span aria-hidden className={cn('absolute top-3 right-3 grid size-8 place-items-center rounded-full', flash ? 'bg-[#3ddc84] text-sa-deep' : 'bg-sa-martian text-white')}>
            {flash ? <Check className="size-5" /> : <X className="size-5" />}
          </span>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {INKS.map((ink, k) => (
          <button
            key={ink.name}
            type="button"
            disabled={i < 0 || done}
            onPointerDown={(e) => {
              e.preventDefault()
              answer(k)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                answer(k)
              }
            }}
            className="flex h-14 items-center justify-center gap-2 rounded-lg border border-hairline-strong bg-surface-2 text-base font-bold text-ink hover:bg-surface-3 disabled:opacity-50"
          >
            <span aria-hidden className={cn('size-4 rounded-full', ink.swatch)} />
            {ink.name}
          </button>
        ))}
      </div>
      <p className="text-sm text-ink-soft">
        Tap the color of the ink, not the word. {i >= 0 && !done && <span className="font-mono">{i + 1}/{trials.length}</span>}
      </p>
    </div>
  )
}
