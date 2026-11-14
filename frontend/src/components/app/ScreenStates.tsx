import { Component, type ErrorInfo, type ReactNode } from 'react'
import { TriangleAlert } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { href } from '@/lib/route'

/** Esqueleto enquanto uma tela carregada sob demanda baixa (ex.: Progress, com o Recharts). */
export function ScreenSkeleton({ label }: { label: string }) {
  return (
    <div className="mx-auto max-w-[1360px] px-4 pt-4 pb-8 md:px-8" role="status" aria-label={label}>
      <Skeleton className="mb-4 h-8 w-40 bg-surface-2" />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <div className="grid gap-4">
          <Skeleton className="h-44 rounded-xl bg-surface-1" />
          <div className="grid gap-4 sm:grid-cols-2">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-60 rounded-xl bg-surface-1" />
            ))}
          </div>
        </div>
        <Skeleton className="h-96 rounded-xl bg-surface-1" />
      </div>
    </div>
  )
}

/**
 * Se uma tela quebrar, mostra uma mensagem e o caminho de volta, em vez de deixar o app em branco.
 * Os dados salvos não são tocados. `resetKey` (a rota) limpa o erro ao trocar de tela.
 */
export class ScreenBoundary extends Component<{ children: ReactNode; resetKey: string }, { error: Error | null; key: string }> {
  state = { error: null as Error | null, key: this.props.resetKey }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  static getDerivedStateFromProps(props: { resetKey: string }, state: { error: Error | null; key: string }) {
    return props.resetKey !== state.key ? { error: null, key: props.resetKey } : null
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Health7 screen error', error, info.componentStack)
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div className="mx-auto max-w-xl px-4 pt-10">
        <section role="alert" className="flex flex-col gap-3 rounded-xl border border-hairline bg-surface-1 p-6">
          <TriangleAlert className="size-6 text-flag-ink" aria-hidden />
          <h1 className="font-display text-xl font-semibold">This screen couldn&apos;t load.</h1>
          <p className="text-ink-soft">Your saved check-ups are safe on this device. Try another tab, or go back to Home.</p>
          <a href={href('/')} className="self-start font-semibold text-interactive underline underline-offset-3">
            Back to Home
          </a>
        </section>
      </div>
    )
  }
}
