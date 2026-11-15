import { useRef } from 'react'
import type { LandingCopy } from '@/data/landing'
import { cn } from '@/lib/utils'
import { H2, Shot } from './bits'
import { count, gsap, markPinned, useScene } from './motion'

/*
  Como funciona (seção amarela): três passos.

  Em tela larga a seção vira um palco preso: os três passos ficam à esquerda e o desenho de cada um
  troca à direita conforme o scroll. No passo 2 o cartão conta de 62 a 67 bpm e ganha o selo; no
  passo 3 os itens do roteiro entram em ordem. O layout de palco só existe enquanto a cena está
  montada (data-pinned na seção); sem ela, os passos ficam lado a lado ou empilhados, como antes.
*/

/** Comparação ao vivo: o que o app mostra quando uma medida sai da sua linha de base. */
function CompareCard({ c }: { c: LandingCopy['how']['compare'] }) {
  return (
    <div className="rounded-2xl border-4 border-sa-deep bg-sa-deep p-5 text-white shadow-[8px_8px_0_0_#07173f]">
      <div className="flex items-center justify-between gap-3">
        <p className="font-semibold text-white/80">{c.label}</p>
        <span className="js-state rounded-full bg-sa-yellow px-3 py-0.5 text-sm font-bold text-sa-deep">{c.state}</span>
      </div>
      <p className="mt-2 font-mono text-5xl">
        <span className="js-bpm">67</span>
        <span className="ml-1.5 text-lg text-white/70">bpm</span>
      </p>
      <p className="mt-1 font-mono text-white/75">
        {c.baseline} 62 <span className="js-delta inline-block text-sa-yellow">+5</span>
      </p>
      <p className="js-rule mt-4 border-t border-white/15 pt-3 text-sm text-white/80">{c.rule}</p>
    </div>
  )
}

const PHASE = ['bg-sa-rocket-600 text-white', 'bg-sa-yellow text-sa-deep', 'bg-sa-yonder text-sa-deep']

/** Roteiro preventivo em miniatura: um passo por fase, como no app. */
function MiniRoadmap({ r }: { r: LandingCopy['how']['roadmap'] }) {
  return (
    <ol className="grid gap-3 rounded-2xl border-4 border-sa-deep bg-sa-deep p-4 text-white shadow-[8px_8px_0_0_#07173f]">
      {r.phases.map((p, i) => (
        <li key={p} className="js-road rounded-xl bg-white/[0.06] p-3">
          <span className={cn('rounded-md px-2 py-0.5 text-sm font-bold', PHASE[i])}>{p}</span>
          <p className="mt-2 leading-snug">{r.items[i]}</p>
          {i === 0 && <p className="mt-1.5 text-sm font-semibold text-sa-yonder underline underline-offset-2">{r.risk}</p>}
        </li>
      ))}
    </ol>
  )
}

export function How({ t, lang }: { t: LandingCopy; lang: string }) {
  const ref = useRef<HTMLElement>(null)

  useScene(ref, lang, ({ q, root, pinned }) => {
    const steps = q('.js-step')
    const visuals = q('.js-visual')
    const bpm = q('.js-bpm')[0]
    const restore = () => {
      bpm.textContent = '67'
    }
    // O cartão "acorda": conta os batimentos, salta o +5 e carimba o selo.
    const wake = (tl: gsap.core.Timeline, at: number | string) =>
      tl
        .add(count(bpm, 62, 67, { duration: 0.6 }), at)
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
      tl.from(q('.js-road'), road, next + 0.45).to({}, { duration: 0.5 })
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
    gsap.from(q('.js-road'), { ...road, scrollTrigger: { trigger: visuals[2], start: 'top 70%' } })
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
              <div className="js-visual mt-2 group-data-[pinned]/pin:col-start-2 group-data-[pinned]/pin:row-span-3 group-data-[pinned]/pin:row-start-1 group-data-[pinned]/pin:mt-0">
                {i === 0 && <Shot src="checkup.jpg" alt="" className="-rotate-2" />}
                {i === 1 && (
                  <div className="rotate-[1.5deg]">
                    <CompareCard c={t.how.compare} />
                  </div>
                )}
                {i === 2 && (
                  <div className="-rotate-1">
                    <MiniRoadmap r={t.how.roadmap} />
                  </div>
                )}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
