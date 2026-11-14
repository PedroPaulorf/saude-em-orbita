import { ArrowRight } from 'lucide-react'
import { summarySentence } from '@/lib/present'
import { href, navigate } from '@/lib/route'
import { cn } from '@/lib/utils'
import type { BodyRegion, Vital } from '@/types'
import { BodyAvatar } from './BodyAvatar'

/**
 * Cartão do avatar, o maior da Home. O cartão leva para Detailed stats; cada região leva para
 * Detailed stats com ela aberta. O link do título é o caminho pelo teclado para o cartão.
 */
export function AvatarCard({ vitals, regions, className }: { vitals: Vital[]; regions: BodyRegion[]; className?: string }) {
  const flagged = vitals.some((v) => v.status === 'flagged')
  return (
    <section
      aria-labelledby="avatar-title"
      onClick={(e) => {
        // Clique no fundo do cartão (fora de região ou link) abre Detailed stats.
        if ((e.target as Element).closest('a, [role=button]')) return
        navigate('/stats')
      }}
      className={cn(
        'relative flex min-w-0 cursor-pointer flex-col gap-4 rounded-xl border border-hairline bg-surface-1 p-5 transition-colors hover:border-hairline-strong',
        className,
      )}
    >
      <header className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <div>
          <h2 id="avatar-title" className="flex items-center gap-2 font-display text-[22px] leading-tight font-semibold">
            {flagged && <span aria-hidden className="size-2.5 rounded-full bg-flag-mark" />}
            {summarySentence(vitals)}
          </h2>
        </div>
        <a
          href={href('/stats')}
          className="underline underline-offset-3 inline-flex h-11 items-center gap-1 text-sm font-semibold text-interactive"
        >
          Detailed stats
          <ArrowRight className="size-4" aria-hidden />
        </a>
      </header>

      <div className="flex flex-1 items-center justify-center [--avatar-h:300px] sm:[--avatar-h:400px] xl:[--avatar-h:min(50vh,430px)]">
        <BodyAvatar regions={regions} onSelect={(id) => navigate('/stats', { region: id })} className="w-full" />
      </div>
      <p className="text-center text-sm text-ink-soft">Select a body region to see what differs and the linked NASA risks.</p>
    </section>
  )
}
