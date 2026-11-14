import { useState } from 'react'
import { Clapperboard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { applyScenario, SCENARIOS } from '@/lib/demo'
import { href } from '@/lib/route'
import { cn } from '@/lib/utils'
import { Dotted } from './Dot'

/**
 * "Demo data" (plano v3, seção 8): carrega um dia da história para gravar o vídeo.
 * Diz que os dados são fictícios e pede confirmação antes de sobrescrever o que está salvo.
 */
export function DemoDataDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const [chosen, setChosen] = useState<string | null>(null)

  function load() {
    if (!chosen) return
    applyScenario(chosen)
    // Recarrega na aba Prevention, onde a história acontece; os dados são relidos do zero.
    window.location.hash = href(chosen === 'day-1' ? '/' : '/prevention')
    window.location.reload()
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o)
        if (!o) setChosen(null)
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="pr-10 text-left">
          <DialogTitle className="flex items-center gap-2 font-display text-xl font-semibold">
            <Clapperboard className="size-5 text-interactive" aria-hidden />
            Demo data
          </DialogTitle>
          <DialogDescription className="text-ink-soft">
            All health data in Health7 is simulated for this demo. Device feeds are simulated too. Load a scenario to show a
            day of the story.
          </DialogDescription>
        </DialogHeader>

        <div role="radiogroup" aria-label="Demo scenario" className="grid gap-2">
          {SCENARIOS.map((s) => (
            <button
              key={s.id}
              type="button"
              role="radio"
              aria-checked={chosen === s.id}
              onClick={() => setChosen(s.id)}
              className={cn(
                'grid gap-0.5 rounded-lg border px-4 py-3 text-left transition-colors',
                chosen === s.id ? 'border-ink bg-surface-2' : 'border-hairline-strong hover:bg-surface-2',
              )}
            >
              <span className="font-semibold">
                <Dotted text={s.title} />
              </span>
              <span className="text-sm text-ink-soft">{s.description}</span>
            </button>
          ))}
        </div>

        {chosen && (
          <p role="status" className="rounded-lg bg-surface-2 px-3 py-2 text-sm text-ink">
            This replaces the check-ups, water log and plans saved in this browser. The chat is kept.
          </p>
        )}

        <DialogFooter className="gap-2 sm:justify-start">
          <Button variant="secondary" disabled={!chosen} onClick={load}>
            Load scenario
          </Button>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
