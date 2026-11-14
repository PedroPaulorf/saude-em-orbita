import type { ReactNode } from 'react'
import { ChartLine, House, PersonStanding, type LucideIcon } from 'lucide-react'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { href, type Path } from '@/lib/route'
import { cn } from '@/lib/utils'
import type { Connection } from '@/types'
import { CompanionButton } from './CompanionButton'
import { Dot } from './Dot'

const TABS: { path: Path; label: string; short: string; Icon: LucideIcon }[] = [
  { path: '/', label: 'Home', short: 'Home', Icon: House },
  { path: '/progress', label: 'Progress', short: 'Progress', Icon: ChartLine },
  { path: '/stats', label: 'Detailed stats', short: 'Stats', Icon: PersonStanding },
]

/** Qual aba fica marcada: os check-ups pertencem à Home. */
function activeTab(path: Path): Path {
  return path.startsWith('/check') ? '/' : path
}

const CONNECTION_TEXT: Record<Connection, string> = {
  offline: 'Offline',
  queued: 'Report queued',
  online: 'Sent',
}

/** Estado da comunicação com o solo: ponto + palavra, nunca só cor. */
function ConnectionStatus({ state }: { state: Connection }) {
  return (
    <span role="status" className="inline-flex items-center gap-2 font-mono text-[13px] text-ink-soft">
      <span
        aria-hidden
        className={cn(
          'size-2.5 rounded-full border-2',
          state === 'offline' ? 'border-ink-soft' : 'border-interactive bg-interactive',
        )}
      />
      {CONNECTION_TEXT[state]}
    </span>
  )
}

/** "Simulated data": uma vez por tela, no cabeçalho, em vez de um selo por cartão. */
export function SimulatedChip({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border border-dashed border-ink-soft/60 px-2.5 py-0.5 text-xs font-semibold text-ink-soft',
        className,
      )}
    >
      Simulated data
    </span>
  )
}

export function AppShell({
  path,
  who,
  missionDay,
  connection,
  headerExtra,
  onOpenCompanion,
  children,
}: {
  path: Path
  who: string
  missionDay: number
  connection: Connection
  /** Chip de rank e pontos. */
  headerExtra?: ReactNode
  onOpenCompanion?: () => void
  children: ReactNode
}) {
  const active = activeTab(path)

  return (
    <TooltipProvider>
      <div className="min-h-screen pb-24 md:pb-0">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-surface-2 focus:px-3 focus:py-2"
          onClick={(e) => {
            e.preventDefault()
            document.getElementById('main')?.focus()
          }}
        >
          Skip to content
        </a>

        <header className="sticky top-0 z-30 border-b border-hairline bg-ground/85 backdrop-blur-md">
          <div className="mx-auto flex h-16 max-w-[1360px] items-center gap-4 px-4 md:gap-6 md:px-8">
            <a
              href={href('/')}
              className="font-display text-xl font-black tracking-[0.05em] text-ink uppercase no-underline"
              aria-label="Health7 home"
            >
              Health7
            </a>

            <nav aria-label="Main" className="hidden md:block">
              <ul className="flex items-center gap-1">
                {TABS.map((t) => (
                  <li key={t.path}>
                    <a
                      href={href(t.path)}
                      aria-current={active === t.path ? 'page' : undefined}
                      className={cn(
                        'inline-flex h-10 items-center rounded-md px-3.5 text-[15px] font-semibold no-underline transition-colors',
                        active === t.path ? 'bg-surface-2 text-ink' : 'text-ink-soft hover:bg-surface-1 hover:text-ink',
                      )}
                    >
                      {t.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="ml-auto flex min-w-0 items-center gap-3 md:gap-5">
              <span className="hidden truncate text-sm text-ink-soft xl:inline">
                {who}
                <Dot />
                Mission day <span className="font-mono text-ink">{missionDay}</span>
              </span>
              {headerExtra && <span className="hidden lg:inline-flex">{headerExtra}</span>}
              <SimulatedChip />
              <ConnectionStatus state={connection} />
            </div>
          </div>
        </header>

        {/* Abaixo de 1280 px: tripulante (e, abaixo de 1024 px, o chip de rank) numa segunda linha */}
        <div className="mx-auto flex max-w-[1360px] flex-wrap items-center justify-between gap-2 px-4 pt-3 text-sm text-ink-soft md:px-8 xl:hidden">
          <span>
            {who}
            <Dot />
            Mission day <span className="font-mono text-ink">{missionDay}</span>
          </span>
          {headerExtra && <span className="lg:hidden">{headerExtra}</span>}
        </div>

        <main id="main" tabIndex={-1} className="outline-none">
          {children}
        </main>

        {/* Celular: abas numa barra fixa embaixo */}
        <nav
          aria-label="Main"
          className="fixed inset-x-0 bottom-0 z-30 border-t border-hairline bg-ground/95 backdrop-blur-md md:hidden"
        >
          <ul className="mx-auto grid h-16 max-w-md grid-cols-3">
            {TABS.map((t) => (
              <li key={t.path} className="flex">
                <a
                  href={href(t.path)}
                  aria-current={active === t.path ? 'page' : undefined}
                  className={cn(
                    'flex flex-1 flex-col items-center justify-center gap-1 text-xs font-semibold no-underline',
                    active === t.path ? 'text-ink' : 'text-ink-soft',
                  )}
                >
                  <t.Icon className={cn('size-5', active === t.path && 'text-interactive')} aria-hidden />
                  {t.short}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <CompanionButton onClick={onOpenCompanion} />
        <Toaster position="top-center" offset={{ top: 76 }} mobileOffset={{ top: 76 }} />
      </div>
    </TooltipProvider>
  )
}
