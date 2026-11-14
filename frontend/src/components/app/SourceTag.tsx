import { ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Selos de origem, discretos e sem ícone de estado (para não confundir com o StatusBadge).
 * "Simulated" fica uma vez por tela, no cabeçalho (SimulatedChip). Aqui: regra de demonstração e dado da NASA.
 */
export function DemoTag({ children = 'Demonstration rule', className }: { children?: string; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex h-6 items-center rounded-full border border-hairline-strong px-2.5 text-xs font-semibold whitespace-nowrap text-ink-soft',
        className,
      )}
    >
      {children}
    </span>
  )
}

/** "Live NASA data", sempre com link para a fonte. */
export function LiveTag({ href, className }: { href: string; className?: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={cn(
        'inline-flex h-6 items-center gap-1 rounded-full border border-interactive/50 px-2.5 text-xs font-semibold whitespace-nowrap text-interactive no-underline hover:bg-surface-2',
        className,
      )}
    >
      Live NASA data
      <ExternalLink className="size-3" aria-hidden />
      <span className="sr-only">(opens source in a new tab)</span>
    </a>
  )
}
