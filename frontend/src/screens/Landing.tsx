import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import { Camera, CloudSun, Code, ExternalLink, MessageCircle, PersonStanding, Play, Radio, Timer } from 'lucide-react'
import { BodyAvatar, type BodyView } from '@/components/app/BodyAvatar'
import { CompanionFace } from '@/components/app/CompanionButton'
import { LANDING, PITCH_VIDEO_URL, REPO_URL, TEAM, type Lang, type LandingCopy } from '@/data/landing'
import type { Mood } from '@/lib/companion'
import { href } from '@/lib/route'
import { cn } from '@/lib/utils'
import type { BodyRegion } from '@/types'

/*
  Landing page: explica o projeto para quem abre o link e leva para a demo. Fica fora do AppShell.
  Vitrine, mas nas cores do Space Apps: seções de cor sólida separadas por ondas, título grosso em
  amarelo, anotações manuscritas com setas, cartões levemente tortos. O rosto do companheiro e o
  boneco do Body são os componentes do próprio app, ao vivo. Animações só de transform/opacity e
  paradas com movimento reduzido.
*/

const LANG_KEY = 'health7:lang'
const img = (name: string) => `${import.meta.env.BASE_URL}landing/${name}`
const reducedMotion = () => typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

function useLang(): [Lang, (l: Lang) => void] {
  const [lang, setLang] = useState<Lang>(() => {
    try {
      return localStorage.getItem(LANG_KEY) === 'pt' ? 'pt' : 'en'
    } catch {
      return 'en'
    }
  })
  useEffect(() => {
    document.documentElement.lang = lang === 'pt' ? 'pt-BR' : 'en'
    try {
      localStorage.setItem(LANG_KEY, lang)
    } catch {
      /* Sem armazenamento: o idioma vale só nesta visita. */
    }
    return () => {
      document.documentElement.lang = 'en'
    }
  }, [lang])
  return [lang, setLang]
}

// ---------- peças ----------

/** Anotação manuscrita. */
function Note({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn('font-hand text-xl leading-tight font-medium md:text-2xl', className)}>{children}</p>
}

/** Seta desenhada à mão; gire/espelhe com className. */
function Scribble({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 80 50" aria-hidden className={cn('w-16 overflow-visible md:w-20', className)} fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
      <path d="M76 6 C 60 2, 32 12, 14 40" />
      <path d="M10 27 L 13 41 L 27 38" />
    </svg>
  )
}

/** Onda entre duas seções: fundo = seção de cima, preenchimento = seção de baixo. */
function Wave({ className, fill, flip }: { className: string; fill: string; flip?: boolean }) {
  return (
    <div aria-hidden className={cn('-mb-px', className)}>
      <svg viewBox="0 0 1440 120" preserveAspectRatio="none" className={cn('block h-14 w-full md:h-24', fill, flip && '-scale-x-100')}>
        <path d="M0 74 C 220 8, 430 6, 660 58 S 1110 132, 1440 36 L 1440 120 L 0 120 Z" />
      </svg>
    </div>
  )
}

/** Print real do app, com moldura e sombra dura. */
function Shot({ src, alt, className }: { src: string; alt: string; className?: string }) {
  return <img src={img(src)} alt={alt} loading="lazy" decoding="async" className={cn('w-full rounded-2xl border-4 border-sa-deep bg-sa-deep shadow-[8px_8px_0_0_#07173f]', className)} />
}

const MOODS: Mood[] = ['happy', 'curious', 'thinking', 'caring', 'wink']

/** Rosto do companheiro dentro de duas órbitas, trocando de expressão e de frase. */
function HeroFace({ bubbles }: { bubbles: string[] }) {
  const [i, setI] = useState(0)
  const [blink, setBlink] = useState(false)
  useEffect(() => {
    if (reducedMotion()) return
    const talk = setInterval(() => setI((n) => n + 1), 2800)
    const eyes = setInterval(() => {
      setBlink(true)
      setTimeout(() => setBlink(false), 160)
    }, 3700)
    return () => {
      clearInterval(talk)
      clearInterval(eyes)
    }
  }, [])
  return (
    <div className="relative grid size-[270px] place-items-center sm:size-[340px]">
      <span aria-hidden className="absolute inset-0 motion-safe:animate-orbit">
        <span className="absolute inset-x-0 top-[10%] h-[80%] rotate-[-20deg] rounded-[50%] border-[3px] border-sa-yellow" />
      </span>
      <span aria-hidden className="absolute -inset-3 motion-safe:animate-orbit-reverse">
        <span className="absolute inset-y-0 left-[12%] w-[76%] rotate-[15deg] rounded-[50%] border-[3px] border-sa-yonder" />
      </span>
      <CompanionFace mood={MOODS[i % MOODS.length]} blink={blink} className="relative size-[170px] p-2.5 sm:size-[210px] sm:p-3" />
      <span
        aria-hidden
        className="absolute -top-1 right-0 max-w-[190px] rounded-2xl rounded-bl-sm bg-white px-4 py-2 text-base leading-snug font-bold text-sa-deep shadow-[4px_4px_0_0_#eafe07] sm:right-[-24px]"
      >
        {bubbles[i % bubbles.length]}
      </span>
    </div>
  )
}

const DEMO_REGIONS: BodyRegion[] = [
  { id: 'head', status: 'baseline' },
  { id: 'chest', status: 'attention' },
  { id: 'core', status: 'baseline' },
  { id: 'leftArm', status: 'baseline' },
  { id: 'rightArm', status: 'baseline' },
  { id: 'leftLeg', status: 'flagged' },
  { id: 'rightLeg', status: 'baseline' },
]

/** O boneco do Body virando de frente para costas sozinho. */
function TurningBody() {
  const [view, setView] = useState<BodyView>('front')
  useEffect(() => {
    if (reducedMotion()) return
    const t = setInterval(() => setView((v) => (v === 'front' ? 'back' : 'front')), 3200)
    return () => clearInterval(t)
  }, [])
  return (
    <div inert aria-hidden className="mx-auto w-fit" style={{ '--avatar-h': 'min(420px, 70vw)' } as CSSProperties}>
      <BodyAvatar key={view} view={view} regions={DEMO_REGIONS} compact className="motion-safe:animate-body-turn" />
    </div>
  )
}

/** Comparação ao vivo: o que o app mostra quando uma medida sai da sua linha de base. */
function CompareCard({ c }: { c: LandingCopy['how']['compare'] }) {
  return (
    <div className="rounded-2xl border-4 border-sa-deep bg-sa-deep p-5 text-white shadow-[8px_8px_0_0_#07173f]">
      <div className="flex items-center justify-between gap-3">
        <p className="font-semibold text-white/80">{c.label}</p>
        <span className="rounded-full bg-sa-yellow px-3 py-0.5 text-sm font-bold text-sa-deep">{c.state}</span>
      </div>
      <p className="mt-2 font-mono text-5xl">
        67<span className="ml-1.5 text-lg text-white/70">bpm</span>
      </p>
      <p className="mt-1 font-mono text-white/75">
        {c.baseline} 62 <span className="text-sa-yellow">+5</span>
      </p>
      <p className="mt-4 border-t border-white/15 pt-3 text-sm text-white/80">{c.rule}</p>
    </div>
  )
}

const PHASE = ['bg-sa-rocket-600 text-white', 'bg-sa-yellow text-sa-deep', 'bg-sa-yonder text-sa-deep']

/** Roteiro preventivo em miniatura: um passo por fase, como no app. */
function MiniRoadmap({ r }: { r: LandingCopy['how']['roadmap'] }) {
  return (
    <ol className="grid gap-3 rounded-2xl border-4 border-sa-deep bg-sa-deep p-4 text-white shadow-[8px_8px_0_0_#07173f]">
      {r.phases.map((p, i) => (
        <li key={p} className="rounded-xl bg-white/[0.06] p-3">
          <span className={cn('rounded-md px-2 py-0.5 text-sm font-bold', PHASE[i])}>{p}</span>
          <p className="mt-2 leading-snug">{r.items[i]}</p>
          {i === 0 && <p className="mt-1.5 text-sm font-semibold text-sa-yonder underline underline-offset-2">{r.risk}</p>}
        </li>
      ))}
    </ol>
  )
}

const STICKER = [
  'bg-sa-yellow text-sa-deep -rotate-3',
  'bg-white text-sa-deep rotate-2',
  'bg-sa-deep text-white -rotate-1',
  'bg-sa-rocket-600 text-white rotate-3',
  'bg-sa-yonder text-sa-deep -rotate-2',
]
const CARD = [
  'bg-sa-deep text-white -rotate-1',
  'bg-white text-sa-deep rotate-1',
  'bg-sa-yellow text-sa-deep -rotate-[0.5deg]',
  'bg-sa-deep text-white rotate-[0.75deg]',
  'bg-white text-sa-deep -rotate-1',
]

function Section({ id, className, children }: { id?: string; className: string; children: ReactNode }) {
  return (
    <section id={id} className={cn('scroll-mt-4', className)}>
      <div className="mx-auto max-w-6xl px-4 py-16 md:px-8 md:py-24">{children}</div>
    </section>
  )
}

function H2({ children, className }: { children: ReactNode; className?: string }) {
  return <h2 className={cn('font-display text-4xl leading-[1.02] font-black md:text-6xl', className)}>{children}</h2>
}

// ---------- página ----------

export function Landing({ signedIn = false }: { signedIn?: boolean }) {
  const [lang, setLang] = useLang()
  const t = LANDING[lang]
  const demoHref = signedIn ? href('/') : href('/login')
  const demoLabel = signedIn ? t.nav.open : t.nav.demo
  const go = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth' })
  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [])

  const cta = (className?: string) => (
    <a
      href={demoHref}
      className={cn(
        'inline-flex h-14 items-center rounded-full bg-sa-rocket-600 px-7 text-lg font-bold text-white no-underline shadow-[5px_5px_0_0_#eafe07] transition-transform hover:-translate-y-0.5 hover:bg-sa-rocket',
        className,
      )}
    >
      {demoLabel}
    </a>
  )

  const features = [
    { key: 'body', Icon: PersonStanding, tone: 'bg-sa-yonder text-sa-deep', visual: <TurningBody /> },
    { key: 'mind', Icon: Timer, tone: 'bg-sa-rocket-600 text-white', visual: <Shot src="reaction.jpg" alt="" className="mx-auto max-w-md rotate-2 border-sa-neon-blue shadow-[10px_10px_0_0_#2e96f5]" /> },
    { key: 'weather', Icon: CloudSun, tone: 'bg-sa-yellow text-sa-deep', visual: <Shot src="space-weather.jpg" alt="" className="mx-auto max-w-sm -rotate-2 border-sa-yellow shadow-[10px_10px_0_0_#eafe07]" /> },
    { key: 'ground', Icon: Radio, tone: 'bg-sa-martian text-white', visual: <Shot src="report.jpg" alt="" className="mx-auto max-w-md rotate-1 border-sa-rocket-600 shadow-[10px_10px_0_0_#d93400]" /> },
    {
      key: 'companion',
      Icon: MessageCircle,
      tone: 'bg-sa-neon-blue text-white',
      visual: (
        <div aria-hidden className="mx-auto flex w-full max-w-md items-center gap-4 rounded-full border-2 border-sa-neon-blue bg-[#0b2257] p-2.5 pr-5 shadow-[10px_10px_0_0_#0960e1]">
          <CompanionFace mood="happy" className="size-[84px] p-1.5" />
          <span className="flex-1 text-lg font-bold text-white">{t.hero.bubbles[0]}</span>
        </div>
      ),
    },
  ] as const

  return (
    <div className="min-h-screen overflow-x-clip bg-sa-deep text-white">
      {/* ---------- topo ---------- */}
      <section className="bg-sa-deep">
        <header className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-5 md:px-8">
          <a href={href('/welcome')} className="font-display text-2xl font-black tracking-[0.05em] text-sa-yellow uppercase no-underline">
            Health7
          </a>
          <nav aria-label="Sections" className="ml-auto hidden lg:block">
            <ul className="flex items-center gap-1">
              {(['how', 'features', 'science', 'team'] as const).map((id) => (
                <li key={id}>
                  <button type="button" onClick={() => go(id)} className="h-10 rounded-full px-3.5 font-mono text-sm text-sa-yellow hover:bg-white/10">
                    {t.nav[id]}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
          <button
            type="button"
            onClick={() => setLang(lang === 'en' ? 'pt' : 'en')}
            aria-label={t.nav.switchLabel}
            title={t.nav.switchTo}
            className="ml-auto inline-flex h-10 items-center rounded-full border-2 border-white/30 px-3.5 font-mono text-sm font-bold text-white hover:border-white lg:ml-2"
          >
            {lang === 'en' ? 'PT' : 'EN'}
          </button>
          <a href={demoHref} className="hidden h-10 items-center rounded-full bg-sa-rocket-600 px-4 text-sm font-bold text-white no-underline hover:bg-sa-rocket sm:inline-flex">
            {demoLabel}
          </a>
        </header>

        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 pt-6 pb-12 md:px-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:pt-12 lg:pb-20">
          <div className="relative order-2 mx-auto lg:order-1">
            <HeroFace bubbles={t.hero.bubbles} />
            <div aria-hidden className="pointer-events-none absolute -bottom-16 -left-16 hidden flex-col items-start text-sa-yonder sm:flex xl:-left-28">
              <Scribble className="ml-28 rotate-180" />
              <Note className="max-w-[220px]">{t.hero.noteFace}</Note>
            </div>
          </div>
          <div className="order-1 lg:order-2">
            <Note className="text-sa-yonder">{t.hero.kicker}</Note>
            <h1 className="mt-2 font-display text-5xl leading-[0.95] font-black text-balance text-sa-yellow sm:text-6xl md:text-7xl">{t.hero.title}</h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/85 md:text-xl">{t.hero.sub}</p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              {cta()}
              <button type="button" onClick={() => go('how')} className="h-14 rounded-full px-5 text-lg font-bold text-white underline decoration-sa-yellow decoration-2 underline-offset-4 hover:bg-white/10">
                {t.hero.secondary}
              </button>
            </div>
            <Note className="mt-6 text-sa-yellow">{t.hero.noteNever}</Note>
          </div>
        </div>
      </section>
      <Wave className="bg-sa-deep" fill="fill-sa-neon-blue" />

      {/* ---------- o problema e a ideia ---------- */}
      <Section className="bg-sa-neon-blue">
        <H2>{t.problem.title}</H2>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-white/90 md:text-xl">{t.problem.text}</p>
        <ul className="mt-10 flex max-w-4xl flex-wrap gap-3">
          {t.problem.stickers.map((s, i) => (
            <li key={s} className={cn('rounded-full px-4 py-2 text-base font-bold shadow-[3px_3px_0_0_#07173f] md:text-lg', STICKER[i % STICKER.length])}>
              {s}
            </li>
          ))}
        </ul>
        <div className="mt-4 flex items-start gap-2 text-sa-yellow">
          <Scribble className="mt-1 rotate-[100deg]" />
          <Note className="mt-6 max-w-sm">{t.problem.note}</Note>
        </div>

        <div className="mt-16 max-w-4xl md:mt-24">
          <p className="font-display text-3xl leading-tight font-black text-balance md:text-5xl">{t.idea.title}</p>
          <Note className="mt-3 text-sa-yellow">{t.idea.note}</Note>
        </div>
      </Section>
      <Wave className="bg-sa-neon-blue" fill="fill-sa-yellow" flip />

      {/* ---------- como funciona ---------- */}
      <Section id="how" className="bg-sa-yellow text-sa-deep">
        <H2>{t.how.title}</H2>
        <ol className="mt-12 grid gap-14 lg:grid-cols-3 lg:gap-10">
          {t.how.steps.map((s, i) => (
            <li key={s.title} className="flex flex-col gap-4">
              <span aria-hidden className="font-display text-7xl leading-none font-black text-sa-rocket-600">0{i + 1}</span>
              <h3 className="font-display text-2xl font-black md:text-3xl">{s.title}</h3>
              <p className="text-lg leading-relaxed">{s.text}</p>
              <div className="mt-2">
                {i === 0 && <Shot src="checkup.jpg" alt="" className="-rotate-2" />}
                {i === 1 && <div className="rotate-[1.5deg]"><CompareCard c={t.how.compare} /></div>}
                {i === 2 && <div className="-rotate-1"><MiniRoadmap r={t.how.roadmap} /></div>}
              </div>
            </li>
          ))}
        </ol>
      </Section>
      <Wave className="bg-sa-yellow" fill="fill-sa-deep" />

      {/* ---------- recursos ---------- */}
      <Section id="features" className="bg-sa-deep">
        <H2 className="text-sa-yellow">{t.features.title}</H2>
        <div className="mt-14 grid gap-20 md:gap-28">
          {features.map(({ key, Icon, tone, visual }, i) => {
            const f = t.features.items[key]
            return (
              <article key={key} className="grid items-center gap-10 md:grid-cols-2 md:gap-16">
                <div className={cn(i % 2 === 1 && 'md:order-2')}>
                  <span aria-hidden className={cn('grid size-12 place-items-center rounded-xl', tone)}>
                    <Icon className="size-6" />
                  </span>
                  <h3 className="mt-4 font-display text-3xl font-black md:text-4xl">{f.title}</h3>
                  <p className="mt-3 max-w-md text-lg leading-relaxed text-white/85">{f.text}</p>
                  <div className={cn('mt-4 flex items-center gap-3 text-sa-yonder', i % 2 === 1 && 'md:flex-row-reverse md:justify-end')}>
                    <Note>{f.note}</Note>
                    <Scribble className={cn('hidden shrink-0 md:block', i % 2 === 1 ? 'rotate-45' : '-rotate-[135deg]')} />
                  </div>
                </div>
                <div className={cn('min-w-0', i % 2 === 1 && 'md:order-1')}>{visual}</div>
              </article>
            )
          })}
        </div>
      </Section>
      <Wave className="bg-sa-deep" fill="fill-sa-rocket-600" flip />

      {/* ---------- por que confiar ---------- */}
      <Section className="bg-sa-rocket-600">
        <H2>{t.why.title}</H2>
        <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {t.why.items.map((w, i) => (
            <li key={w.title} className={cn('rounded-2xl p-6 shadow-[6px_6px_0_0_#07173f]', CARD[i % CARD.length])}>
              <h3 className="font-display text-2xl leading-tight font-black">{w.title}</h3>
              <p className="mt-3 text-base leading-relaxed opacity-90">{w.text}</p>
            </li>
          ))}
        </ul>
      </Section>
      <Wave className="bg-sa-rocket-600" fill="fill-sa-deep" />

      {/* ---------- ciência e fontes ---------- */}
      <Section id="science" className="bg-sa-deep">
        <H2 className="text-sa-yellow">{t.science.title}</H2>
        <p className="mt-4 text-lg text-white/80">{t.science.text}</p>
        <ul className="mt-10 grid gap-3 md:grid-cols-2">
          {t.science.sources.map((s) => (
            <li key={s.href}>
              <a
                href={s.href}
                target="_blank"
                rel="noreferrer"
                className="flex h-full items-start justify-between gap-4 rounded-xl border-2 border-white/15 p-4 text-white no-underline hover:border-sa-yellow"
              >
                <span className="font-semibold">{s.label}</span>
                <ExternalLink aria-hidden className="mt-0.5 size-4 shrink-0 text-sa-yonder" />
              </a>
            </li>
          ))}
        </ul>
      </Section>
      <Wave className="bg-sa-deep" fill="fill-sa-neon-blue" flip />

      {/* ---------- time + o que não faz ---------- */}
      <Section id="team" className="bg-sa-neon-blue">
        <H2>{t.team.title}</H2>
        <Note className="mt-3 text-sa-yellow">{t.team.note}</Note>
        <ul className="mt-12 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-6">
          {TEAM.map((m, i) => (
            <li key={i} className={cn('rounded-sm bg-white p-3 pb-4 text-sa-deep shadow-[5px_5px_0_0_#07173f]', i % 2 ? 'rotate-2' : '-rotate-2')}>
              {m.photo ? (
                <img src={img(m.photo)} alt="" className="aspect-square w-full object-cover" />
              ) : (
                <div className="grid aspect-square w-full place-items-center bg-[#dfe6f3] text-sa-deep/60">
                  <span className="grid place-items-center gap-1 text-center">
                    <Camera aria-hidden className="size-8" />
                    <span className="font-hand text-xl">{t.team.photo}</span>
                  </span>
                </div>
              )}
              <p className="mt-3 font-display text-base font-black">{m.name ?? t.team.name}</p>
              <p className="text-sm text-sa-deep/70">{m.role ?? t.team.role}</p>
            </li>
          ))}
        </ul>

        <div className="mx-auto mt-20 max-w-xl rotate-1 bg-sa-yellow p-7 text-sa-deep shadow-[8px_8px_0_0_#07173f] md:p-9">
          <h2 className="font-hand text-4xl font-bold md:text-5xl">{t.honest.title}</h2>
          <ul className="mt-4 grid gap-2.5 text-lg">
            {t.honest.items.map((x) => (
              <li key={x} className="flex gap-3">
                <span aria-hidden className="mt-2.5 size-2 shrink-0 rounded-full bg-sa-rocket-600" />
                {x}
              </li>
            ))}
          </ul>
        </div>
      </Section>
      <Wave className="bg-sa-neon-blue" fill="fill-sa-deep" />

      {/* ---------- pitch + rodapé ---------- */}
      <Section className="bg-sa-deep">
        <H2 className="text-sa-yellow">{t.pitch.title}</H2>
        <div className="mx-auto mt-10 aspect-video w-full max-w-3xl overflow-hidden rounded-2xl border-4 border-dashed border-white/25">
          {PITCH_VIDEO_URL ? (
            <iframe src={PITCH_VIDEO_URL} title={t.pitch.title} className="size-full" allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen />
          ) : (
            <div className="grid size-full place-items-center text-center">
              <span className="grid place-items-center gap-3">
                <span aria-hidden className="grid size-16 place-items-center rounded-full bg-sa-rocket-600 text-white">
                  <Play className="size-7 translate-x-0.5" />
                </span>
                <Note className="text-sa-yonder">{t.pitch.soon}</Note>
              </span>
            </div>
          )}
        </div>

        <div className="mt-24 flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
          <p className="font-display text-4xl font-black text-sa-yellow md:text-5xl">{t.footer.cta}</p>
          {cta()}
        </div>
        <footer className="mt-16 grid gap-2 border-t border-white/15 pt-6 text-sm text-white/70">
          <p>{t.footer.built}</p>
          <p>{t.footer.notNasa}</p>
          <a href={REPO_URL} target="_blank" rel="noreferrer" className="inline-flex w-fit items-center gap-2 font-semibold text-sa-yonder">
            <Code aria-hidden className="size-4" /> {t.footer.code}
          </a>
        </footer>
      </Section>
    </div>
  )
}
