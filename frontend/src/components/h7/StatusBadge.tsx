import { Check, Radio, TrendingUp } from 'lucide-react'
import type { Status } from '@/types'
import { cn } from '@/lib/utils'

const CONFIG: Record<Status, { text: string; className?: string; Icon: typeof Check }> = {
  baseline: { text: 'Within baseline', Icon: Check },
  attention: { text: 'Attention', className: 'h7-badge--attention', Icon: TrendingUp },
  flagged: { text: 'Flagged for ground', className: 'h7-badge--flagged', Icon: Radio },
}

/** Estado de uma medida. Sempre com ícone e palavra; nunca só a cor. */
export function StatusBadge({ status, className }: { status: Status; className?: string }) {
  const { text, className: variant, Icon } = CONFIG[status]
  return (
    <span className={cn('h7-badge', variant, className)}>
      <Icon className="h7-icon" aria-hidden />
      {text}
    </span>
  )
}
