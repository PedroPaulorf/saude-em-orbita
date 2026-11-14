import { Check, ExternalLink, Eye, GlassWater, Radio } from 'lucide-react'
import { toast } from 'sonner'
import risks from '@/data/hrp-risks.json'
import type { RoadmapStep } from '@/lib/roadmap'
import { addWater } from '@/lib/water'
import { getActiveCrewId } from '@/lib/active-profile'
import { cn } from '@/lib/utils'

const RISKS = new Map((risks.risks as { id: string; title: string; url: string }[]).map((r) => [r.id, r]))

const KIND = {
  do: { label: 'Do', className: 'text-flag-ink' },
  watch: { label: 'Watch', Icon: Eye, className: 'text-sa-yellow' },
  ground: { label: 'Tell ground', Icon: Radio, className: 'text-flag-ink' },
} as const

/**
 * Um passo do roteiro. Passos "do" de hoje têm caixa de marcar; "watch" e "ground" dizem o tipo em palavra.
 * O porquê fica sempre visível, com os números.
 */
export function RoadmapStepItem({
  step,
  checkable,
  done,
  onToggle,
  compact,
  hideWhy,
  links = true,
}: {
  step: RoadmapStep
  checkable?: boolean
  done?: boolean
  onToggle?: () => void
  compact?: boolean
  /** Esconde o porquê quando ele repete o de um passo anterior. */
  hideWhy?: boolean
  /** Mostra o botão de água e o link do risco da NASA. */
  links?: boolean
}) {
  const risk = step.risk ? RISKS.get(step.risk) : undefined
  const kind = KIND[step.kind]
  return (
    <li className="flex gap-3">
      {checkable && step.kind === 'do' ? (
        <button
          type="button"
          role="checkbox"
          aria-checked={!!done}
          aria-label={`Done: ${step.text}`}
          onClick={onToggle}
          className={cn(
            'mt-0.5 grid size-7 shrink-0 place-items-center rounded-full border-2 transition-colors',
            done ? 'border-transparent bg-sa-rocket-600 text-white' : 'border-hairline-strong hover:border-sa-rocket',
          )}
        >
          {done && <Check className="size-4" strokeWidth={3} aria-hidden />}
        </button>
      ) : (
        <span aria-hidden className={cn('mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-surface-2 [&_svg]:size-3.5', kind.className)}>
          {'Icon' in kind ? <kind.Icon /> : <span className="size-2 rounded-full bg-current" />}
        </span>
      )}
      <div className="grid min-w-0 flex-1 gap-1">
        <p className={cn('text-[15px] leading-snug text-ink', done && 'text-ink-soft line-through')}>
          {step.kind !== 'do' && <span className={cn('mr-1.5 font-bold', kind.className)}>{kind.label}:</span>}
          {step.text}
        </p>
        {!compact && !hideWhy && step.why && <p className="font-mono text-[12px] leading-snug text-ink-soft">{step.why}</p>}
        {!compact && links && (risk || step.action === 'water') && (
          <div className="flex flex-wrap items-center gap-2 pt-0.5">
            {step.action === 'water' && (
              <button
                type="button"
                onClick={() => {
                  const owner = getActiveCrewId()
                  if (!owner) return
                  try { addWater(owner, 1); toast.success('Water serving logged') } catch (error) { toast.error((error as Error).message) }
                }}
                className="inline-flex h-8 items-center gap-1.5 rounded-[4px] bg-sa-yellow px-3 text-xs font-bold text-sa-deep hover:brightness-105"
              >
                <GlassWater className="size-3.5" aria-hidden />
                Log a water serving
              </button>
            )}
            {risk && (
              <a
                href={risk.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-8 max-w-full items-center gap-1 rounded-[4px] px-1 py-1 text-xs font-semibold text-interactive underline underline-offset-2"
              >
                NASA risk: {risk.title.replace(/^Risk (of|from) /, '').toLowerCase()}
                <ExternalLink className="size-3" aria-hidden />
                <span className="sr-only">(opens in a new tab)</span>
              </a>
            )}
          </div>
        )}
      </div>
    </li>
  )
}
