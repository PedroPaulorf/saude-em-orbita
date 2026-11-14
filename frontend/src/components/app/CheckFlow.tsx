import { useId, useRef, type FormEvent, type InputHTMLAttributes, type KeyboardEvent, type ReactNode } from 'react'
import { ArrowLeft, CircleCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { href } from '@/lib/route'
import { cn } from '@/lib/utils'

/*
  Moldura dos dois check-ups (plano v2, 7.2): uma pergunta por etapa, barra de progresso,
  campo grande no centro. "Next" é a ação principal (amarelo); "Back" e "Cancel", secundárias.
*/
export function CheckFlow({
  title,
  step,
  total,
  onBack,
  onSubmit,
  nextLabel,
  nextDisabled,
  children,
}: {
  title: string
  /** Etapa atual, começando em 0. */
  step: number
  total: number
  onBack: () => void
  onSubmit: () => void
  nextLabel: string
  nextDisabled?: boolean
  children: ReactNode
}) {
  function submit(e: FormEvent) {
    e.preventDefault()
    if (!nextDisabled) onSubmit()
  }
  return (
    <div className="mx-auto w-full max-w-xl px-4 pt-4 pb-10 md:pt-8">
      <a
        href={href('/')}
        className="-ml-2 inline-flex h-11 items-center gap-1.5 rounded-lg px-2 text-sm font-semibold text-ink-soft no-underline hover:bg-surface-1 hover:text-ink"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Home
      </a>
      <div className="mt-2 mb-4 grid gap-2">
        <div className="flex items-baseline justify-between gap-3">
          <h1 className="font-display text-lg font-semibold">{title}</h1>
          <span className="font-mono text-sm text-ink-soft" aria-live="polite">
            {step + 1} of {total}
          </span>
        </div>
        <Progress value={((step + 1) / total) * 100} aria-label={`${title}, step ${step + 1} of ${total}`} />
      </div>

      <form
        onSubmit={submit}
        noValidate
        className="flex flex-col gap-6 rounded-xl border border-hairline bg-surface-1 p-5 md:p-8"
      >
        {children}
        <div className="flex items-center justify-between gap-3 border-t border-hairline pt-5">
          <Button type="button" variant="outline" onClick={onBack}>
            {step === 0 ? 'Cancel' : 'Back'}
          </Button>
          <Button type="submit" disabled={nextDisabled}>
            {nextLabel}
          </Button>
        </div>
      </form>
    </div>
  )
}

/** Pergunta da etapa, o maior texto da tela. */
export function Question({ children, id }: { children: ReactNode; id?: string }) {
  return (
    <h2 id={id} className="font-display text-[26px] leading-tight font-semibold text-balance md:text-3xl">
      {children}
    </h2>
  )
}

/** Campo de uma medida: número grande em Fira Code, unidade ao lado, frase de apoio que não julga o valor. */
export function MeasureField({
  label,
  unit,
  hint,
  error,
  ...input
}: { label: string; unit?: string; hint?: string; error?: string } & Omit<InputHTMLAttributes<HTMLInputElement>, 'id'>) {
  const id = useId()
  return (
    <div className="grid min-w-0 gap-2">
      <label htmlFor={id} className="text-sm font-semibold text-ink-soft">
        {label}
      </label>
      <div
        className={cn(
          'flex h-18 min-w-0 items-center gap-3 rounded-xl border bg-ground px-4 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-ink',
          error ? 'border-flag-mark' : 'border-hairline-strong',
        )}
      >
        <input
          id={id}
          aria-describedby={`${id}-hint`}
          aria-invalid={!!error}
          size={1}
          className="w-full min-w-0 flex-1 bg-transparent font-mono text-4xl text-ink outline-none placeholder:text-ink-soft/40"
          {...input}
        />
        {unit && <span className="font-mono text-lg text-ink-soft">{unit}</span>}
      </div>
      <p id={`${id}-hint`} role={error ? 'alert' : undefined} className={cn('text-sm', error ? 'text-flag-ink' : 'text-ink-soft')}>
        {error ?? hint}
      </p>
    </div>
  )
}

/**
 * Escala de 1 a 5 para autorrelato. A opção escolhida fica em branco sobre azul, não em amarelo:
 * escolher não é alerta. Sem pontuação somada nem interpretação.
 */
export function ScaleChoice({
  labelledBy,
  low,
  high,
  value,
  onChange,
}: {
  labelledBy: string
  low: string
  high: string
  value: number | null
  onChange: (v: number) => void
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([])
  function onKeyDown(e: KeyboardEvent<HTMLButtonElement>, n: number) {
    const next =
      e.key === 'ArrowRight' || e.key === 'ArrowUp' ? n + 1 : e.key === 'ArrowLeft' || e.key === 'ArrowDown' ? n - 1 : null
    if (next == null || next < 1 || next > 5) return
    e.preventDefault()
    onChange(next)
    refs.current[next - 1]?.focus()
  }
  return (
    <div className="grid gap-2">
      <div role="radiogroup" aria-labelledby={labelledBy} className="grid grid-cols-5 gap-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            ref={(el) => {
              refs.current[n - 1] = el
            }}
            type="button"
            role="radio"
            aria-checked={value === n}
            aria-label={n === 1 ? `1, ${low}` : n === 5 ? `5, ${high}` : String(n)}
            tabIndex={value === n || (value == null && n === 1) ? 0 : -1}
            onClick={() => onChange(n)}
            onKeyDown={(e) => onKeyDown(e, n)}
            className={cn(
              'h-16 rounded-xl border font-mono text-2xl transition-colors',
              value === n
                ? 'border-ink bg-panel text-ink'
                : 'border-hairline-strong bg-ground text-ink-soft hover:bg-surface-2 hover:text-ink',
            )}
          >
            {n}
          </button>
        ))}
      </div>
      <div className="flex justify-between text-sm text-ink-soft">
        <span>{low}</span>
        <span>{high}</span>
      </div>
    </div>
  )
}

/** Confirmação curta depois de salvar: "Saved. Queued for ground." e o resumo. */
export function CheckSaved({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-xl px-4 pt-8 pb-10 md:pt-14">
      <section
        aria-labelledby="saved-title"
        className="flex flex-col gap-5 rounded-xl border border-hairline bg-surface-1 p-6 md:p-8"
      >
        <div className="flex items-start gap-3">
          <CircleCheck className="mt-1 size-7 shrink-0 text-interactive" aria-hidden />
          <div>
            <p className="text-sm font-semibold text-ink-soft">{title}</p>
            <h1 id="saved-title" tabIndex={-1} className="font-display text-[26px] leading-tight font-semibold outline-none">
              Saved. Queued for ground.
            </h1>
          </div>
        </div>
        {children}
        <Button asChild className="self-start no-underline">
          <a href={href('/')}>Back to Home</a>
        </Button>
      </section>
    </div>
  )
}
