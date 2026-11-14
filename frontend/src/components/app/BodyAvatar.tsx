import type { KeyboardEvent } from 'react'
import { FEMALE_FRONT, MALE_FRONT, type BodyPaths } from '@/data/body-paths'
import { REGION_NAMES } from '@/lib/present'
import { cn } from '@/lib/utils'
import type { BodyRegion, BodyRegionId, Status } from '@/types'
import { StatusBadge } from './StatusBadge'

/*
  Figura do corpo, vista de frente, com as sete regiões do app pintadas pelo estado.
  Traçados de @mjcdev/react-body-highlighter (MIT), copiados em data/body-paths.ts.
  As partes da biblioteca são agrupadas nas nossas regiões; "left"/"right" da biblioteca são
  lados de quem olha, então o braço esquerdo da pessoa usa os traçados "right".
*/

type Side = 'left' | 'right' | 'common'
const REGION_PARTS: Record<BodyRegionId, { slugs: string[]; side: Side | 'both' }> = {
  head: { slugs: ['head'], side: 'both' },
  chest: { slugs: ['chest'], side: 'both' },
  core: { slugs: ['abs', 'obliques'], side: 'both' },
  rightArm: { slugs: ['deltoids', 'biceps', 'triceps', 'forearm', 'hands'], side: 'left' },
  leftArm: { slugs: ['deltoids', 'biceps', 'triceps', 'forearm', 'hands'], side: 'right' },
  rightLeg: { slugs: ['adductors', 'quadriceps', 'knees', 'tibialis', 'calves', 'ankles', 'feet'], side: 'left' },
  leftLeg: { slugs: ['adductors', 'quadriceps', 'knees', 'tibialis', 'calves', 'ankles', 'feet'], side: 'right' },
}
/** Partes sem região do app: desenhadas neutras, sem clique. */
const NEUTRAL = ['hair', 'neck', 'trapezius']

const ORDER: BodyRegionId[] = ['head', 'chest', 'core', 'leftArm', 'rightArm', 'leftLeg', 'rightLeg']

/** Recorte da figura e ponto de onde sai a linha de cada rótulo, por corpo (coordenadas do viewBox). */
interface Layout {
  paths: BodyPaths
  box: { x: number; y: number; w: number; h: number }
  anchors: Partial<Record<BodyRegionId, { x: number; y: number; side: 'left' | 'right' }>>
}
const LAYOUTS: Record<'male' | 'female', Layout> = {
  male: {
    paths: MALE_FRONT,
    box: { x: 40, y: 86, w: 650, h: 1275 },
    anchors: {
      head: { x: 420, y: 190, side: 'right' },
      chest: { x: 300, y: 372, side: 'left' },
      core: { x: 415, y: 560, side: 'right' },
    },
  },
  female: {
    paths: FEMALE_FRONT,
    box: { x: -4, y: -4, w: 650, h: 1445 },
    anchors: {
      head: { x: 385, y: 165, side: 'right' },
      chest: { x: 262, y: 376, side: 'left' },
      core: { x: 372, y: 545, side: 'right' },
    },
  },
}

function pathsFor(paths: BodyPaths, region: BodyRegionId): string[] {
  const { slugs, side } = REGION_PARTS[region]
  return paths.parts
    .filter((p) => slugs.includes(p.slug))
    .flatMap((p) => (side === 'both' ? [...(p.common ?? []), ...(p.left ?? []), ...(p.right ?? [])] : (p[side] ?? [])))
}

const FILL: Record<Status, string> = {
  baseline: 'fill-[rgb(169_189_230/0.16)] stroke-[rgb(169_189_230/0.35)] hover:fill-[rgb(169_189_230/0.28)]',
  attention: 'fill-[rgb(234_254_7/0.30)] stroke-brand hover:fill-[rgb(234_254_7/0.42)]',
  flagged: 'fill-[rgb(228_55_0/0.55)] stroke-[#ff6a3d] hover:fill-[rgb(228_55_0/0.7)]',
}

/** Texto de estado sem o prefixo ("Flagged for ground · −2.1 h" → "−2.1 h"). */
function detailOf(region: BodyRegion) {
  const t = region.stateText ?? ''
  const i = t.indexOf('·')
  return i >= 0 ? t.slice(i + 1).trim() : undefined
}

/** "Chest · cardiovascular" → região "Chest" e sistema "Cardiovascular". */
function splitName(name = '') {
  const [region, system] = name.split(' · ')
  return { region, system: system ? system[0].toUpperCase() + system.slice(1) : undefined }
}

function RegionName({ name }: { name?: string }) {
  const { region, system } = splitName(name)
  return (
    <span className="flex flex-col leading-tight">
      <span className="text-[11px] font-semibold tracking-[0.08em] text-ink-soft uppercase">{region}</span>
      {system && <span className="text-sm font-semibold text-ink">{system}</span>}
    </span>
  )
}

function RegionLabel({ region, align }: { region: BodyRegion; align: 'left' | 'right' }) {
  return (
    <div className={cn('flex flex-col gap-1 whitespace-nowrap', align === 'right' ? 'items-end text-right' : 'items-start')}>
      <RegionName name={region.name} />
      <StatusBadge status={region.status} className={region.status === 'baseline' ? '' : '-mx-0.5'} />
      {region.status !== 'baseline' && detailOf(region) && (
        <span className="font-mono text-[13px] text-ink">{detailOf(region)}</span>
      )}
    </div>
  )
}

export function BodyAvatar({
  regions,
  selected,
  onSelect,
  gender = 'male',
  className,
}: {
  regions: BodyRegion[]
  selected?: BodyRegionId | null
  onSelect?: (id: BodyRegionId) => void
  gender?: 'male' | 'female'
  className?: string
}) {
  const { paths, box, anchors } = LAYOUTS[gender]
  const byId = new Map(regions.map((r) => [r.id, r]))
  const labelled = regions.filter((r) => r.name && anchors[r.id])
  // A figura ganha uma margem de cada lado para as linhas-guia chegarem até a coluna dos rótulos.
  const pad = 60
  const vb = `${box.x - pad} ${box.y} ${box.w + pad * 2} ${box.h}`
  const top = (y: number) => `${((y - box.y) / box.h) * 100}%`

  function onKey(e: KeyboardEvent, id: BodyRegionId) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onSelect?.(id)
    }
  }

  return (
    <div className={cn('flex flex-col items-center gap-4', className)}>
      <div className="grid w-full grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-stretch">
        {/* Rótulos à esquerda (só a partir de sm; no celular viram lista embaixo) */}
        <div className="relative hidden sm:block" aria-hidden>
          {labelled
            .filter((r) => anchors[r.id]!.side === 'left')
            .map((r) => (
              <div key={r.id} className="absolute right-1 -translate-y-1/2" style={{ top: top(anchors[r.id]!.y) }}>
                <RegionLabel region={r} align="right" />
              </div>
            ))}
        </div>

        <div
          className="relative"
          style={{ aspectRatio: `${box.w + pad * 2} / ${box.h}`, height: 'var(--avatar-h, 420px)' }}
        >
          {/* brilho radial atrás da figura */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-[8%_14%] rounded-full bg-[radial-gradient(closest-side,rgb(46_150_245/0.22),transparent)]"
          />
          <svg viewBox={vb} className="relative size-full overflow-visible" role="group" aria-label="Body map">
            <path
              d={paths.outline}
              className="fill-[rgb(17_48_107/0.55)] stroke-[rgb(169_189_230/0.45)]"
              strokeWidth={1.25}
              vectorEffect="non-scaling-stroke"
            />
            {paths.parts
              .filter((p) => NEUTRAL.includes(p.slug))
              .flatMap((p) => [...(p.common ?? []), ...(p.left ?? []), ...(p.right ?? [])])
              .map((d) => (
                <path key={d} d={d} className="fill-[rgb(169_189_230/0.08)]" />
              ))}

            {ORDER.map((id) => {
              const region = byId.get(id)
              const status = region?.status ?? 'baseline'
              const isSelected = selected === id
              return (
                <g
                  key={id}
                  role={onSelect ? 'button' : undefined}
                  tabIndex={onSelect ? 0 : undefined}
                  aria-label={`${REGION_NAMES[id]}: ${region?.stateText ?? 'Within baseline'}`}
                  aria-pressed={onSelect ? isSelected : undefined}
                  onClick={onSelect ? () => onSelect(id) : undefined}
                  onKeyDown={onSelect ? (e) => onKey(e, id) : undefined}
                  className={cn(
                    'body-region outline-none',
                    onSelect && 'cursor-pointer',
                    isSelected && 'is-selected',
                  )}
                >
                  {pathsFor(paths, id).map((d) => (
                    <path
                      key={d}
                      d={d}
                      className={cn('transition-[fill] duration-150', FILL[status])}
                      strokeWidth={isSelected ? 2.5 : 1}
                      vectorEffect="non-scaling-stroke"
                    />
                  ))}
                </g>
              )
            })}

            {labelled.map((r) => {
              const a = anchors[r.id]!
              const x2 = a.side === 'left' ? box.x - pad : box.x + box.w + pad
              return (
                <g key={`lead-${r.id}`} aria-hidden className="hidden sm:inline">
                  <line
                    x1={a.x}
                    y1={a.y}
                    x2={x2}
                    y2={a.y}
                    className="stroke-[rgb(169_189_230/0.55)]"
                    strokeWidth={1}
                    vectorEffect="non-scaling-stroke"
                  />
                  <circle cx={a.x} cy={a.y} r={9} className="fill-ink" />
                </g>
              )
            })}
          </svg>
        </div>

        <div className="relative hidden sm:block" aria-hidden>
          {labelled
            .filter((r) => anchors[r.id]!.side === 'right')
            .map((r) => (
              <div key={r.id} className="absolute left-1 -translate-y-1/2" style={{ top: top(anchors[r.id]!.y) }}>
                <RegionLabel region={r} align="left" />
              </div>
            ))}
        </div>
      </div>

      {/* Celular: os mesmos rótulos em lista, embaixo da figura */}
      <ul className="grid w-full gap-2 sm:hidden" aria-hidden>
        {labelled.map((r) => (
          <li key={r.id} className="flex items-center justify-between gap-3 rounded-lg bg-surface-2/60 px-3 py-2">
            <RegionName name={r.name} />
            <StatusBadge status={r.status} detail={r.status === 'baseline' ? undefined : detailOf(r)} />
          </li>
        ))}
      </ul>
    </div>
  )
}
