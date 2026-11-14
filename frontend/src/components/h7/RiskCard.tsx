import { useState } from 'react'
import hrp from '@/data/hrp-risks.json'
import type { RiskGroup } from '@/data/regions'
import { SourceBadge } from './SourceBadge'

const RISKS = new Map(hrp.risks.map((r) => [r.id, r]))

/** Riscos do NASA HRP ligados a uma região do corpo ou ao clima espacial. Texto original da NASA, com link. */
export function RiskCard({ group: info }: { group: RiskGroup }) {
  const risks = info.risks.map((id) => RISKS.get(id)).filter((r) => r != null)
  const [openId, setOpenId] = useState(risks[0]?.id)
  const risk = risks.find((r) => r.id === openId) ?? risks[0]
  if (!risk) return null

  return (
    <article className="h7-card w-full" aria-live="polite">
      <div className="h7-card__head">
        <h3 className="h7-h3">{info.title}</h3>
        <SourceBadge source="live" />
      </div>

      {risks.length > 1 && (
        <div className="h7-row gap-2" role="tablist" aria-label="Linked NASA risks">
          {risks.map((r) => (
            <button
              key={r.id}
              type="button"
              role="tab"
              aria-selected={r.id === risk.id}
              className={r.id === risk.id ? 'h7-btn h7-btn--inverse min-h-9 px-3 text-sm' : 'h7-btn min-h-9 px-3 text-sm'}
              onClick={() => setOpenId(r.id)}
            >
              {r.title.replace(/^Risks? (of|from) /, '')}
            </button>
          ))}
        </div>
      )}

      <p className="h7-label">{risk.title}</p>
      <p>{risk.topRisks}</p>
      <hr className="h7-card__rule" />
      <p className="h7-label">What can be done</p>
      <p>{risk.whatCanBeDone}</p>
      <p className="h7-sm">
        NASA Human Research Program.{' '}
        <a className="h7-link" href={risk.url} target="_blank" rel="noreferrer">
          Source: nasa.gov
        </a>
      </p>
    </article>
  )
}
