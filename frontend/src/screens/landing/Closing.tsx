import { useRef, useState, type ReactNode } from 'react'
import { Code } from 'lucide-react'
import { CompanionFace } from '@/components/app/CompanionButton'
import { REPO_URL, type LandingCopy } from '@/data/landing'
import { Words } from './bits'
import { finePointer, gsap, useBlink, useScene } from './motion'

/*
  Chamada final + rodapé. O Seven, que acompanhou a página no canto, volta grande ao
  lado do convite. O botão é levemente "magnético": chega perto e ele vem ao encontro do ponteiro.
*/

export function Closing({ t, lang, cta }: { t: LandingCopy; lang: string; cta: ReactNode }) {
  const ref = useRef<HTMLElement>(null)
  const [near, setNear] = useState(false)
  const blink = useBlink(3300)

  useScene(ref, lang, ({ q }) => {
    gsap
      .timeline({ scrollTrigger: { trigger: q('.js-invite')[0], start: 'top 82%' } })
      .from(q('.js-end-face'), { scale: 0, rotation: -30, duration: 0.7, ease: 'back.out(1.7)' }, 0)
      .from(q('.js-end-orbit'), { scale: 0.3, autoAlpha: 0, duration: 0.9, ease: 'expo.out' }, 0.1)
      .from(q('.js-end-word'), { yPercent: 118, duration: 0.8, ease: 'power4.out', stagger: 0.07 }, 0.15)
      .from(q('.js-magnet'), { scale: 0, duration: 0.5, ease: 'back.out(2)' }, 0.55)

    if (!finePointer()) return
    const magnet = q('.js-magnet')[0]
    const x = gsap.quickTo(magnet, 'x', { duration: 0.5, ease: 'power3' })
    const y = gsap.quickTo(magnet, 'y', { duration: 0.5, ease: 'power3' })
    const move = (e: PointerEvent) => {
      const r = magnet.getBoundingClientRect()
      const dx = e.clientX - (r.left + r.width / 2)
      const dy = e.clientY - (r.top + r.height / 2)
      const close = Math.hypot(dx, dy) < 170
      x(close ? dx * 0.3 : 0)
      y(close ? dy * 0.3 : 0)
      setNear(close)
    }
    window.addEventListener('pointermove', move, { passive: true })
    return () => window.removeEventListener('pointermove', move)
  })

  return (
    <section ref={ref} id="closing" className="bg-sa-deep">
      <div className="mx-auto max-w-6xl px-4 py-16 md:px-8 md:py-24">
        <div className="js-invite flex flex-col items-start gap-8 md:flex-row md:items-center">
          <div aria-hidden className="relative grid size-[150px] shrink-0 place-items-center md:size-[190px]">
            <span className="js-end-orbit absolute inset-0">
              <span className="absolute inset-0 motion-safe:animate-orbit">
                <span className="absolute inset-x-0 top-[12%] h-[76%] rotate-[-20deg] rounded-[50%] border-[3px] border-sa-yellow" />
              </span>
            </span>
            <span className="js-end-face block">
              <CompanionFace mood={near ? 'caring' : 'happy'} blink={blink} className="size-[100px] p-1.5 md:size-[124px] md:p-2" />
            </span>
          </div>
          <p className="font-display text-4xl leading-[1.02] font-black text-sa-yellow md:flex-1 md:text-6xl">
            <Words text={t.footer.cta} mask wordClass="js-end-word" />
          </p>
          <span className="js-magnet inline-flex">{cta}</span>
        </div>

        <footer className="mt-16 grid gap-2 border-t border-white/15 pt-6 text-sm text-white/70">
          <p>{t.footer.built}</p>
          <p>{t.footer.notNasa}</p>
          <a href={REPO_URL} target="_blank" rel="noreferrer" className="inline-flex w-fit items-center gap-2 font-semibold text-sa-yonder">
            <Code aria-hidden className="size-4" /> {t.footer.code}
          </a>
        </footer>
      </div>
    </section>
  )
}
