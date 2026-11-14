import type { ReactNode } from 'react'
import type { Connection } from '@/types'
import { ConnectionPill } from './ConnectionPill'

/** Barra superior com degradê panel → deep, nome do app, tripulante e conexão. */
export function TopBar({
  who,
  connection,
  connectionText,
  children,
}: {
  who: string
  connection: Connection
  connectionText?: string
  /** Ações extras, à direita (opcional). */
  children?: ReactNode
}) {
  return (
    <header className="h7-topbar flex-wrap max-md:px-6">
      <span className="h7-topbar__name">Health7</span>
      <span className="h7-topbar__who">{who}</span>
      {children}
      <ConnectionPill state={connection}>{connectionText}</ConnectionPill>
    </header>
  )
}
