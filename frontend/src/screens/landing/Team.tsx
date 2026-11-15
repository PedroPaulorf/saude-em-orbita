import { useRef } from 'react'
import { Camera } from 'lucide-react'
import { landingImg, TEAM, type LandingCopy } from '@/data/landing'
import { cn } from '@/lib/utils'
import { H2, Note } from './bits'
import { gsap, useScene } from './motion'

/*
  Time + o que o app não faz (seção azul): as polaroids caem na mesa, cada uma com a sua rotação,
  e o bilhete amarelo é colado por cima, com os itens aparecendo um a um.
*/

export function Team({ t, lang }: { t: LandingCopy; lang: string }) {
  const ref = useRef<HTMLElement>(null)

  useScene(ref, lang, ({ q }) => {
    gsap.from(q('.js-team-note'), { autoAlpha: 0, x: -12, rotation: -3, duration: 0.5, scrollTrigger: { trigger: q('.js-team-note')[0], start: 'top 88%' } })
    gsap.from(q('.js-polaroid'), {
      y: -90,
      rotation: () => gsap.utils.random(-24, 24),
      scale: 1.15,
      autoAlpha: 0,
      duration: 0.6,
      ease: 'back.out(1.5)',
      stagger: 0.09,
      scrollTrigger: { trigger: q('.js-polaroids')[0], start: 'top 82%' },
    })
    gsap
      .timeline({ scrollTrigger: { trigger: q('.js-postit')[0], start: 'top 80%' } })
      .from(q('.js-postit'), { scale: 1.25, rotation: 9, y: -30, autoAlpha: 0, duration: 0.45, ease: 'back.out(1.8)' })
      .from(q('.js-honest'), { autoAlpha: 0, x: -14, duration: 0.35, ease: 'power2.out', stagger: 0.12 }, '>-0.05')
  })

  return (
    <section ref={ref} id="team" data-mood="caring" className="scroll-mt-16 bg-sa-neon-blue">
      <div className="mx-auto max-w-6xl px-4 py-16 md:px-8 md:py-24">
        <H2 text={t.team.title} />
        <Note className="js-team-note mt-3 text-sa-yellow">{t.team.note}</Note>
        <ul className="js-polaroids mt-12 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-6">
          {TEAM.map((m, i) => (
            <li key={i} className={cn('js-polaroid rounded-sm bg-white p-3 pb-4 text-sa-deep shadow-[5px_5px_0_0_#07173f]', i % 2 ? 'rotate-2' : '-rotate-2')}>
              {m.photo ? (
                <img src={landingImg(m.photo)} alt="" className="aspect-square w-full object-cover" />
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

        <div className="js-postit mx-auto mt-20 max-w-xl rotate-1 bg-sa-yellow p-7 text-sa-deep shadow-[8px_8px_0_0_#07173f] md:p-9">
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
