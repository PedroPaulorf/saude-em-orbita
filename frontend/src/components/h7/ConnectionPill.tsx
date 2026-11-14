import type { ReactNode } from 'react'
import type { Connection } from '@/types'
import { cn } from '@/lib/utils'

const DEFAULT_TEXT: Record<Connection, string> = {
  offline: 'Offline',
  queued: 'Saved for downlink',
  online: 'Sent',
}

/** Estado da comunicação com o solo. Na barra superior, use offline ou queued. */
export function ConnectionPill({
  state,
  children,
  className,
}: {
  state: Connection
  children?: ReactNode
  className?: string
}) {
  return (
    <span
      className={cn('h7-pill', state === 'queued' && 'h7-pill--queued', state === 'online' && 'h7-pill--online', className)}
      role="status"
    >
      {children ?? DEFAULT_TEXT[state]}
    </span>
  )
}
