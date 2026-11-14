import { useEffect, useRef, useState } from 'react'
import { Award } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { formatPoints, type GameSummary } from '@/lib/game'
import { href } from '@/lib/route'
import { cn } from '@/lib/utils'
import { Dot } from './Dot'

/** Chip do cabeçalho: rank e pontos; leva para Progress. */
export function RankChip({ game, className }: { game: GameSummary; className?: string }) {
  return (
    <a
      href={href('/progress')}
      className={cn(
        'inline-flex h-8 items-center gap-1.5 rounded-full border border-hairline-strong bg-surface-1 px-3 text-sm whitespace-nowrap text-ink no-underline hover:bg-surface-2',
        className,
      )}
      aria-label={`${game.rank.name}, ${formatPoints(game.totalPoints)} points. Open Progress`}
    >
      <Award className="size-4 text-interactive" aria-hidden />
      <span className="font-semibold">{game.rank.name}</span>
      <Dot className="mx-0.5" />
      <span className="font-mono text-[13px]">{formatPoints(game.totalPoints)} pts</span>
    </a>
  )
}

/** Anel de progresso: pontos de hoje sobre o máximo do dia. */
export function Ring({ value, max, size = 44, label }: { value: number; max: number; size?: number; label: string }) {
  const r = (size - 6) / 2
  const c = 2 * Math.PI * r
  const pct = Math.max(0, Math.min(1, value / max))
  return (
    <span className="relative inline-grid place-items-center" style={{ width: size, height: size }} role="img" aria-label={label}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={4} className="stroke-surface-3" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={4}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
          className="stroke-interactive transition-[stroke-dashoffset] duration-300"
        />
      </svg>
      <span aria-hidden className="absolute font-mono text-[13px] font-medium text-ink">
        {value}
      </span>
    </span>
  )
}

/**
 * Avisos do jogo: "+20 points" quando os pontos de hoje sobem, e um diálogo ao subir de rank.
 * Compara com a leitura anterior; na primeira leitura não avisa nada.
 */
export function GameEvents({ game }: { game: GameSummary }) {
  const prev = useRef<{ today: number; rankMin: number } | null>(null)
  const [rankUp, setRankUp] = useState<string | null>(null)

  useEffect(() => {
    const now = { today: game.today.total, rankMin: game.rank.min }
    const before = prev.current
    prev.current = now
    if (!before) return
    const gained = now.today - before.today
    if (gained > 0) toast(`+${gained} points`, { description: `${formatPoints(game.totalPoints)} points in total` })
    // oxlint-disable-next-line react/set-state-in-effect -- reage a uma mudança externa (registros salvos)
    if (now.rankMin > before.rankMin) setRankUp(game.rank.name)
  }, [game])

  return (
    <Dialog open={!!rankUp} onOpenChange={(o) => !o && setRankUp(null)}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader className="items-center pt-2 text-center">
          <span className="mb-2 grid size-16 place-items-center rounded-full bg-surface-2 text-interactive">
            <Award className="size-8" aria-hidden />
          </span>
          <DialogTitle className="font-display text-2xl font-semibold">New rank: {rankUp}</DialogTitle>
          <DialogDescription className="text-ink-soft">
            You reached {rankUp} with {formatPoints(game.totalPoints)} points. Points reward what you do every day, not
            what your measures show.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="sm:justify-center">
          <Button variant="secondary" onClick={() => setRankUp(null)}>
            Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
