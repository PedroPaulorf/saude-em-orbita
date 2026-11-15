import { useEffect, useRef, useState } from 'react'
import { CompanionFace } from '@/components/app/CompanionButton'
import { LANDING, type Lang } from '@/data/landing'
import type { Mood } from '@/lib/companion'
import { href } from '@/lib/route'
import { cn } from '@/lib/utils'
import { Wave } from './landing/bits'
import { Closing } from './landing/Closing'
import { Features } from './landing/Features'
import { Hero } from './landing/Hero'
import { How } from './landing/How'
import { draw, gsap, jumpTo, MOTION, ScrollTrigger, scrollToSection, scrollToTop, useBlink, useGSAP, useSmoothScroll } from './landing/motion'
import { Problem } from './landing/Problem'
import { Science } from './landing/Science'
import { Team } from './landing/Team'
import { Trust } from './landing/Trust'

/*
  Landing page: explica o projeto para quem abre o link e leva para a demo. Fica fora do AppShell.
  Vitrine nas cores do Space Apps: seções de cor sólida separadas por ondas, título grosso em
  amarelo, anotações manuscritas com setas, cartões levemente tortos. O rosto do companheiro e o
  boneco do Body são os componentes do próprio app, ao vivo.

  A página reage ao scroll (GSAP + ScrollTrigger, scroll suave com Lenis). Cada seção mora em
  screens/landing/ e monta a própria cena; este arquivo cuida do que atravessa a página inteira:
  cabeçalho fixo com a seção ativa, barra de progresso, o companheiro que acompanha no canto, os
  títulos que sobem, as setas que se desenham e as ondas. Com movimento reduzido nada disso roda e
  a página fica estática e completa. As regras estão em landing/motion.ts.
*/

const LANG_KEY = 'health7:lang'
const NAV = ['how', 'features', 'science', 'team'] as const
type NavId = (typeof NAV)[number]

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

export function Landing({ signedIn = false }: { signedIn?: boolean }) {
  const [lang, setLang] = useLang()
  const t = LANDING[lang]
  const demoHref = signedIn ? href('/') : href('/login')
  const demoLabel = signedIn ? t.nav.open : t.nav.demo

  const root = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState<NavId | null>(null)
  const [scrolled, setScrolled] = useState(false)
  const [mood, setMood] = useState<Mood>('curious')
  const [follow, setFollow] = useState(false)
  const blink = useBlink(4100)
  /** Posição do scroll antes de trocar de idioma: as cenas são refeitas e a página voltaria a pular. */
  const keepScroll = useRef<number | null>(null)

  useSmoothScroll()
  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [])

  // Roda depois das cenas das seções (efeito do pai vem por último), então já enxerga o espaço
  // que as seções presas acrescentam à página.
  useGSAP(
    () => {
      const q = gsap.utils.selector(root)

      // Estado do cabeçalho e do companheiro: não é animação, vale também com movimento reduzido.
      NAV.forEach((id) =>
        ScrollTrigger.create({
          trigger: `#${id}`,
          start: 'top 50%',
          end: 'bottom 50%',
          onToggle: (self) => setActive((now) => (self.isActive ? id : now === id ? null : now)),
        }),
      )
      ScrollTrigger.create({ start: 16, end: () => ScrollTrigger.maxScroll(window) + 2000, onToggle: (self) => setScrolled(self.isActive) })
      q('[data-mood]').forEach((section: HTMLElement) =>
        ScrollTrigger.create({
          trigger: section,
          start: 'top 55%',
          end: 'bottom 55%',
          onToggle: (self) => self.isActive && setMood(section.dataset.mood as Mood),
        }),
      )
      ScrollTrigger.create({ trigger: '#hero', start: 'bottom 45%', endTrigger: '#closing', end: 'top 45%', onToggle: (self) => setFollow(self.isActive) })
      gsap.fromTo(q('.js-progress'), { scaleX: 0 }, { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: true } })

      const mm = gsap.matchMedia()
      mm.add(MOTION, () => {
        // Títulos: as palavras sobem de trás do recorte.
        q('.js-rise').forEach((title: HTMLElement) =>
          gsap.from(title.querySelectorAll('.js-word'), {
            yPercent: 118,
            duration: 0.8,
            ease: 'power4.out',
            stagger: 0.06,
            scrollTrigger: { trigger: title, start: 'top 88%' },
          }),
        )
        // Setas manuscritas: desenhadas quando aparecem.
        q('.js-scribble').forEach((arrow: HTMLElement) => draw(arrow.querySelectorAll('path'), { scrollTrigger: { trigger: arrow, start: 'top 88%' } }))
        // Ondas: deslizam de lado enquanto passam.
        q('.js-wave').forEach((wave: HTMLElement, i: number) =>
          gsap.fromTo(
            wave.querySelector('svg'),
            { xPercent: i % 2 ? 5 : -5 },
            { xPercent: i % 2 ? -5 : 5, ease: 'none', scrollTrigger: { trigger: wave, start: 'top bottom', end: 'bottom top', scrub: true } },
          ),
        )
      })

      // Fontes mudam a altura do texto; trocar de idioma refaz tudo: recalcula e volta ao lugar.
      void document.fonts?.ready.then(() => ScrollTrigger.refresh())
      if (keepScroll.current != null) {
        ScrollTrigger.refresh()
        jumpTo(keepScroll.current)
        keepScroll.current = null
      }
      return () => mm.revert()
    },
    { dependencies: [lang], revertOnUpdate: true },
  )

  const switchLang = () => {
    keepScroll.current = window.scrollY
    setLang(lang === 'en' ? 'pt' : 'en')
  }

  const cta = (
    <a
      href={demoHref}
      className="inline-flex h-14 items-center rounded-full bg-sa-rocket-600 px-7 text-lg font-bold text-white no-underline shadow-[5px_5px_0_0_#eafe07] transition-[translate,background-color,box-shadow] hover:-translate-y-0.5 hover:bg-sa-rocket hover:shadow-[7px_8px_0_0_#eafe07]"
    >
      {demoLabel}
    </a>
  )

  return (
    <div ref={root} className="min-h-screen overflow-x-clip bg-sa-deep text-white">
      {/* ---------- cabeçalho fixo ---------- */}
      <header className={cn('fixed inset-x-0 top-0 z-50 transition-colors duration-300', scrolled ? 'bg-sa-deep' : 'bg-transparent')}>
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 md:px-8">
          <a href={href('/welcome')} onClick={() => scrollToTop()} className="font-display text-2xl font-black tracking-[0.05em] text-sa-yellow uppercase no-underline">
            Health7
          </a>
          <nav aria-label="Sections" className="ml-auto hidden lg:block">
            <ul className="flex items-center gap-1">
              {NAV.map((id) => (
                <li key={id}>
                  <button
                    type="button"
                    onClick={() => scrollToSection(id)}
                    aria-current={active === id ? 'true' : undefined}
                    className={cn(
                      'h-10 rounded-full px-3.5 font-mono text-sm transition-colors',
                      active === id ? 'bg-sa-yellow text-sa-deep' : 'text-sa-yellow hover:bg-white/10',
                    )}
                  >
                    {t.nav[id]}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
          <button
            type="button"
            onClick={switchLang}
            aria-label={t.nav.switchLabel}
            title={t.nav.switchTo}
            className="ml-auto inline-flex h-10 items-center rounded-full border-2 border-white/30 px-3.5 font-mono text-sm font-bold text-white hover:border-white lg:ml-2"
          >
            {lang === 'en' ? 'PT' : 'EN'}
          </button>
          <a href={demoHref} className="hidden h-10 items-center rounded-full bg-sa-rocket-600 px-4 text-sm font-bold text-white no-underline hover:bg-sa-rocket sm:inline-flex">
            {demoLabel}
          </a>
        </div>
        <span aria-hidden className="js-progress absolute inset-x-0 bottom-0 block h-[3px] origin-left bg-sa-yellow" />
      </header>

      <main>
        <Hero t={t} lang={lang} cta={cta} />
        <Wave className="bg-sa-deep" fill="fill-sa-neon-blue" />
        <Problem t={t} lang={lang} />
        <Wave className="bg-sa-neon-blue" fill="fill-sa-yellow" flip />
        <How t={t} lang={lang} />
        <Wave className="bg-sa-yellow" fill="fill-sa-deep" />
        <Features t={t} lang={lang} />
        <Wave className="bg-sa-deep" fill="fill-sa-rocket-600" flip />
        <Trust t={t} lang={lang} />
        <Wave className="bg-sa-rocket-600" fill="fill-sa-deep" />
        <Science t={t} lang={lang} />
        <Wave className="bg-sa-deep" fill="fill-sa-neon-blue" flip />
        <Team t={t} lang={lang} />
        <Wave className="bg-sa-neon-blue" fill="fill-sa-deep" />
        <Closing t={t} lang={lang} cta={cta} />
      </main>

      {/* ---------- o companheiro acompanha a página e leva para a demo ---------- */}
      <a
        href={demoHref}
        aria-label={demoLabel}
        aria-hidden={!follow}
        tabIndex={follow ? 0 : -1}
        className={cn(
          'group fixed right-4 bottom-4 z-40 flex items-center gap-3 no-underline transition-[opacity,translate,scale] duration-300 md:right-6 md:bottom-6',
          follow ? 'opacity-100' : 'pointer-events-none translate-y-8 scale-50 opacity-0',
        )}
      >
        <span className="hidden translate-x-2 rounded-full bg-white px-4 py-2 font-bold text-sa-deep opacity-0 shadow-[4px_4px_0_0_#07173f] transition-[opacity,translate] group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100 md:block">
          {demoLabel}
        </span>
        <CompanionFace mood={mood} blink={blink} className="size-16 shadow-[4px_4px_0_0_#07173f] ring-4 ring-white md:size-[72px]" />
      </a>
    </div>
  )
}
