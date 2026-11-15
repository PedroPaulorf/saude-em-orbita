import { useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { CloudSun, MessageCircle, PersonStanding, Radio, Timer, type LucideIcon } from 'lucide-react'
import { BodyAvatar } from '@/components/app/BodyAvatar'
import { CompanionFace } from '@/components/app/CompanionButton'
import type { LandingCopy } from '@/data/landing'
import type { Mood } from '@/lib/companion'
import { cn } from '@/lib/utils'
import type { BodyRegion, Status } from '@/types'
import { H2, Note, Scribble, Shot } from './bits'
import { gsap, reducedMotion, ScrollTrigger, useBlink, useScene } from './motion'

/*
  Recursos (seção escura): cinco blocos, texto de um lado e desenho do outro.
  O texto entra de lado uma vez; o desenho endireita conforme o scroll, e três deles reagem a ele:
  o corpo acende as regiões e vira de costas, as luzes de largada acendem e apagam, e o sol do
  clima espacial gira. O companheiro responde ao mouse.
*/

const REGIONS: BodyRegion['id'][] = ['head', 'chest', 'core', 'leftArm', 'rightArm', 'leftLeg', 'rightLeg']
// Estágio 0: tudo na linha de base. 1: peito em atenção. 2: perna sinalizada. 3: vira de costas.
const regionsAt = (stage: number): BodyRegion[] =>
  REGIONS.map((id) => {
    let status: Status = 'baseline'
    if (id === 'chest' && stage >= 1) status = 'attention'
    if (id === 'leftLeg' && stage >= 2) status = 'flagged'
    return { id, status }
  })

/** O boneco do Body guiado pelo scroll: as regiões acendem em ordem e ele vira de costas. */
function ScrollBody({ lang }: { lang: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [stage, setStage] = useState(() => (reducedMotion() ? 2 : 0))
  useScene(ref, lang, ({ root }) => {
    ScrollTrigger.create({
      trigger: root,
      start: 'top 70%',
      end: 'bottom 25%',
      onUpdate: (self) => {
        const p = self.progress
        setStage(p > 0.68 ? 3 : p > 0.4 ? 2 : p > 0.18 ? 1 : 0)
      },
    })
  })
  const view = stage >= 3 ? 'back' : 'front'
  return (
    <div ref={ref} inert aria-hidden className="mx-auto w-fit" style={{ '--avatar-h': 'min(420px, 70vw)' } as CSSProperties}>
      <BodyAvatar key={view} view={view} regions={regionsAt(stage)} compact className="motion-safe:animate-body-turn" />
    </div>
  )
}

/** Luzes de largada penduradas sobre o print do teste de reflexo: acendem coluna a coluna e apagam. */
function StartLights() {
  return (
    <div aria-hidden className="absolute -top-7 right-2 flex rotate-3 gap-1.5 rounded-xl border-[3px] border-sa-neon-blue bg-black p-2 shadow-[5px_5px_0_0_#2e96f5] sm:right-6 sm:gap-2 sm:p-2.5">
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className="grid gap-1.5">
          {[0, 1].map((r) => (
            <span key={r} className="relative block size-5 rounded-full bg-[#3a0e00] sm:size-6">
              <span className={cn('js-light absolute inset-0 rounded-full bg-sa-rocket shadow-[0_0_12px_2px_#ff4f1c]', `js-light-${i}`)} />
            </span>
          ))}
        </span>
      ))}
    </div>
  )
}

/** Sol de papel atrás do print do clima espacial. */
function Sun() {
  return (
    <svg aria-hidden viewBox="-50 -50 100 100" className="js-sun absolute -top-12 -right-6 size-32 text-sa-rocket-600 sm:-right-12 sm:size-40">
      {Array.from({ length: 12 }, (_, i) => (
        <path key={i} d="M-7 -20 L0 -48 L7 -20 Z" fill="currentColor" transform={`rotate(${i * 30})`} />
      ))}
      <circle r="24" fill="currentColor" />
    </svg>
  )
}

/** A barra do companheiro: o rosto reage ao mouse e cada clique troca a frase. */
function CompanionPill({ bubbles }: { bubbles: string[] }) {
  const [i, setI] = useState(0)
  const [hover, setHover] = useState(false)
  const blink = useBlink(4300)
  const mood: Mood = hover ? 'caring' : 'happy'
  return (
    <div
      aria-hidden
      onPointerEnter={() => setHover(true)}
      onPointerLeave={() => setHover(false)}
      onClick={() => setI((n) => n + 1)}
      className="mx-auto flex w-full max-w-md cursor-pointer items-center gap-4 rounded-full border-2 border-sa-neon-blue bg-[#0b2257] p-2.5 pr-5 shadow-[10px_10px_0_0_#0960e1] select-none"
    >
      <CompanionFace mood={mood} blink={blink} className="size-[84px] p-1.5" />
      <span className="flex-1 text-lg font-bold text-white">{bubbles[i % bubbles.length]}</span>
    </div>
  )
}

type Key = keyof LandingCopy['features']['items']

export function Features({ t, lang }: { t: LandingCopy; lang: string }) {
  const ref = useRef<HTMLElement>(null)

  useScene(ref, lang, ({ q }) => {
    q('.js-feature').forEach((article, i) => {
      const side = i % 2 ? 1 : -1
      const text = article.querySelector('.js-ftext')!
      const visual = article.querySelector('.js-fvisual')!
      gsap
        .timeline({ scrollTrigger: { trigger: article, start: 'top 78%' }, defaults: { ease: 'power3.out' } })
        .from(text.querySelector('.js-ficon'), { scale: 0, rotation: -40, duration: 0.5, ease: 'back.out(2)' }, 0)
        .from(text.querySelectorAll('h3, p'), { autoAlpha: 0, x: side * 36, duration: 0.6, stagger: 0.08 }, 0.05)
      gsap.from(visual, { y: 90, rotation: side * -7, scale: 0.92, ease: 'none', scrollTrigger: { trigger: visual, start: 'top 100%', end: 'top 55%', scrub: 0.6 } })
    })

    // Largada: cinco colunas acendem uma a uma; no fim, apagam todas de uma vez.
    const lights = gsap.timeline({ scrollTrigger: { trigger: q('.js-lights')[0], start: 'top 80%', end: 'top 22%', scrub: true } })
    for (let i = 0; i < 5; i++) lights.from(q(`.js-light-${i}`), { opacity: 0, duration: 0.01 }, 0.4 + i * 0.6)
    lights.to(q('.js-light'), { opacity: 0, duration: 0.01 }, 3.8).to({}, { duration: 0.4 })

    // Sol: gira e cresce enquanto o bloco passa.
    gsap.fromTo(
      q('.js-sun'),
      { rotation: -60, scale: 0.6 },
      { rotation: 60, scale: 1, ease: 'none', scrollTrigger: { trigger: q('.js-sun')[0], start: 'top bottom', end: 'bottom top', scrub: 0.6 } },
    )
  })

  const items: { key: Key; Icon: LucideIcon; tone: string; visual: ReactNode }[] = [
    { key: 'body', Icon: PersonStanding, tone: 'bg-sa-yonder text-sa-deep', visual: <ScrollBody lang={lang} /> },
    {
      key: 'mind',
      Icon: Timer,
      tone: 'bg-sa-rocket-600 text-white',
      visual: (
        <div className="js-lights relative mx-auto max-w-md">
          <Shot src="reaction.jpg" alt="" className="rotate-2 border-sa-neon-blue shadow-[10px_10px_0_0_#2e96f5]" />
          <StartLights />
        </div>
      ),
    },
    {
      key: 'weather',
      Icon: CloudSun,
      tone: 'bg-sa-yellow text-sa-deep',
      visual: (
        <div className="relative mx-auto max-w-sm">
          <Sun />
          <Shot src="space-weather.jpg" alt="" className="relative -rotate-2 border-sa-yellow shadow-[10px_10px_0_0_#eafe07]" />
        </div>
      ),
    },
    { key: 'ground', Icon: Radio, tone: 'bg-sa-martian text-white', visual: <Shot src="report.jpg" alt="" className="mx-auto max-w-md rotate-1 border-sa-rocket-600 shadow-[10px_10px_0_0_#d93400]" /> },
    { key: 'companion', Icon: MessageCircle, tone: 'bg-sa-neon-blue text-white', visual: <CompanionPill bubbles={t.hero.bubbles} /> },
  ]

  return (
    <section ref={ref} id="features" data-mood="happy" className="scroll-mt-16 bg-sa-deep">
      <div className="mx-auto max-w-6xl px-4 py-16 md:px-8 md:py-24">
        <H2 text={t.features.title} className="text-sa-yellow" />
        <div className="mt-14 grid gap-20 md:gap-28">
          {items.map(({ key, Icon, tone, visual }, i) => {
            const f = t.features.items[key]
            return (
              <article key={key} className="js-feature grid items-center gap-10 md:grid-cols-2 md:gap-16">
                <div className={cn('js-ftext', i % 2 === 1 && 'md:order-2')}>
                  <span aria-hidden className={cn('js-ficon grid size-12 place-items-center rounded-xl', tone)}>
                    <Icon className="size-6" />
                  </span>
                  <h3 className="mt-4 font-display text-3xl font-black md:text-4xl">{f.title}</h3>
                  <p className="mt-3 max-w-md text-lg leading-relaxed text-white/85">{f.text}</p>
                  <div className={cn('mt-4 flex items-center gap-3 text-sa-yonder', i % 2 === 1 && 'md:flex-row-reverse md:justify-end')}>
                    <Note>{f.note}</Note>
                    <Scribble className={cn('hidden shrink-0 md:block', i % 2 === 1 ? 'rotate-45' : '-rotate-[135deg]')} />
                  </div>
                </div>
                <div className={cn('js-fvisual min-w-0', i % 2 === 1 && 'md:order-1')}>{visual}</div>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
