import { useRef } from 'react'
import { ExternalLink } from 'lucide-react'
import type { LandingCopy } from '@/data/landing'
import { H2 } from './bits'
import { gsap, ScrollTrigger, useScene } from './motion'

/* Ciência e fontes: a lista entra em fila, cada linha vinda do seu lado. */

export function Science({ t, lang }: { t: LandingCopy; lang: string }) {
  const ref = useRef<HTMLElement>(null)

  useScene(ref, lang, ({ q }) => {
    const rows = q('.js-source')
    gsap.set(rows, { autoAlpha: 0, x: (i: number) => (i % 2 ? 28 : -28) })
    ScrollTrigger.batch(rows, {
      start: 'top 90%',
      once: true,
      onEnter: (batch) => gsap.to(batch, { autoAlpha: 1, x: 0, duration: 0.5, ease: 'power3.out', stagger: 0.07, overwrite: true }),
    })
  })

  return (
    <section ref={ref} id="science" data-mood="thinking" className="scroll-mt-16 bg-sa-deep">
      <div className="mx-auto max-w-6xl px-4 py-16 md:px-8 md:py-24">
        <H2 text={t.science.title} className="text-sa-yellow" />
        <p className="mt-4 text-lg text-white/80">{t.science.text}</p>
        <ul className="mt-10 grid gap-3 md:grid-cols-2">
          {t.science.sources.map((s) => (
            <li key={s.href} className="js-source">
              <a
                href={s.href}
                target="_blank"
                rel="noreferrer"
                className="group flex h-full items-start justify-between gap-4 rounded-xl border-2 border-white/15 p-4 text-white no-underline transition-colors hover:border-sa-yellow hover:bg-white/[0.04]"
              >
                <span className="font-semibold">{s.label}</span>
                <ExternalLink aria-hidden className="mt-0.5 size-4 shrink-0 text-sa-yonder transition-[translate,color] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-sa-yellow" />
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
