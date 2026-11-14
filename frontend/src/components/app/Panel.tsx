import type { ComponentProps, ReactNode } from 'react'
import { cn } from '@/lib/utils'

/** Cartão v2: superfície 1, borda fina, raio de 12 px, sem sombra. */
export function Panel({ className, ...props }: ComponentProps<'section'>) {
  return (
    <section
      className={cn('flex min-w-0 flex-col gap-3 rounded-xl border border-hairline bg-surface-1 p-5', className)}
      {...props}
    />
  )
}

/** Cabeçalho do cartão: ícone, título e um elemento opcional à direita. */
export function PanelHeader({
  icon,
  title,
  id,
  aside,
  subtitle,
}: {
  icon?: ReactNode
  title: ReactNode
  id?: string
  aside?: ReactNode
  subtitle?: ReactNode
}) {
  return (
    <header className="flex items-start justify-between gap-3">
      <div className="flex min-w-0 items-start gap-3">
        {icon && (
          <span
            aria-hidden
            className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-lg bg-surface-2 text-interactive [&_svg]:size-5"
          >
            {icon}
          </span>
        )}
        <div className="min-w-0">
          <h2 id={id} className="font-display text-lg leading-tight font-semibold text-ink">
            {title}
          </h2>
          {subtitle && <div className="mt-1 text-sm text-ink-soft">{subtitle}</div>}
        </div>
      </div>
      {aside && <div className="flex shrink-0 items-center gap-2">{aside}</div>}
    </header>
  )
}
