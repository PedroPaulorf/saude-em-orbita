import { Fragment } from 'react'
import { cn } from '@/lib/utils'

/**
 * Separador "·" desenhado como um ponto, com respiro igual dos dois lados.
 * (No Overpass o glifo "·" fica deslocado e o espaço é estreito.)
 */
export function Dot({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn('mx-2 inline-block size-[3px] rounded-full bg-current align-middle opacity-70', className)}
    />
  )
}

/** Mostra um texto com " · " usando o Dot no lugar do glifo; o texto inteiro continua para leitores de tela. */
export function Dotted({ text }: { text: string }) {
  const parts = text.split(' · ')
  return (
    <>
      <span className="sr-only">{text}</span>
      <span aria-hidden>
        {parts.map((p, i) => (
          <Fragment key={i}>
            {i > 0 && <Dot />}
            {p}
          </Fragment>
        ))}
      </span>
    </>
  )
}
