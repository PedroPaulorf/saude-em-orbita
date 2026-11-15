import { Fragment, type ReactNode, type Ref } from 'react'
import { landingImg } from '@/data/landing'
import { cn } from '@/lib/utils'

/* Peças de desenho da landing page, usadas por todas as seções. */

/** Anotação manuscrita. */
export function Note({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn('font-hand text-xl leading-tight font-medium md:text-2xl', className)}>{children}</p>
}

/**
 * Seta desenhada à mão; gire/espelhe com className. Por padrão ela se desenha sozinha quando entra
 * na tela (classe js-scribble, tratada em Landing.tsx); com auto={false} quem anima é a seção.
 */
export function Scribble({ className, auto = true }: { className?: string; auto?: boolean }) {
  return (
    <svg
      viewBox="0 0 80 50"
      aria-hidden
      className={cn('w-16 overflow-visible md:w-20', auto && 'js-scribble', className)}
      fill="none"
      stroke="currentColor"
      strokeWidth={2.4}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path pathLength={1} d="M76 6 C 60 2, 32 12, 14 40" />
      <path pathLength={1} d="M10 27 L 13 41 L 27 38" />
    </svg>
  )
}

/** Onda entre duas seções: fundo = seção de cima, preenchimento = seção de baixo. Desliza de lado com o scroll. */
export function Wave({ className, fill, flip }: { className: string; fill: string; flip?: boolean }) {
  return (
    <div aria-hidden className={cn('js-wave -mb-px overflow-hidden', className)}>
      <svg viewBox="0 0 1440 120" preserveAspectRatio="none" className={cn('-ml-[6%] block h-14 w-[112%] max-w-none md:h-24', fill, flip && '-scale-x-100')}>
        <path d="M0 74 C 220 8, 430 6, 660 58 S 1110 132, 1440 36 L 1440 120 L 0 120 Z" />
      </svg>
    </div>
  )
}

/** Tamanho real de cada print, para o navegador reservar o espaço antes de a imagem chegar. */
const SHOT_SIZE: Record<string, [number, number]> = {
  'checkup.jpg': [1088, 834],
  'reaction.jpg': [1088, 1160],
  'report.jpg': [1024, 892],
  'space-weather.jpg': [634, 428],
}

/** Print real do app, com moldura e sombra dura. */
export function Shot({ src, alt, className }: { src: string; alt: string; className?: string }) {
  const [width, height] = SHOT_SIZE[src] ?? []
  return (
    <img
      src={landingImg(src)}
      alt={alt}
      width={width}
      height={height}
      loading="lazy"
      decoding="async"
      className={cn('h-auto w-full rounded-2xl border-4 border-sa-deep bg-sa-deep shadow-[8px_8px_0_0_#07173f]', className)}
    />
  )
}

/**
 * Texto partido em palavras, para animar uma a uma. Com `mask`, cada palavra fica atrás de um
 * recorte e pode subir de baixo para cima. O recorte é por clip-path (não overflow), para não
 * mexer no alinhamento da linha.
 */
export function Words({ text, mask, wordClass }: { text: string; mask?: boolean; wordClass?: string }) {
  const words = text.split(' ')
  return (
    <>
      {words.map((w, i) => (
        <Fragment key={i}>
          {mask ? (
            <span className="inline-block [clip-path:inset(-0.1em_-0.2em_-0.2em)]">
              <span className={cn('inline-block', wordClass)}>{w}</span>
            </span>
          ) : (
            <span className={cn('inline-block', wordClass)}>{w}</span>
          )}
          {i < words.length - 1 ? ' ' : null}
        </Fragment>
      ))}
    </>
  )
}

export function Section({
  id,
  className,
  mood,
  children,
  ref,
}: {
  id?: string
  className: string
  /** Expressão do companheiro flutuante enquanto esta seção está na tela. */
  mood?: string
  children: ReactNode
  ref?: Ref<HTMLElement>
}) {
  return (
    <section ref={ref} id={id} data-mood={mood} className={cn('scroll-mt-16', className)}>
      <div className="mx-auto max-w-6xl px-4 py-16 md:px-8 md:py-24">{children}</div>
    </section>
  )
}

/** Título de seção. As palavras sobem de trás do recorte quando o título entra na tela (js-rise, em Landing.tsx). */
export function H2({ text, className }: { text: string; className?: string }) {
  return (
    <h2 className={cn('js-rise font-display text-4xl leading-[1.02] font-black md:text-6xl', className)}>
      <Words text={text} mask wordClass="js-word" />
    </h2>
  )
}
