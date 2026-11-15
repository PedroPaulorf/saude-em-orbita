import type { CrewMate } from '@/lib/crew'
import { STATE_LABEL, STATE_STATUS, type MonitorState } from '@/lib/monitor'
import { href } from '@/lib/route'
import { cn } from '@/lib/utils'
import type { Status } from '@/types'

/*
  Barra da tripulação (passo 4), no estilo da barra de aliados de um jogo de equipe: um retrato por
  tripulante, com a barra de "baseline match" e a palavra do estado embaixo. Nunca só cor.
  Os colegas mostram só isso; as medidas deles não aparecem.
*/

const RING: Record<Status, string> = {
  baseline: 'ring-sa-yonder',
  attention: 'ring-sa-yellow',
  flagged: 'ring-sa-rocket',
}
/** Palavra curta no cartão (a completa fica no rótulo do leitor de tela). */
const SHORT: Record<MonitorState, string> = { STABLE: 'Stable', WATCH: 'Watch', 'PERSISTENT CHANGE': 'Change', ESCALATE: 'Escalate' }
const FILL: Record<Status, string> = {
  baseline: 'bg-sa-yonder',
  attention: 'bg-sa-yellow',
  flagged: 'bg-sa-rocket',
}

function Mate({ mate }: { mate: CrewMate }) {
  const status = STATE_STATUS[mate.state]
  const word = mate.observed ? STATE_LABEL[mate.state] : 'No check-up'
  const short = mate.observed ? SHORT[mate.state] : 'No data'
  const label = `${mate.self ? 'You, ' : ''}${mate.label}${mate.role ? `, ${mate.role}` : ''}: ${word}. Baseline match ${mate.observed ? mate.match : 'unknown'} of 100. Day ${mate.day}.`
  const body = (
    <>
      <span
        aria-hidden
        className={cn(
          'grid size-9 shrink-0 place-items-center rounded-full font-display text-sm font-black ring-2 ring-offset-2 ring-offset-ground',
          mate.self ? 'bg-sa-rocket-600 text-white' : 'bg-surface-2 text-ink',
          mate.observed ? RING[status] : 'ring-hairline-strong',
        )}
      >
        {mate.initials}
      </span>
      <span aria-hidden className="flex min-w-0 flex-1 flex-col gap-1.5">
        {/* O nome tem a linha toda: nomes longos ("Tripulante fictício 03") cortam com reticências, nunca vazam */}
        <span className="truncate text-[13px] leading-none font-semibold text-ink">{mate.self ? 'You' : mate.label}</span>
        <span className="flex items-center gap-2">
          {/* Barra em 10 segmentos, como uma barra de vida */}
          <span className="grid h-1.5 min-w-0 flex-1 grid-cols-10 gap-0.5">
            {Array.from({ length: 10 }, (_, i) => (
              <span key={i} className={cn('rounded-[1px]', mate.observed && i < Math.round(mate.match / 10) ? FILL[status] : 'bg-surface-3')} />
            ))}
          </span>
          <span className={cn('shrink-0 text-[11px] leading-none font-semibold', mate.observed ? (status === 'baseline' ? 'text-ink-soft' : status === 'attention' ? 'text-sa-yellow' : 'text-flag-ink') : 'text-ink-soft')}>
            {short}
          </span>
        </span>
      </span>
    </>
  )
  const box = cn('flex w-48 shrink-0 items-center gap-3 rounded-lg border px-2.5 py-2 no-underline', mate.self ? 'border-sa-rocket-600/70 bg-surface-1' : 'border-hairline bg-surface-1/70')
  return (
    <li title={label}>
      {mate.self ? (
        <a href={href('/prevention')} aria-label={`${label} Open prevention`} className={cn(box, 'hover:bg-surface-2')}>
          {body}
        </a>
      ) : (
        <div role="img" aria-label={label} className={box}>
          {body}
        </div>
      )}
    </li>
  )
}

export function CrewBar({ crew }: { crew: CrewMate[] }) {
  // Sozinho na tripulação (ou sem conexão com os colegas), a barra não ajuda.
  if (crew.length < 2) return null
  return (
    <section aria-label="Crew" className="border-b border-hairline bg-ground/60">
      <div className="mx-auto flex max-w-[1360px] items-center gap-3 px-4 py-2 md:px-8">
        <h2 className="hidden shrink-0 text-xs font-bold tracking-wider text-ink-soft uppercase xl:block">
          Crew
          <span className="block font-normal tracking-normal normal-case">Baseline match</span>
        </h2>
        <ul className="-my-1 flex min-w-0 flex-1 gap-2 overflow-x-auto py-1 [scrollbar-width:thin]">
          {crew.map((m) => (
            <Mate key={m.id} mate={m} />
          ))}
        </ul>
      </div>
    </section>
  )
}
