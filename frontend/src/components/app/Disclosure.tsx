import type { ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Conteúdo de apoio fechado por padrão (fonte, explicação, texto longo da NASA).
 * <details> nativo: abre com teclado e leitor de tela sem JavaScript.
 */
export function Disclosure({ summary, children, className }: { summary: ReactNode; children: ReactNode; className?: string }) {
  return (
    <details className={cn('group', className)}>
      <summary className="flex min-h-10 cursor-pointer list-none items-center justify-between gap-2 text-sm font-semibold text-ink-soft transition-colors hover:text-ink [&::-webkit-details-marker]:hidden">
        <span>{summary}</span>
        <ChevronDown className="size-4 shrink-0 transition-transform group-open:rotate-180" aria-hidden />
      </summary>
      <div className="grid gap-2 pt-1 pb-1">{children}</div>
    </details>
  )
}
