import { STATE_LABEL, STATE_STATUS, type MonitorState } from '@/lib/monitor'
import { STATUS } from '@/lib/present'
import { cn } from '@/lib/utils'
import type { Status } from '@/types'

/** Estado de uma medida: sempre ícone e palavra, nunca só cor. São três estados; não crie um quarto. */
export function StatusBadge({ status, detail, className }: { status: Status; detail?: string; className?: string }) {
  const { text, Icon, className: variant } = STATUS[status]
  return (
    <span
      className={cn(
        'inline-flex h-6 shrink-0 items-center gap-1.5 rounded-full text-[13px] leading-none font-semibold whitespace-nowrap',
        variant,
        className,
      )}
    >
      <Icon className="size-3.5" aria-hidden strokeWidth={2.5} />
      {text}
      {detail && <span className="font-mono font-medium">· {detail}</span>}
    </span>
  )
}

/**
 * Estado do motor de monitoramento: a palavra da pesquisa (Watch, Persistent change...) nas três cores
 * que já existem. WATCH e PERSISTENT CHANGE usam a cor de atenção; ESCALATE, a de sinalizado.
 */
export function StateBadge({ state, className }: { state: MonitorState; className?: string }) {
  const { Icon, className: variant } = STATUS[STATE_STATUS[state]]
  return (
    <span className={cn('inline-flex h-6 shrink-0 items-center gap-1.5 rounded-full text-[13px] leading-none font-semibold whitespace-nowrap', variant, className)}>
      <Icon className="size-3.5" aria-hidden strokeWidth={2.5} />
      {STATE_LABEL[state]}
    </span>
  )
}
