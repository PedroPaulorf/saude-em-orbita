import { useRef } from 'react'
import type { LandingCopy } from '@/data/landing'
import { gsap, useScene } from './motion'

/*
  O que o app não faz (seção azul): um bilhete amarelo colado na página, com os itens aparecendo
  um a um. É o aviso de limites do projeto; fica perto do fim, antes do convite final.
*/

export function Honest({ t, lang }: { t: LandingCopy; lang: string }) {
  const ref = useRef<HTMLElement>(null)

  useScene(ref, lang, ({ q }) => {
    gsap
      .timeline({ scrollTrigger: { trigger: q('.js-postit')[0], start: 'top 80%' } })
      .from(q('.js-postit'), { scale: 1.25, rotation: 9, y: -30, autoAlpha: 0, duration: 0.45, ease: 'back.out(1.8)' })
      .from(q('.js-honest'), { autoAlpha: 0, x: -14, duration: 0.35, ease: 'power2.out', stagger: 0.12 }, '>-0.05')
  })

  return (
    <section ref={ref} data-mood="caring" className="bg-sa-neon-blue">
      <div className="mx-auto max-w-6xl px-4 py-16 md:px-8 md:py-24">
        <div className="js-postit mx-auto max-w-xl rotate-1 bg-sa-yellow p-7 text-sa-deep shadow-[8px_8px_0_0_#07173f] md:p-9">
          <h2 className="font-hand text-4xl font-bold md:text-5xl">{t.honest.title}</h2>
          <ul className="mt-4 grid gap-2.5 text-lg">
            {t.honest.items.map((x) => (
              <li key={x} className="js-honest flex gap-3">
                <span aria-hidden className="mt-2.5 size-2 shrink-0 rounded-full bg-sa-rocket-600" />
                {x}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
