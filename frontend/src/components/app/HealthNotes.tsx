import { ArrowRight, CircleCheck, CircleDashed, Droplet, NotebookPen, Radio, Sun, TrendingUp } from 'lucide-react'
import type { Note } from '@/lib/notes'
import { cn } from '@/lib/utils'
import { DemoTag } from './SourceTag'

function NoteIcon({ note }: { note: Note }) {
  const cls = 'size-5 shrink-0'
  switch (note.kind) {
    case 'pending':
      return <CircleDashed className={cn(cls, 'text-ink-soft')} aria-hidden />
    case 'measure':
      return note.status === 'flagged' ? (
        <Radio className={cn(cls, 'text-flag-ink')} aria-hidden />
      ) : (
        <TrendingUp className={cn(cls, 'text-brand')} aria-hidden />
      )
    case 'space':
      return <Sun className={cn(cls, 'text-interactive')} aria-hidden />
    case 'water':
      return <Droplet className={cn(cls, 'text-interactive')} aria-hidden />
    case 'calm':
      return <CircleCheck className={cn(cls, 'text-interactive')} aria-hidden />
  }
}

/** Faixa "Health notes": até três notas, cada uma com ícone, uma frase e um link para agir. */
export function HealthNotes({
  notes,
  onWeather,
  onRoutine,
  className,
}: {
  notes: Note[]
  onWeather: () => void
  onRoutine: () => void
  className?: string
}) {
  return (
    <section
      aria-labelledby="health-notes"
      className={cn('rounded-xl border border-hairline bg-surface-1/70 p-4 md:px-5 md:py-3.5', className)}
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-6">
        <div className="flex shrink-0 items-center justify-between gap-3 lg:w-44 lg:flex-col lg:items-start lg:gap-1.5">
          <h2 id="health-notes" className="flex items-center gap-2 font-display text-base font-semibold">
            <NotebookPen className="size-4.5 text-interactive" aria-hidden />
            Health notes
          </h2>
          <DemoTag />
        </div>
        <ul className={cn('grid flex-1 gap-2 md:gap-3', notes.length > 1 && 'md:grid-cols-3')}>
          {notes.map((n) => (
            <li key={n.id} className="flex items-center gap-3 rounded-lg bg-surface-2/50 px-3 py-2.5">
              <NoteIcon note={n} />
              <div className="flex min-w-0 flex-1 flex-col">
                <p className="text-[15px] leading-snug text-ink">{n.text}</p>
                {n.action?.kind === 'href' && (
                  <a href={n.action.href} className="underline underline-offset-3 inline-flex items-center gap-1 self-start py-0.5 text-sm font-semibold text-interactive">
                    {n.action.label}
                    <ArrowRight className="size-3.5" aria-hidden />
                  </a>
                )}
                {n.action && n.action.kind !== 'href' && (
                  <button
                    type="button"
                    onClick={n.action.kind === 'weather' ? onWeather : onRoutine}
                    className="inline-flex cursor-pointer items-center gap-1 self-start py-0.5 text-sm font-semibold text-interactive underline underline-offset-3"
                  >
                    {n.action.label}
                    <ArrowRight className="size-3.5" aria-hidden />
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
