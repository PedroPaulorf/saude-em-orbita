import { useRef } from 'react'
import type { LandingCopy } from '@/data/landing'
import { cn } from '@/lib/utils'
import { H2, Note, Scribble, Words } from './bits'
import { count, draw, gsap, markPinned, useScene } from './motion'

/*
  O problema e a ideia (seção azul).

  Em tela larga a parte do problema fica presa enquanto o scroll conta a história: Marte se afasta
  e o atraso de uma mensagem vai de 4 a 24 minutos; depois os riscos caem na tela um a um.
  No celular nada prende: o atraso acompanha o scroll e os adesivos entram quando aparecem.

  Em seguida a frase da ideia acende palavra por palavra, com sete pontos para as sete medidas.
*/

const STICKER = [
  'bg-sa-yellow text-sa-deep -rotate-3',
  'bg-white text-sa-deep rotate-2',
  'bg-sa-deep text-white -rotate-1',
  'bg-sa-rocket-600 text-white rotate-3',
  'bg-sa-yonder text-sa-deep -rotate-2',
]

/** Terra e Marte ligados por uma linha: a distância muda, e com ela o atraso da mensagem. */
function Signal({ s }: { s: LandingCopy['problem']['signal'] }) {
  return (
    <div aria-hidden className="js-signal rotate-1 rounded-2xl border-4 border-sa-deep bg-sa-deep p-5 shadow-[8px_8px_0_0_#07173f] md:p-6">
      <p className="flex items-baseline gap-3">
        <span className="js-min font-mono text-6xl leading-none text-sa-yellow md:text-7xl">4–24</span>
        <span className="font-mono text-base text-white/75">{s.unit}</span>
      </p>
      <div className="js-track relative mt-8 h-16">
        <span className="js-line absolute top-3 right-3 left-3 border-t-[3px] border-dashed border-sa-yonder" />
        <span className="absolute top-0 left-0 grid justify-items-start gap-2">
          <span className="block size-6 rounded-full border-[3px] border-white bg-sa-neon-blue" />
          <span className="font-mono text-sm text-white/80">{s.earth}</span>
        </span>
        <span className="js-mars absolute top-0 right-0 grid justify-items-end gap-2">
          <span className="block size-6 rounded-full border-[3px] border-sa-deep bg-sa-rocket-600 ring-2 ring-sa-rocket-600" />
          <span className="font-mono text-sm text-white/80">{s.mars}</span>
        </span>
      </div>
    </div>
  )
}

export function Problem({ t, lang }: { t: LandingCopy; lang: string }) {
  const ref = useRef<HTMLElement>(null)

  useScene(ref, lang, ({ q, root, pinned }) => {
    const scene = q('.js-scene')[0]
    const min = q('.js-min')[0]
    const stickers = q('.js-sticker')
    const NEAR = 0.7 // quanto do trilho Marte "encolhe" quando está perto

    // Distância Terra-Marte: de perto (4 min) a longe (24 min).
    const distance = (tl: gsap.core.Timeline, at: number, dur: number) => {
      tl.add(count(min, 4, 24, { duration: dur }), at)
        .fromTo(q('.js-mars'), { x: () => -q('.js-track')[0].offsetWidth * NEAR }, { x: 0, ease: 'none', duration: dur }, at)
        .fromTo(q('.js-line'), { clipPath: `inset(-4px ${NEAR * 100}% -4px 0%)` }, { clipPath: 'inset(-4px 0% -4px 0%)', ease: 'none', duration: dur }, at)
    }
    const restore = () => {
      min.textContent = '4–24'
    }

    if (pinned) {
      const unpin = markPinned(root)
      const tl = gsap.timeline({
        scrollTrigger: { trigger: scene, start: 'top top', end: '+=1500', pin: true, scrub: 0.6, invalidateOnRefresh: true },
      })
      distance(tl, 0, 1)
      tl.from(
        stickers,
        {
          y: () => gsap.utils.random(-340, -220),
          x: () => gsap.utils.random(-60, 60),
          rotation: () => gsap.utils.random(-28, 28),
          autoAlpha: 0,
          duration: 0.5,
          ease: 'back.out(1.3)',
          stagger: 0.14,
        },
        0.4,
      )
        .add(draw(q('.js-problem-scribble path'), { duration: 0.25, stagger: 0.15 }), '>-0.1')
        .from(q('.js-problem-note'), { autoAlpha: 0, x: -12, duration: 0.3 }, '<0.1')
        .to({}, { duration: 0.35 }) // respiro antes de soltar
      return () => {
        unpin()
        restore()
      }
    }

    // Sem prender: cada peça reage quando passa pela tela.
    distance(gsap.timeline({ scrollTrigger: { trigger: q('.js-signal')[0], start: 'top 85%', end: 'top 30%', scrub: 0.6, invalidateOnRefresh: true } }), 0, 1)
    gsap.from(stickers, {
      y: -40,
      rotation: () => gsap.utils.random(-20, 20),
      scale: 0.6,
      autoAlpha: 0,
      duration: 0.5,
      ease: 'back.out(1.6)',
      stagger: 0.07,
      scrollTrigger: { trigger: q('.js-stickers')[0], start: 'top 85%' },
    })
    const note = gsap.timeline({ scrollTrigger: { trigger: q('.js-problem-note')[0], start: 'top 90%' } })
    note.add(draw(q('.js-problem-scribble path'))).from(q('.js-problem-note'), { autoAlpha: 0, x: -12, duration: 0.4 }, 0.2)
    return restore
  })

  // A ideia: independente de prender ou não, acende com o scroll.
  useScene(ref, lang, ({ q }) => {
    gsap
      .timeline({ scrollTrigger: { trigger: q('.js-idea')[0], start: 'top 82%', end: 'top 28%', scrub: 0.5 } })
      .from(q('.js-dot'), { opacity: 0.25, scale: 0.5, ease: 'back.out(3)', duration: 0.6, stagger: 0.5 }, 0)
      .from(q('.js-idea-word'), { opacity: 0.22, ease: 'none', duration: 0.6, stagger: 0.22 }, 0)
      .from(q('.js-idea-note'), { autoAlpha: 0, rotation: -3, x: -10, duration: 0.6 }, '>-0.3')
  })

  return (
    <section ref={ref} data-mood="caring" className="group/pin bg-sa-neon-blue">
      <div className="js-scene mx-auto max-w-6xl px-4 py-16 group-data-[pinned]/pin:flex group-data-[pinned]/pin:min-h-svh group-data-[pinned]/pin:flex-col group-data-[pinned]/pin:justify-center group-data-[pinned]/pin:pt-[88px] group-data-[pinned]/pin:pb-8 md:px-8 md:py-24">
        <div className="grid items-end gap-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] lg:gap-14">
          <div>
            <H2 text={t.problem.title} />
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-white/90 md:text-xl">{t.problem.text}</p>
          </div>
          <Signal s={t.problem.signal} />
        </div>
        <ul className="js-stickers mt-10 flex max-w-4xl flex-wrap gap-3">
          {t.problem.stickers.map((s, i) => (
            <li key={s} className={cn('js-sticker rounded-full px-4 py-2 text-base font-bold shadow-[3px_3px_0_0_#07173f] md:text-lg', STICKER[i % STICKER.length])}>
              {s}
            </li>
          ))}
        </ul>
        <div className="mt-4 flex items-start gap-2 text-sa-yellow">
          <Scribble auto={false} className="js-problem-scribble mt-1 rotate-[100deg]" />
          <Note className="js-problem-note mt-6 max-w-sm">{t.problem.note}</Note>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 pb-16 md:px-8 md:pb-24">
        <div className="js-idea max-w-4xl">
          <div aria-hidden className="mb-5 flex gap-2.5">
            {Array.from({ length: 7 }, (_, i) => (
              <span key={i} className="js-dot size-3.5 rounded-full bg-sa-yellow" />
            ))}
          </div>
          <p className="font-display text-3xl leading-tight font-black text-balance md:text-5xl">
            <Words text={t.idea.title} wordClass="js-idea-word" />
          </p>
          <Note className="js-idea-note mt-3 text-sa-yellow">{t.idea.note}</Note>
        </div>
      </div>
    </section>
  )
}
