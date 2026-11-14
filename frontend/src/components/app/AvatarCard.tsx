import { useState } from 'react'
import { ArrowRight, PersonStanding, RefreshCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { summarySentence } from '@/lib/present'
import { href, navigate } from '@/lib/route'
import { cn } from '@/lib/utils'
import type { BodyRegion, Vital } from '@/types'
import { BodyAvatar, type BodyView } from './BodyAvatar'
import { PanelHeader } from './Panel'

/**
 * Cartão "Body", o maior da Home. Mostra a figura de frente ou de costas (botão de virar); cada região
 * leva para Detailed stats com ela aberta, e o fundo do cartão leva para Detailed stats.
 */
export function AvatarCard({ vitals, regions, bodyModel, className }: { bodyModel: 'male' | 'female'; vitals: Vital[]; regions: BodyRegion[]; className?: string }) {
  const flagged = vitals.some((v) => v.status === 'flagged')
  const [view, setView] = useState<BodyView>('front')
  return (
    <section
      aria-labelledby="avatar-title"
      onClick={(e) => {
        // Clique no fundo do cartão (fora de região, link ou botão) abre Detailed stats.
        if ((e.target as Element).closest('a, button, [role=button]')) return
        navigate('/stats')
      }}
      className={cn(
        'relative flex min-w-0 cursor-pointer flex-col gap-3 rounded-xl border border-hairline bg-surface-1 p-5 transition-colors hover:border-hairline-strong',
        flagged && 'border-t-4 border-t-sa-rocket-600',
        className,
      )}
    >
      <PanelHeader
        id="avatar-title"
        icon={<PersonStanding />}
        tone="sky"
        title="Body"
        subtitle={
          <span className="inline-flex items-center gap-1.5">
            {flagged && <span aria-hidden className="size-2 animate-blink rounded-full bg-sa-rocket" />}
            {summarySentence(vitals)}
          </span>
        }
        aside={
          <a href={href('/stats')} className="inline-flex h-11 items-center gap-1 text-sm font-semibold text-interactive underline underline-offset-3">
            Detailed stats
            <ArrowRight className="size-4" aria-hidden />
          </a>
        }
      />

      <div className="flex flex-1 flex-col items-center justify-center gap-3 [--avatar-h:340px] sm:[--avatar-h:460px] xl:[--avatar-h:min(60vh,520px)]">
        <div key={view} className="w-full animate-body-turn">
          <BodyAvatar gender={bodyModel} view={view} regions={regions} onSelect={(id) => navigate('/stats', { region: id })} className="w-full" />
        </div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => setView((v) => (v === 'front' ? 'back' : 'front'))}
          aria-pressed={view === 'back'}
          className="order-first self-end rounded-full sm:order-none sm:self-center"
        >
          <RefreshCcw aria-hidden />
          {view === 'front' ? 'Show back' : 'Show front'}
        </Button>
      </div>
    </section>
  )
}
