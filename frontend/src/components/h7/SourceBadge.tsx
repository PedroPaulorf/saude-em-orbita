import type { Source } from '@/types'
import { cn } from '@/lib/utils'

const CONFIG: Record<Source, { text: string; className: string }> = {
  simulated: { text: 'Simulated', className: 'h7-badge--simulated' },
  demo: { text: 'Demonstration rule', className: 'h7-badge--demo' },
  live: { text: 'Live NASA data', className: 'h7-badge--live' },
}

/** De onde vem um dado ou uma regra. Sem ícone, para não confundir com o StatusBadge. */
export function SourceBadge({ source, className }: { source: Source; className?: string }) {
  const { text, className: variant } = CONFIG[source]
  return <span className={cn('h7-badge', variant, className)}>{text}</span>
}
