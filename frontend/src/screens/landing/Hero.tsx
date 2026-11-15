import { useEffect, useRef, useState, type ReactNode } from 'react'
import { CompanionFace } from '@/components/app/CompanionButton'
import type { LandingCopy } from '@/data/landing'
import type { Mood } from '@/lib/companion'
import { Note, Scribble, Words } from './bits'
import { draw, finePointer, gsap, reducedMotion, scrollToSection, useBlink, useScene } from './motion'

/*
  Topo. Três camadas de movimento:
  1. Entrada (uma vez): o título sobe palavra por palavra, o rosto salta, as órbitas abrem.
  2. Mouse (ponteiro fino): as órbitas e o rosto se deslocam um pouco, em sentidos opostos.
  3. Scroll: o rosto encolhe e fica para trás enquanto as órbitas se abrem e o texto sobe.
  Cada camada anima um elemento diferente, para uma não brigar com a outra.
*/

const MOODS: Mood[] = ['happy', 'curious', 'thinking', 'caring', 'wink']

/** Rosto do companheiro dentro de duas órbitas, trocando de expressão e de frase. */
function HeroFace({ bubbles }: { bubbles: string[] }) {
  const [i, setI] = useState(0)
  const blink = useBlink()
  useEffect(() => {
    if (reducedMotion()) return
    const talk = setInterval(() => setI((n) => n + 1), 2800)
    return () => clearInterval(talk)
  }, [])
  return (
    <div className="relative grid size-[270px] place-items-center sm:size-[340px]">
      <span aria-hidden className="js-orbit-scroll absolute inset-0">
        <span className="js-orbit-mouse-a absolute inset-0">
          <span className="js-orbit absolute inset-0">
            <span className="absolute inset-0 motion-safe:animate-orbit">
              <span className="absolute inset-x-0 top-[10%] h-[80%] rotate-[-20deg] rounded-[50%] border-[3px] border-sa-yellow" />
            </span>
          </span>
        </span>
        <span className="js-orbit-mouse-b absolute -inset-3">
          <span className="js-orbit absolute inset-0">
            <span className="absolute inset-0 motion-safe:animate-orbit-reverse">
              <span className="absolute inset-y-0 left-[12%] w-[76%] rotate-[15deg] rounded-[50%] border-[3px] border-sa-yonder" />
            </span>
          </span>
        </span>
      </span>
      <span className="js-face-mouse relative block">
        <span className="js-face block">
          <CompanionFace mood={MOODS[i % MOODS.length]} blink={blink} className="size-[170px] p-2.5 sm:size-[210px] sm:p-3" />
        </span>
      </span>
      <span
        aria-hidden
        className="js-bubble absolute -top-1 right-0 max-w-[190px] rounded-2xl rounded-bl-sm bg-white px-4 py-2 text-base leading-snug font-bold text-sa-deep shadow-[4px_4px_0_0_#eafe07] sm:right-[-24px]"
      >
        {bubbles[i % bubbles.length]}
      </span>
    </div>
  )
}

export function Hero({ t, lang, cta }: { t: LandingCopy; lang: string; cta: ReactNode }) {
  const ref = useRef<HTMLElement>(null)

  useScene(ref, lang, ({ q, root }) => {
    // 1. Entrada
    const intro = gsap.timeline({ defaults: { ease: 'power3.out' } })
    intro
      .from(q('.js-kicker'), { autoAlpha: 0, x: -16, duration: 0.5 }, 0)
      .from(q('.js-title-word'), { yPercent: 118, duration: 0.9, ease: 'power4.out', stagger: 0.07 }, 0.1)
      .from(q('.js-face'), { scale: 0, duration: 0.8, ease: 'back.out(1.6)' }, 0.15)
      .from(q('.js-orbit'), { scale: 0.4, autoAlpha: 0, duration: 1.1, stagger: 0.12, ease: 'expo.out' }, 0.3)
      .from(q('.js-sub'), { autoAlpha: 0, y: 18, duration: 0.6 }, 0.55)
      .from(q('.js-cta-item'), { autoAlpha: 0, y: 18, duration: 0.5, stagger: 0.08 }, 0.7)
      .from(q('.js-bubble'), { scale: 0, transformOrigin: '0% 100%', duration: 0.45, ease: 'back.out(2)' }, 0.9)
      .from(q('.js-note'), { autoAlpha: 0, rotation: -4, duration: 0.5 }, 1)
      .from(q('.js-face-note p'), { autoAlpha: 0, duration: 0.4 }, 1.25)
      .add(draw(q('.js-hero-scribble path')), 1.15)

    // 3. Scroll: sai de cena em camadas
    gsap
      .timeline({ scrollTrigger: { trigger: root, start: 'top top', end: 'bottom top', scrub: true } })
      .to(q('.js-face-scroll'), { yPercent: 16, scale: 0.84, ease: 'none' }, 0)
      .to(q('.js-orbit-scroll'), { scale: 1.35, autoAlpha: 0.3, ease: 'none' }, 0)
      .to(q('.js-copy'), { yPercent: -10, autoAlpha: 0.35, ease: 'none' }, 0)

    // 2. Mouse
    if (!finePointer()) return
    const to = (sel: string, prop: 'x' | 'y') => gsap.quickTo(q(sel), prop, { duration: 0.7, ease: 'power3' })
    const ax = to('.js-orbit-mouse-a', 'x')
    const ay = to('.js-orbit-mouse-a', 'y')
    const bx = to('.js-orbit-mouse-b', 'x')
    const by = to('.js-orbit-mouse-b', 'y')
    const fx = to('.js-face-mouse', 'x')
    const fy = to('.js-face-mouse', 'y')
    const move = (e: PointerEvent) => {
      const nx = e.clientX / window.innerWidth - 0.5
      const ny = e.clientY / window.innerHeight - 0.5
      ax(nx * 30)
      ay(ny * 30)
      bx(nx * -22)
      by(ny * -22)
      fx(nx * 12)
      fy(ny * 12)
    }
    window.addEventListener('pointermove', move, { passive: true })
    return () => window.removeEventListener('pointermove', move)
  })

  return (
    <section ref={ref} id="hero" className="bg-sa-deep pt-16">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 pt-6 pb-12 md:px-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:pt-12 lg:pb-20">
        <div className="js-face-scroll relative order-2 mx-auto lg:order-1">
          <HeroFace bubbles={t.hero.bubbles} />
          <div aria-hidden className="js-face-note pointer-events-none absolute -bottom-16 -left-16 hidden flex-col items-start text-sa-yonder sm:flex xl:-left-28">
            <Scribble auto={false} className="js-hero-scribble ml-28 rotate-180" />
            <Note className="max-w-[220px]">{t.hero.noteFace}</Note>
          </div>
        </div>
        <div className="js-copy order-1 lg:order-2">
          <Note className="js-kicker text-sa-yonder">{t.hero.kicker}</Note>
          <h1 className="mt-2 font-display text-5xl leading-[0.95] font-black text-balance text-sa-yellow sm:text-6xl md:text-7xl">
            <Words text={t.hero.title} mask wordClass="js-title-word" />
          </h1>
          <p className="js-sub mt-6 max-w-xl text-lg leading-relaxed text-white/85 md:text-xl">{t.hero.sub}</p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <span className="js-cta-item inline-flex">{cta}</span>
            <span className="js-cta-item inline-flex">
              <button
                type="button"
                onClick={() => scrollToSection('how')}
                className="h-14 rounded-full px-5 text-lg font-bold text-white underline decoration-sa-yellow decoration-2 underline-offset-4 hover:bg-white/10"
              >
                {t.hero.secondary}
              </button>
            </span>
          </div>
          <Note className="js-note mt-6 text-sa-yellow">{t.hero.noteNever}</Note>
        </div>
      </div>
    </section>
  )
}
