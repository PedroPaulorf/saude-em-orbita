import { useEffect, useRef, type ReactNode } from 'react'
import { ChartLine, House, LogOut, PersonStanding, ShieldPlus, type LucideIcon } from 'lucide-react'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { href, type Path } from '@/lib/route'
import { cn } from '@/lib/utils'
import type { Connection } from '@/types'
import { CompanionButton } from './CompanionButton'
import { EscalateBanner } from './EscalateBanner'
import type { AlertInput } from '@/lib/alert'
import type { Line } from '@/lib/companion'

const TABS: { path: Path; label: string; short: string; Icon: LucideIcon }[] = [
  { path: '/', label: 'Home', short: 'Home', Icon: House },
  { path: '/prevention', label: 'Prevention', short: 'Prevention', Icon: ShieldPlus },
  { path: '/progress', label: 'Progress', short: 'Progress', Icon: ChartLine },
  { path: '/stats', label: 'Detailed stats', short: 'Stats', Icon: PersonStanding },
]

/** Qual aba fica marcada: os check-ups pertencem à Home. */
function activeTab(path: Path): Path {
  return path.startsWith('/check') ? '/' : path
}

const CONNECTION_TEXT: Record<Connection, string> = {
  offline: 'Offline',
  queued: 'Queued locally',
  online: 'Server synced',
}

/** Estado da comunicação com o solo: ponto + palavra, nunca só cor. Clicar sincroniza. */
function ConnectionStatus({ state, syncing, detail, onSync }: { state: Connection; syncing?: boolean; detail?: string; onSync?: () => void }) {
  const text = syncing ? 'Syncing' : CONNECTION_TEXT[state]
  return (
    <button
      type="button"
      onClick={onSync}
      disabled={syncing}
      title={`${detail ?? CONNECTION_TEXT[state]}. Select to sync now. Server sync does not send reports to Earth.`}
      className="inline-flex h-full items-center gap-2 px-3 text-sm text-ink-soft hover:bg-surface-2 hover:text-ink disabled:opacity-70"
    >
      <span role="status" className="inline-flex items-center gap-2">
        <span
          aria-hidden
          className={cn(
            'size-2.5 rounded-full border-2',
            state === 'offline' ? 'border-ink-soft' : state === 'queued' ? 'border-sa-yellow bg-sa-yellow' : 'border-sa-yonder bg-sa-yonder',
            syncing && 'animate-blink',
          )}
        />
        <span className="sr-only xl:not-sr-only">{text}</span>
      </span>
    </button>
  )
}

/** "Simulated data": uma vez por tela, no cabeçalho, em vez de um selo por cartão. */
export function SimulatedChip({ className, onClick }: { className?: string; onClick?: () => void }) {
  const chip = (
    <span
      className={cn(
        'inline-flex items-center rounded-full border border-dashed border-ink-soft/60 px-2.5 py-0.5 text-xs font-semibold text-ink-soft',
        onClick && 'group-hover:border-ink-soft group-hover:text-ink',
        className,
      )}
    >
      Simulated data
    </span>
  )
  if (!onClick) return chip
  // Abre o diálogo "Demo data" (cenários para gravar o vídeo). Área de toque de 44 px em volta do chip.
  return (
    <button type="button" onClick={onClick} aria-haspopup="dialog" className="group inline-flex min-h-11 items-center" title="Demo data">
      {chip}
    </button>
  )
}

/** Quem está logado: no cabeçalho, avatar com iniciais, rank e pontos. Leva ao perfil. */
export interface Account {
  name: string
  initials: string
  rank: string
  points: string
  onLogout: () => void
}

export function AppShell({
  path,
  missionDay,
  mission,
  connection,
  syncing,
  syncDetail,
  onSync,
  account,
  companionOpen,
  companionLines = [],
  onToggleCompanion,
  companionPanel,
  onOpenDemoData,
  escalate,
  children,
}: {
  path: Path
  missionDay: number
  /** Nome curto da missão escolhida ("ISS"); leva à troca de missão. */
  mission?: string
  connection: Connection
  syncing?: boolean
  syncDetail?: string
  onSync?: () => void
  account: Account
  /** Painel do companheiro aberto? O painel é desenhado pelo App, aqui só o botão e o foco. */
  companionOpen?: boolean
  /** Frases da barra do companheiro. */
  companionLines?: Line[]
  onToggleCompanion?: () => void
  companionPanel?: ReactNode
  onOpenDemoData?: () => void
  /** Estado ESCALATE do motor de monitoramento: mostra a faixa vermelha em todas as telas. */
  escalate?: AlertInput | null
  children: ReactNode
}) {
  const active = activeTab(path)
  const companionButton = useRef<HTMLButtonElement>(null)
  const wasOpen = useRef(false)
  // Ao fechar o painel, o foco volta para o botão.
  useEffect(() => {
    if (wasOpen.current && !companionOpen) companionButton.current?.focus()
    wasOpen.current = !!companionOpen
  }, [companionOpen])

  return (
    <TooltipProvider>
      <div className="min-h-screen pb-40 md:pb-28">
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
                      <span className="lg:hidden">{t.short}</span>
                      <span className="hidden lg:inline">{t.label}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="ml-auto flex min-w-0 items-center gap-2 md:gap-3">
              {/* Missão: dia, sincronização e aviso de dado simulado num bloco só */}
              <div className="flex h-10 items-stretch overflow-hidden rounded-full border border-hairline-strong bg-surface-1 text-sm">
                <a
                  href={href('/mission')}
                  title={mission ? `Mission: ${mission}. Select to change mission` : 'Choose mission'}
                  className="flex items-center px-2.5 font-semibold whitespace-nowrap text-ink no-underline hover:bg-surface-2 sm:px-3"
                >
                  {mission && <span className="mr-1.5 hidden text-sa-yonder lg:inline">{mission}</span>}
                  Day&nbsp;<span className="font-mono">{missionDay}</span>
                </a>
                <span aria-hidden className="my-2.5 w-px bg-hairline-strong" />
                <ConnectionStatus state={connection} syncing={syncing} detail={syncDetail} onSync={onSync} />
                {path !== '/integrations' && (
                  <>
                <span aria-hidden className="my-2.5 w-px bg-hairline-strong md:hidden lg:block" />
                <button
                  type="button"
                  onClick={onOpenDemoData}
                  aria-haspopup="dialog"
                  title="Demo data"
                  className="flex items-center px-2 text-xs font-semibold whitespace-nowrap text-ink-soft hover:bg-surface-2 hover:text-ink sm:px-3 md:hidden lg:flex"
                >
                  <span className="rounded-full border border-dashed border-ink-soft/60 px-2 py-0.5">Simulated</span>
                </button>
                  </>
                )}
              </div>

              {/* Conta: sair, seguido do perfil */}
              <button
                type="button"
                onClick={account.onLogout}
                title="Log out"
                className="hidden h-10 items-center gap-1.5 rounded-full px-3 text-sm font-semibold text-ink-soft hover:bg-surface-1 hover:text-ink md:inline-flex"
              >
                <LogOut className="size-4" aria-hidden />
                <span className="hidden xl:inline">Log out</span>
              </button>
              <a
                href={href('/profile')}
                aria-current={path === '/profile' ? 'page' : undefined}
                aria-label={`${account.name}, ${account.rank}, ${account.points} points. Open profile`}
                className={cn(
                  'flex h-10 items-center gap-2.5 rounded-full text-ink no-underline lg:border lg:border-hairline-strong lg:bg-surface-1 lg:py-1 lg:pr-4 lg:pl-1 lg:hover:bg-surface-2',
                  path === '/profile' && 'lg:border-sa-rocket-600',
                )}
              >
                <span aria-hidden className="grid size-10 shrink-0 place-items-center rounded-full bg-sa-rocket-600 font-display text-sm font-black text-white lg:size-8">
                  {account.initials}
                </span>
                <span aria-hidden className="hidden leading-tight lg:block">
                  <span className="block text-sm font-semibold whitespace-nowrap">{account.rank}</span>
                  <span className="block font-mono text-xs whitespace-nowrap text-ink-soft">{account.points} pts</span>
                </span>
              </a>
            </div>
          </div>
        </header>

        {escalate && <EscalateBanner key={escalate.date} alert={escalate} />}

        <main id="main" tabIndex={-1} className="outline-none">
          {children}
        </main>

        {/* Celular: abas numa barra fixa embaixo */}
        <nav
          aria-label="Main"
          className="fixed inset-x-0 bottom-0 z-30 border-t border-hairline bg-ground/95 backdrop-blur-md md:hidden"
        >
          <ul className="mx-auto grid h-16 max-w-md grid-cols-4">
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

        {/* Nos check-ups a barra some: não cobre a grade de memória nem distrai os testes. */}
        {!path.startsWith('/check') && <CompanionButton ref={companionButton} expanded={companionOpen} lines={companionLines} onClick={onToggleCompanion} />}
        {companionOpen && companionPanel}
        <Toaster position="top-center" offset={{ top: 76 }} mobileOffset={{ top: 76 }} />
      </div>
    </TooltipProvider>
  )
}
