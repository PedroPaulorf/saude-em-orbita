import { useRef } from 'react'
import type { LandingCopy } from '@/data/landing'
import { cn } from '@/lib/utils'
import { H2 } from './bits'
import { gsap, useScene } from './motion'

/*
  Por que confiar (seção laranja): os cartões chegam empilhados no meio, como um baralho, e se
  espalham até o lugar de cada um conforme o scroll.
*/

const CARD = [
  'bg-sa-deep text-white -rotate-1',
  'bg-white text-sa-deep rotate-1',
  'bg-sa-yellow text-sa-deep -rotate-[0.5deg]',
  'bg-sa-deep text-white rotate-[0.75deg]',
  'bg-white text-sa-deep -rotate-1',
]

export function Trust({ t, lang }: { t: LandingCopy; lang: string }) {
  const ref = useRef<HTMLElement>(null)

  useScene(ref, lang, ({ q }) => {
    const deck = q('.js-deck')[0]
    const cards = q('.js-card')
    // Distância de cada cartão até o centro do baralho (medida sem transform, a cada refresh).
    const toCenter = (axis: 'x' | 'y') => (_: number, el: HTMLElement) =>
      axis === 'x' ? deck.offsetWidth / 2 - (el.offsetLeft + el.offsetWidth / 2) : deck.offsetHeight / 2 - (el.offsetTop + el.offsetHeight / 2)
    gsap.from(cards, {
      x: toCenter('x'),
      y: toCenter('y'),
      rotation: (i: number) => (i - 2) * 7,
      scale: 0.86,
      ease: 'power2.out',
      stagger: { each: 0.06, from: 'end' },
      scrollTrigger: { trigger: deck, start: 'top 88%', end: 'top 28%', scrub: 0.7, invalidateOnRefresh: true },
    })
  })

  return (
    <section ref={ref} data-mood="wink" className="bg-sa-rocket-600">
      <div className="mx-auto max-w-6xl px-4 py-16 md:px-8 md:py-24">
        <H2 text={t.why.title} />
        <ul className="js-deck relative mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {t.why.items.map((w, i) => (
            <li key={w.title} className={cn('js-card rounded-2xl p-6 shadow-[6px_6px_0_0_#07173f]', CARD[i % CARD.length])}>
              <h3 className="font-display text-2xl leading-tight font-black">{w.title}</h3>
              <p className="mt-3 text-base leading-relaxed opacity-90">{w.text}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
