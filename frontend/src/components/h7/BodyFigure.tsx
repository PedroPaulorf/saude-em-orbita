import type { KeyboardEvent } from 'react'
import type { BodyRegion, BodyRegionId } from '@/types'
import { cn } from '@/lib/utils'

/*
  Figura do corpo em 2D (esquema geométrico neutro do design system).
  O viewBox tem 440 de largura (20 a mais que o do design system) para caber
  "Flagged for ground · −2.1 h" no rótulo.
  As versões masculina e feminina ainda não foram desenhadas: quando existirem,
  troque as formas em SHAPES mantendo os mesmos ids de região.
*/
type Shape =
  | { kind: 'circle'; cx: number; cy: number; r: number }
  | { kind: 'rect'; x: number; y: number; width: number; height: number; rx: number }

const SHAPES: Record<BodyRegionId, Shape> = {
  head: { kind: 'circle', cx: 100, cy: 40, r: 24 },
  chest: { kind: 'rect', x: 64, y: 72, width: 72, height: 54, rx: 12 },
  core: { kind: 'rect', x: 64, y: 132, width: 72, height: 54, rx: 12 },
  leftArm: { kind: 'rect', x: 36, y: 76, width: 20, height: 120, rx: 10 },
  rightArm: { kind: 'rect', x: 144, y: 76, width: 20, height: 120, rx: 10 },
  leftLeg: { kind: 'rect', x: 68, y: 194, width: 28, height: 140, rx: 12 },
  rightLeg: { kind: 'rect', x: 104, y: 194, width: 28, height: 140, rx: 12 },
}

/** Onde sai a linha do rótulo (x inicial) e a altura do rótulo. */
const LEADS: Partial<Record<BodyRegionId, { x1: number; y: number }>> = {
  head: { x1: 124, y: 40 },
  chest: { x1: 170, y: 99 },
  core: { x1: 170, y: 159 },
}

const NAMES: Record<BodyRegionId, string> = {
  head: 'Head',
  chest: 'Chest',
  core: 'Core',
  leftArm: 'Left arm',
  rightArm: 'Right arm',
  leftLeg: 'Left leg',
  rightLeg: 'Right leg',
}

export function BodyFigure({
  regions,
  selected,
  onSelect,
}: {
  regions: BodyRegion[]
  selected?: BodyRegionId | null
  onSelect?: (id: BodyRegionId) => void
}) {
  const byId = new Map(regions.map((r) => [r.id, r]))

  function onKey(e: KeyboardEvent, id: BodyRegionId) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onSelect?.(id)
    }
  }

  return (
    <svg className="h7-body" viewBox="0 0 440 360" role="group" aria-label="Body figure">
      {(Object.keys(SHAPES) as BodyRegionId[]).map((id) => {
        const region = byId.get(id)
        const shape = SHAPES[id]
        const className = cn(
          'h7-body__part',
          region?.status === 'attention' && 'h7-body__part--attention',
          region?.status === 'flagged' && 'h7-body__part--flagged',
        )
        const label = `${NAMES[id]}: ${region?.stateText ?? 'Within baseline'}`
        const common = {
          className,
          role: onSelect ? 'button' : undefined,
          tabIndex: onSelect ? 0 : undefined,
          'aria-label': label,
          'aria-pressed': onSelect ? selected === id : undefined,
          onClick: onSelect ? () => onSelect(id) : undefined,
          onKeyDown: onSelect ? (e: KeyboardEvent) => onKey(e, id) : undefined,
          style: selected === id ? { strokeWidth: 4 } : undefined,
        }
        return shape.kind === 'circle' ? (
          <circle key={id} cx={shape.cx} cy={shape.cy} r={shape.r} {...common} />
        ) : (
          <rect key={id} x={shape.x} y={shape.y} width={shape.width} height={shape.height} rx={shape.rx} {...common} />
        )
      })}

      {regions.map((r) => {
        const lead = LEADS[r.id]
        if (!lead || !r.name) return null
        return (
          <g key={`label-${r.id}`} aria-hidden>
            <line className="h7-body__lead" x1={lead.x1} y1={lead.y} x2={208} y2={lead.y} />
            <text className="h7-body__name" x={216} y={lead.y - 2}>
              {r.name}
            </text>
            <text className="h7-body__state" x={216} y={lead.y + 16}>
              {r.stateText}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
