import { useRef } from 'react'
import type { LandingCopy } from '@/data/landing'
import { StatusBadge } from '@/components/app/StatusBadge'
import { AppWindow, CheckCard, MeasureTile, TodayPanel } from './app-bits'
import { H2 } from './bits'
import { count, gsap, markPinned, useScene } from './motion'
import { QUESTIONS, simulate } from './sim'

/*
  Como funciona (seção amarela): três passos.

  Em tela larga a seção vira um palco preso: os três passos ficam à esquerda e o desenho de cada um
  troca à direita conforme o scroll. Os desenhos são telas do próprio app (app-bits.tsx), com um
  dia de exemplo calculado pelas regras dele (sim.ts). No passo 2 a medida conta da linha de base
  até o valor de hoje e ganha o selo; no passo 3 os passos do roteiro entram em ordem. O layout de palco só existe enquanto a cena está
  montada (data-pinned na seção); sem ela, os passos ficam lado a lado ou empilhados, como antes.
*/

/** O dia de exemplo desta seção: frequência cardíaca 6 bpm acima da linha de base, o resto dentro dela. */
const DAY = simulate({ heartRate: 68, sleep: 6.9 })
const HEART = DAY.vitals.find((v) => v.id === 'heartRate')!
const PRESSURE = DAY.vitals.find((v) => v.id === 'bloodPressure')!

/** As três telas do app, uma por passo. São decorativas aqui: quem quiser mexer usa a simulação logo abaixo. */
const VISUALS = [
  <AppWindow key="check" className="-rotate-2">
    <CheckCard config={QUESTIONS[0].config} step={0} total={7} value="" />
  </AppWindow>,
  <AppWindow key="compare" className="rotate-[1.5deg]">
    <section className="flex flex-col gap-4 rounded-xl border border-hairline bg-surface-1 p-5">
      <header className="flex flex-wrap items-start justify-between gap-2">
        <p className="font-display text-xl font-semibold">Chest · Heart and lungs</p>
        <span className="js-state inline-flex">
          <StatusBadge status={HEART.status} />
        </span>
      </header>
      <ul className="grid gap-2">
        <MeasureTile v={HEART} hooks />
        <MeasureTile v={PRESSURE} />
      </ul>
    </section>
  </AppWindow>,
  <AppWindow key="roadmap" className="-rotate-1">
    <TodayPanel day={DAY} />
  </AppWindow>,
]

export function How({ t, lang }: { t: LandingCopy; lang: string }) {
  const ref = useRef<HTMLElement>(null)

  useScene(ref, lang, ({ q, root, pinned }) => {
    const steps = q('.js-step')
    const visuals = q('.js-visual')
    const bpm = q('.js-bpm')[0]
    const restore = () => {
      bpm.textContent = HEART.value
    }
    // O cartão "acorda": conta os batimentos, salta o +5 e carimba o selo.
    const wake = (tl: gsap.core.Timeline, at: number | string) =>
      tl
        .add(count(bpm, HEART.baselineValue ?? 62, Number(HEART.value), { duration: 0.6 }), at)
        .from(q('.js-delta'), { scale: 0, autoAlpha: 0, duration: 0.3, ease: 'back.out(3)' }, '>-0.1')
        .from(q('.js-state'), { scale: 0, rotation: -14, autoAlpha: 0, duration: 0.3, ease: 'back.out(2.5)' }, '<0.1')
        .from(q('.js-rule'), { autoAlpha: 0, duration: 0.3 }, '<0.1')
    const road = { autoAlpha: 0, x: 40, duration: 0.35, ease: 'power2.out', stagger: 0.22 }

    if (pinned) {
      const unpin = markPinned(root)
      gsap.set(steps.slice(1), { autoAlpha: 0.28 })
      gsap.set(visuals.slice(1), { autoAlpha: 0, yPercent: 30, rotation: 5 })
      const tl = gsap.timeline({
        scrollTrigger: { trigger: q('.js-scene')[0], start: 'top top', end: '+=2400', pin: true, scrub: 0.6 },
        defaults: { ease: 'power2.inOut' },
      })
      const swap = (from: number, to: number, at: number) =>
        tl
          .to(steps[from], { autoAlpha: 0.28, duration: 0.4 }, at)
          .to(steps[to], { autoAlpha: 1, duration: 0.4 }, at)
          .to(visuals[from], { autoAlpha: 0, yPercent: -30, rotation: -5, duration: 0.5 }, at)
          .to(visuals[to], { autoAlpha: 1, yPercent: 0, rotation: 0, duration: 0.5 }, at + 0.1)
      tl.to({}, { duration: 0.5 }) // passo 1 em cena
      swap(0, 1, 0.5)
      wake(tl, 1.1)
      tl.to({}, { duration: 0.3 })
      const next = tl.duration()
      swap(1, 2, next)
      tl.from(q('.js-roadmap li'), road, next + 0.45).to({}, { duration: 0.5 })
      return () => {
        unpin()
        restore()
      }
    }

    // Sem prender: cada passo entra quando aparece, e o desenho endireita com o scroll.
    steps.forEach((step, i) => {
      gsap.from(step.children, { autoAlpha: 0, y: 24, duration: 0.5, stagger: 0.08, ease: 'power3.out', scrollTrigger: { trigger: step, start: 'top 85%' } })
      gsap.from(visuals[i], {
        y: 60,
        rotation: i % 2 ? -6 : 6,
        scale: 0.94,
        ease: 'none',
        scrollTrigger: { trigger: visuals[i], start: 'top 98%', end: 'top 60%', scrub: 0.6 },
      })
    })
    wake(gsap.timeline({ scrollTrigger: { trigger: visuals[1], start: 'top 70%' } }), 0)
    gsap.from(q('.js-roadmap li'), { ...road, scrollTrigger: { trigger: visuals[2], start: 'top 70%' } })
    return restore
  })

  return (
    <section ref={ref} id="how" data-mood="curious" className="group/pin scroll-mt-16 bg-sa-yellow text-sa-deep">
      <div className="js-scene mx-auto max-w-6xl px-4 py-16 group-data-[pinned]/pin:flex group-data-[pinned]/pin:h-svh group-data-[pinned]/pin:flex-col group-data-[pinned]/pin:justify-center group-data-[pinned]/pin:pt-[88px] group-data-[pinned]/pin:pb-8 md:px-8 md:py-24">
        <H2 text={t.how.title} />
        <ol className="mt-12 grid gap-14 group-data-[pinned]/pin:mt-8 group-data-[pinned]/pin:grid-cols-2 group-data-[pinned]/pin:items-center group-data-[pinned]/pin:gap-x-16 group-data-[pinned]/pin:gap-y-0 lg:grid-cols-3 lg:gap-10">
          {t.how.steps.map((s, i) => (
            <li key={s.title} className="flex flex-col gap-4 group-data-[pinned]/pin:contents">
              <div className="js-step flex flex-col gap-4 group-data-[pinned]/pin:col-start-1 group-data-[pinned]/pin:flex-row group-data-[pinned]/pin:gap-6 group-data-[pinned]/pin:py-3">
                <span
                  aria-hidden
                  className="font-display text-7xl leading-none font-black text-sa-rocket-600 group-data-[pinned]/pin:w-20 group-data-[pinned]/pin:shrink-0 group-data-[pinned]/pin:text-6xl"
                >
                  0{i + 1}
                </span>
                <div className="flex flex-col gap-3">
                  <h3 className="font-display text-2xl font-black md:text-3xl">{s.title}</h3>
                  <p className="text-lg leading-relaxed">{s.text}</p>
                </div>
              </div>
              <div inert aria-hidden className="js-visual mt-2 group-data-[pinned]/pin:col-start-2 group-data-[pinned]/pin:row-span-3 group-data-[pinned]/pin:row-start-1 group-data-[pinned]/pin:mt-0">
                {VISUALS[i]}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
