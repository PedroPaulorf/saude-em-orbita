import { Fragment } from 'react'
import type { Connection, Vital } from '@/types'
import { ConnectionPill } from './ConnectionPill'
import { SourceBadge } from './SourceBadge'
import { StatusBadge } from './StatusBadge'

/**
 * Resumo do que foi sinalizado no dia, para o cirurgião de voo.
 * Só entram medidas em atenção ou sinalizadas, cada uma com a regra que gerou o estado.
 */
export function ReportCard({ vitals, connection }: { vitals: Vital[]; connection: Connection }) {
  const flagged = vitals
    .filter((v) => v.status !== 'baseline')
    .sort((a, b) => (a.status === b.status ? 0 : a.status === 'flagged' ? -1 : 1))

  return (
    <article className="h7-card">
      <div className="h7-card__head">
        <h3 className="h7-h3">Report for ground</h3>
        <ConnectionPill state={connection} />
      </div>

      {flagged.length === 0 && <p className="h7-sm">Nothing differs from your baseline today.</p>}

      {flagged.map((v, i) => (
        <Fragment key={v.id}>
          {i > 0 && <hr className="h7-card__rule" />}
          <div className="h7-report__row">
            <div>
              <div className="h7-label">{v.label}</div>
              <div className="h7-meta">
                {v.value} {v.unit} · baseline {v.baseline}
              </div>
            </div>
            <StatusBadge status={v.status} />
            {v.rule && <p className="h7-sm h7-report__rule">{v.rule}</p>}
          </div>
        </Fragment>
      ))}

      <div className="h7-row">
        {flagged.length > 0 && <SourceBadge source="demo" />}
        <SourceBadge source="simulated" />
      </div>
    </article>
  )
}
