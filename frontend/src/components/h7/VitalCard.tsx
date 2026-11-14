import type { Vital } from '@/types'
import { cn } from '@/lib/utils'
import { Sparkline } from './Sparkline'
import { StatusBadge } from './StatusBadge'

/**
 * Cartão de uma medida, comparada com a linha de base da pessoa.
 * - number (opção A): número primeiro; boa para grade de cartões.
 * - trend (opção B): linha com gráfico de 7 dias; ocupa a largura toda.
 * Use uma opção só por tela.
 */
export function VitalCard({
  vital,
  variant = 'number',
  className,
}: {
  vital: Vital
  variant?: 'number' | 'trend'
  className?: string
}) {
  const baselineLine = (
    <div className="h7-meta">
      baseline {vital.baseline} · <b>{vital.delta}</b>
    </div>
  )

  if (variant === 'trend') {
    return (
      <article className={cn('h7-card h7-vital h7-vital--row', className)}>
        <div>
          <div className="h7-label">{vital.label}</div>
          {baselineLine}
        </div>
        {vital.history && vital.baselineValue != null ? (
          <Sparkline
            values={vital.history}
            baseline={vital.baselineValue}
            label={`${vital.label}, last ${vital.history.length} days against baseline`}
          />
        ) : (
          <span />
        )}
        <div className="text-right">
          <div className="h7-vital__value justify-end">
            <span className="h7-reading">{vital.value}</span>
            <span className="h7-meta">{vital.unit}</span>
          </div>
          <StatusBadge status={vital.status} />
        </div>
      </article>
    )
  }

  return (
    <article className={cn('h7-card h7-vital', className)}>
      <div className="h7-card__head">
        <span className="h7-label">{vital.label}</span>
        <StatusBadge status={vital.status} />
      </div>
      <div className="h7-vital__value">
        <span className="h7-reading">{vital.value}</span>
        <span className="h7-meta">{vital.unit}</span>
      </div>
      {baselineLine}
    </article>
  )
}
