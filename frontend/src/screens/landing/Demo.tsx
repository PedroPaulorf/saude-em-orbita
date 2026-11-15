import { useMemo, useRef, useState } from 'react'
import { ArrowRight, MousePointerClick, PersonStanding, RefreshCcw, RotateCcw } from 'lucide-react'
import { BodyAvatar, type BodyView } from '@/components/app/BodyAvatar'
import { CompanionFace } from '@/components/app/CompanionButton'
import { PanelHeader } from '@/components/app/Panel'
import { ReportCompact } from '@/components/app/Report'
import { StatusBadge } from '@/components/app/StatusBadge'
import { Button } from '@/components/ui/button'
import type { LandingCopy } from '@/data/landing'
import type { Mood } from '@/lib/companion'
import { VITAL_REGION } from '@/lib/notes'
import { REGION_NAMES, reportItems, summarySentence } from '@/lib/present'
import { cn } from '@/lib/utils'
import type { BodyRegionId } from '@/types'
import { AppWindow, CheckCard, MeasureTile, RiskLink, SimulatedChip, StatePanel, TodayPanel } from './app-bits'
import { H2, Note, Scribble } from './bits'
import { gsap, reducedMotion, revealTop, useBlink, useGSAP, useScene } from './motion'
import { QUESTIONS, REGION_RISK, simulate, type Answers } from './sim'

/*
  Simulação: a pessoa percorre um dia do app em quatro passos, clicando.
    1. Check-up: digita a frequência cardíaca e o sono (ou escolhe um valor de exemplo).
    2. Body: o boneco acende conforme as respostas; cada região abre as medidas e a regra.
    3. Prevention: o estado do dia e os passos do roteiro, que dá para marcar.
    4. Report: o relatório fica na fila do aparelho até a conexão voltar.
  As telas são os componentes do app e as contas são as regras dele (sim.ts). O fundo da janela
  muda de cor com a saúde do dia, como a página do app. O Seven comenta cada passo na barra de
  baixo, que fica presa no pé da tela enquanto a janela está à vista, para o botão de avançar
  estar sempre à mão. É só demonstração: nada é salvo e nada sai do navegador.
*/

const number = (text: string) => Number(text.trim().replace(',', '.'))

export function Demo({ t, lang, demoHref }: { t: LandingCopy; lang: string; demoHref: string }) {
  const d = t.demo
  const ref = useRef<HTMLElement>(null)
  const stage = useRef<HTMLDivElement>(null)
  const [step, setStep] = useState(0)
  const [question, setQuestion] = useState(0)
  const [inputs, setInputs] = useState(['', ''])
  const [error, setError] = useState('')
  const [answers, setAnswers] = useState<Answers | null>(null)
  const [region, setRegion] = useState<BodyRegionId | null>(null)
  const [view, setView] = useState<BodyView>('front')
  const [done, setDone] = useState<string[]>([])
  const [synced, setSynced] = useState(false)
  const [reportOpen, setReportOpen] = useState(true)
  const blink = useBlink(3900)
  const day = useMemo(() => (answers ? simulate(answers) : null), [answers])
  const off = day ? day.vitals.filter((v) => v.status !== 'baseline') : []

  // A janela chega inclinada e assenta com o scroll; a anotação se desenha.
  useScene(ref, lang, ({ q }) => {
    gsap.from(q('.js-window'), { y: 90, rotation: -2.5, scale: 0.95, ease: 'none', scrollTrigger: { trigger: q('.js-window')[0], start: 'top 100%', end: 'top 55%', scrub: 0.6 } })
    gsap.from(q('.js-demo-note'), { autoAlpha: 0, x: 14, rotation: 4, duration: 0.5, scrollTrigger: { trigger: q('.js-demo-note')[0], start: 'top 85%' } })
  })
  // Cada troca de passo: volta ao topo da janela se ele ficou para trás, e o conteúdo novo entra de leve.
  useGSAP(
    () => {
      if (!stage.current) return
      const frame = stage.current.closest('.js-window')
      if (frame && (step > 0 || answers)) revealTop(frame)
      if (reducedMotion()) return
      gsap.fromTo(stage.current.children, { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.35, ease: 'power2.out', stagger: 0.07, clearProps: 'all' })
    },
    { dependencies: [step, question] },
  )

  function setInput(value: string) {
    setInputs((prev) => prev.map((v, i) => (i === question ? value : v)))
    setError('')
  }
  function submit() {
    const { min, max } = QUESTIONS[question]
    const n = number(inputs[question])
    if (inputs[question].trim() === '' || !Number.isFinite(n) || n < min || n > max) {
      setError(d.invalid.replace('{min}', String(min)).replace('{max}', String(max)))
      return
    }
    if (question === 0) {
      setQuestion(1)
      return
    }
    setAnswers({ heartRate: number(inputs[0]), sleep: n })
    setRegion(null)
    setDone([])
    setSynced(false)
    setReportOpen(true)
    setStep(1)
  }
  function restart() {
    setStep(0)
    setQuestion(0)
    setInputs(['', ''])
    setError('')
    setAnswers(null)
    setRegion(null)
    setView('front')
  }
  const toggleDone = (id: string) => setDone((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))

  const s = d.seven
  const line =
    step === 0 ? (question === 0 ? s.heart : s.sleep)
    : step === 1 ? (region ? s.region : off.length ? s.bodyOff : s.bodyCalm)
    : step === 2 ? (!off.length ? s.planCalm : done.length ? s.planDone : s.planOff)
    : synced ? s.synced : s.queued
  const mood: Mood =
    step === 0 ? 'curious'
    : step === 1 ? (off.length ? 'caring' : 'happy')
    : step === 2 ? (done.length || !off.length ? 'happy' : 'thinking')
    : synced ? 'wink' : 'thinking'

  const actionClass = 'inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-full bg-sa-rocket-600 px-5 text-[15px] font-bold text-white no-underline hover:bg-sa-rocket max-sm:w-full'
  const selected = region && day ? day.regions.find((r) => r.id === region) : undefined
  const linked = region && day ? day.vitals.filter((v) => VITAL_REGION[v.id] === region) : []
  const title = (name: string | undefined, id: BodyRegionId) => {
    if (!name) return REGION_NAMES[id]
    const [a, b] = name.split(' · ')
    return b ? `${a} · ${b[0].toUpperCase()}${b.slice(1)}` : a
  }

  return (
    <section ref={ref} id="demo" data-mood="happy" className="scroll-mt-16 bg-sa-neon-blue">
      <div className="mx-auto max-w-6xl px-4 py-16 md:px-8 md:py-24">
        <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-4">
          <div>
            <H2 text={d.title} />
            <p className="mt-4 max-w-2xl text-lg leading-relaxed text-white/90 md:text-xl">{d.sub}</p>
          </div>
          <div aria-hidden className="js-demo-note hidden items-end gap-2 text-sa-yellow md:flex">
            <Note className="mb-6">{d.note}</Note>
            <Scribble className="-rotate-[55deg]" />
          </div>
        </div>

        <div className="js-window mt-10">
          <AppWindow level={step === 0 || !day ? 'calm' : day.level}>
            {/* Barra da janela: os quatro passos e os selos do cabeçalho do app. */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl bg-sa-deep/85 px-3 py-2">
              <span className="font-display text-lg font-black tracking-[0.05em] text-white uppercase max-sm:hidden">Health7</span>
              <ol className="flex min-w-0 flex-1 items-center gap-1">
                {d.steps.map((label, i) => {
                  const open = i === 0 || !!day
                  return (
                    <li key={label} className="min-w-0">
                      <button
                        type="button"
                        disabled={!open}
                        aria-current={step === i ? 'step' : undefined}
                        onClick={() => setStep(i)}
                        className={cn(
                          'flex h-10 min-w-0 items-center gap-2 rounded-lg px-2.5 text-[15px] font-semibold transition-colors sm:px-3',
                          step === i ? 'bg-surface-2 text-ink' : 'text-ink-soft hover:bg-surface-1 hover:text-ink',
                          !open && 'opacity-45 hover:bg-transparent hover:text-ink-soft',
                        )}
                      >
                        <span className="font-mono text-sm">{i + 1}</span>
                        <span className={cn('truncate', step !== i && 'max-sm:hidden')}>{label}</span>
                      </button>
                    </li>
                  )
                })}
              </ol>
              <span className="inline-flex items-center gap-3 text-sm font-semibold text-ink max-md:hidden">
                Day <span className="font-mono">19</span>
                <SimulatedChip />
              </span>
            </div>

            <div ref={stage} className="mt-3 grid min-h-[420px] content-center gap-4 py-2 md:min-h-[560px] md:px-3 md:py-4">
              {step === 0 && (
                <div className="mx-auto w-full max-w-xl">
                  <CheckCard
                    config={QUESTIONS[question].config}
                    step={question}
                    total={QUESTIONS.length}
                    value={inputs[question]}
                    error={error || undefined}
                    onChange={setInput}
                    onNext={submit}
                    onBack={question > 0 ? () => { setQuestion(0); setError('') } : undefined}
                    extra={
                      <div className="flex flex-wrap items-center gap-2 text-sm text-ink-soft">
                        <span>{d.tryValue}</span>
                        {QUESTIONS[question].presets.map((p) => (
                          <button
                            key={p}
                            type="button"
                            onClick={() => setInput(String(p))}
                            className="h-9 rounded-full border border-hairline-strong px-3.5 font-mono text-sm text-ink hover:bg-surface-2"
                          >
                            {p}
                          </button>
                        ))}
                      </div>
                    }
                  />
                </div>
              )}

              {step === 1 && day && (
                <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
                  <section
                    aria-labelledby="demo-body"
                    className={cn('flex min-w-0 flex-col gap-3 rounded-xl border border-hairline bg-surface-1 p-5', off.some((v) => v.status === 'flagged') && 'border-t-4 border-t-sa-rocket-600')}
                  >
                    <PanelHeader id="demo-body" icon={<PersonStanding />} tone="sky" title="Body" subtitle={summarySentence(day.vitals)} />
                    <div className="flex flex-col items-center gap-3 [--avatar-h:300px] sm:[--avatar-h:380px]">
                      <div key={view} className="w-full motion-safe:animate-body-turn">
                        <BodyAvatar view={view} regions={day.regions} selected={region} onSelect={setRegion} className="w-full" />
                      </div>
                      <Button type="button" variant="secondary" size="sm" onClick={() => setView((v) => (v === 'front' ? 'back' : 'front'))} aria-pressed={view === 'back'} className="rounded-full">
                        <RefreshCcw aria-hidden />
                        {view === 'front' ? 'Show back' : 'Show front'}
                      </Button>
                    </div>
                  </section>
                  <section aria-labelledby="demo-region" className="flex min-w-0 flex-col gap-4 rounded-xl border border-hairline bg-surface-1 p-5">
                    {region ? (
                      <>
                        <header className="flex flex-wrap items-start justify-between gap-2">
                          <h3 id="demo-region" className="font-display text-xl font-semibold">
                            {title(selected?.name, region)}
                          </h3>
                          {selected?.observed === false ? <span className="text-sm text-ink-soft">{selected.stateText}</span> : <StatusBadge status={selected?.status ?? 'baseline'} />}
                        </header>
                        {linked.length > 0 ? (
                          <ul className="grid gap-2" aria-label="Linked measures">
                            {linked.map((v) => (
                              <MeasureTile key={v.id} v={v} />
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm text-ink-soft">No daily measure is linked to this region yet.</p>
                        )}
                        <RiskLink id={REGION_RISK[region]} />
                      </>
                    ) : (
                      <>
                        <header>
                          <p className="text-xs font-semibold tracking-[0.08em] text-ink-soft uppercase">Overview</p>
                          <h3 id="demo-region" className="mt-1 font-display text-xl font-semibold">
                            {summarySentence(day.vitals)}
                          </h3>
                        </header>
                        {off.length > 0 && (
                          <ul className="grid gap-2">
                            {off.map((v) => (
                              <MeasureTile key={v.id} v={v} />
                            ))}
                          </ul>
                        )}
                        <p className="flex items-center gap-2 text-ink-soft">
                          <MousePointerClick className="size-5 shrink-0 text-interactive" aria-hidden />
                          Select a body region to see its measures and the linked NASA risks.
                        </p>
                      </>
                    )}
                  </section>
                </div>
              )}

              {step === 2 && day && (
                <div className="mx-auto grid w-full max-w-2xl gap-4">
                  <StatePanel day={day} />
                  <TodayPanel day={day} done={done} onToggle={toggleDone} />
                </div>
              )}

              {step === 3 && day && (
                <div
                  className="mx-auto grid w-full max-w-xl gap-4"
                  // Links do app (#/data) não levam a lugar nenhum fora dele: ficam parados na simulação.
                  onClickCapture={(e) => {
                    if ((e.target as Element).closest('a[href^="#/"]')) e.preventDefault()
                  }}
                >
                  <ReportCompact vitals={day.vitals} connection={synced ? 'online' : 'queued'} onOpen={() => setReportOpen((o) => !o)} />
                  {reportOpen && (
                    <section aria-label="Report for ground" className="flex min-w-0 flex-col gap-3 rounded-xl border border-hairline bg-surface-1 p-5">
                      <p className="font-display text-lg font-semibold">Report for ground</p>
                      <p className="text-sm text-ink-soft">What differs from your baseline today, for your flight surgeon.</p>
                      {reportItems(day.vitals).length ? (
                        <ul className="grid gap-2">
                          {reportItems(day.vitals).map((v) => (
                            <MeasureTile key={v.id} v={v} />
                          ))}
                        </ul>
                      ) : (
                        <p className="text-ink-soft">Recorded measures match your baseline today.</p>
                      )}
                    </section>
                  )}
                </div>
              )}
            </div>

            {/* O Seven comenta o passo e leva para o próximo. */}
            <div className="sticky bottom-3 z-10 mt-3 flex min-h-[76px] flex-wrap items-center gap-3 rounded-[38px] border-2 border-sa-neon-blue bg-surface-1 py-2 pr-2.5 pl-2 shadow-[0_10px_28px_rgb(0_0_0/0.4)]">
              <CompanionFace mood={mood} blink={blink} />
              <p aria-live="polite" className="min-w-0 flex-1 basis-40 text-base leading-snug font-semibold text-ink">
                {line}
              </p>
              {(step === 1 || step === 2) && (
                <button type="button" onClick={() => setStep(step + 1)} className={actionClass}>
                  {d.next}
                  <ArrowRight className="size-4" aria-hidden />
                </button>
              )}
              {step === 3 && !synced && (
                <button type="button" onClick={() => setSynced(true)} className={actionClass}>
                  {d.sync}
                </button>
              )}
              {step === 3 && synced && (
                <>
                  <button type="button" onClick={restart} className="inline-flex h-12 shrink-0 items-center gap-2 rounded-full px-4 text-[15px] font-semibold text-ink hover:bg-surface-2 max-sm:w-full max-sm:justify-center">
                    <RotateCcw className="size-4" aria-hidden />
                    {d.restart}
                  </button>
                  <a href={demoHref} className={actionClass}>
                    {d.full}
                    <ArrowRight className="size-4" aria-hidden />
                  </a>
                </>
              )}
            </div>
          </AppWindow>
        </div>
      </div>
    </section>
  )
}
