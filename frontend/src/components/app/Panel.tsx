import type { ComponentProps, ReactNode } from 'react'
import { cn } from '@/lib/utils'
import type { Status } from '@/types'

/** Cor sólida do ícone de cada cartão: cada assunto tem a sua (paleta do Space Apps). */
export type Tone = 'orange' | 'yellow' | 'blue' | 'sky' | 'red'
const TONE: Record<Tone, string> = {
  orange: 'bg-sa-rocket-600 text-white',
  yellow: 'bg-sa-yellow text-sa-deep',
  blue: 'bg-sa-neon-blue text-white',
  sky: 'bg-sa-yonder text-sa-deep',
  red: 'bg-sa-martian text-white',
}

/** Faixa no topo do cartão quando ele pede atenção (a palavra do estado fica no selo). */
const ACCENT: Record<Status, string> = {
  baseline: '',
  attention: 'border-t-4 border-t-sa-yellow',
  flagged: 'border-t-4 border-t-sa-rocket-600',
}

/** Cartão v2: superfície 1, borda fina, raio de 12 px, sem sombra. */
export function Panel({ className, accent = 'baseline', ...props }: ComponentProps<'section'> & { accent?: Status }) {
  return (
    <section
      className={cn('flex min-w-0 flex-col gap-3 rounded-xl border border-hairline bg-surface-1 p-5 xl:py-4', ACCENT[accent], className)}
      {...props}
    />
  )
}

/** Cabeçalho do cartão: ícone, título e um elemento opcional à direita. */
export function PanelHeader({
  icon,
  tone,
  title,
  id,
  aside,
  subtitle,
}: {
  icon?: ReactNode
  tone?: Tone
  title: ReactNode
  id?: string
  aside?: ReactNode
  subtitle?: ReactNode
}) {
  return (
    <header className="flex items-start justify-between gap-3">
      <div className="flex min-w-0 items-center gap-3">
        {icon && (
          <span
            aria-hidden
            className={cn('grid size-9 shrink-0 place-items-center rounded-lg [&_svg]:size-5', tone ? TONE[tone] : 'bg-surface-2 text-interactive')}
          >
            {icon}
          </span>
        )}
        <div className="min-w-0">
          <h2 id={id} className="font-display text-lg leading-tight font-semibold text-ink">
            {title}
          </h2>
          {subtitle && <div className="mt-0.5 text-sm text-ink-soft">{subtitle}</div>}
        </div>
      </div>
      {aside && <div className="flex shrink-0 items-center gap-2">{aside}</div>}
    </header>
  )
}
