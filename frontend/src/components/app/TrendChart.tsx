import { CartesianGrid, Line, LineChart, ReferenceLine, XAxis, YAxis } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import { vitalConfigs } from '@/lib/health'
import { dayStatuses, lastSevenDays, trendSentence } from '@/lib/progress'
import type { Status, Vital } from '@/types'
import { StatusBadge } from './StatusBadge'

const DOT: Record<Status, string> = { baseline: 'var(--ink)', attention: 'var(--brand)', flagged: 'var(--flag-mark)' }

/**
 * Tendência de uma medida: últimos 7 dias, linha de base tracejada, ponto de hoje destacado
 * (na cor do estado, com o selo ao lado em palavra) e uma frase embaixo.
 */
export function TrendChart({ vital }: { vital: Vital }) {
  const history = vital.history ?? []
  const days = lastSevenDays().slice(-history.length)
  const statuses = dayStatuses(vital)
  const data = history.map((value, i) => ({ day: days[i], value }))
  const base = vital.baselineValue ?? 0
  const decimals = vitalConfigs.find((c) => c.id === vital.id)?.decimals ?? 0
  const all = [...history, base]
  const pad = (Math.max(...all) - Math.min(...all)) * 0.2 || 1
  const lo = Math.min(...all) - pad
  const hi = Math.max(...all) + pad
  const fmt = (n: number) => n.toFixed(decimals)
  const config = { value: { label: vital.label, color: 'var(--interactive)' } } satisfies ChartConfig
  const sentence = trendSentence(vital)

  return (
    <figure className="flex min-w-0 flex-col gap-2 rounded-xl border border-hairline bg-surface-1 p-4 md:p-5">
      <figcaption className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-sm text-ink-soft">{vital.label}</p>
          <p className="font-mono text-2xl leading-tight text-ink">
            {vital.value}
            <span className="ml-1 text-sm text-ink-soft">{vital.unit}</span>
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <StatusBadge status={vital.status} />
          <span className="flex items-center gap-1.5 font-mono text-xs text-ink-soft">
            <svg width="18" height="2" aria-hidden>
              <line x1="0" y1="1" x2="18" y2="1" stroke="var(--ink-soft)" strokeWidth="1.5" strokeDasharray="4 3" />
            </svg>
            baseline {vital.baseline}
          </span>
        </div>
      </figcaption>
      <ChartContainer config={config} className="aspect-auto h-36 w-full" aria-label={`${vital.label}, last ${history.length} days. ${sentence}`}>
        <LineChart data={data} margin={{ top: 8, right: 10, bottom: 0, left: -4 }} accessibilityLayer>
          <CartesianGrid vertical={false} stroke="var(--hairline)" />
          <XAxis dataKey="day" tickLine={false} axisLine={false} tickMargin={6} interval="preserveStartEnd" tick={{ fill: 'var(--ink-soft)', fontSize: 11 }} />
          <YAxis
            domain={[lo, hi]}
            ticks={[Math.min(...history), Math.max(...history)].filter((v, i, a) => a.indexOf(v) === i)}
            tickLine={false}
            axisLine={false}
            width={44}
            tick={{ fill: 'var(--ink-soft)', fontSize: 11 }}
            tickFormatter={fmt}
          />
          <ReferenceLine y={base} stroke="var(--ink-soft)" strokeDasharray="5 4" />
          <ChartTooltip cursor={{ stroke: 'var(--hairline-strong)' }} content={<ChartTooltipContent hideIndicator />} />
          <Line
            dataKey="value"
            type="linear"
            stroke="var(--color-value)"
            strokeWidth={2}
            isAnimationActive={false}
            dot={(props: { cx?: number; cy?: number; index?: number }) => {
              const last = props.index === data.length - 1
              return (
                <circle
                  key={props.index}
                  cx={props.cx}
                  cy={props.cy}
                  r={last ? 5.5 : 2.5}
                  fill={last ? DOT[statuses[props.index ?? 0]] : 'var(--interactive)'}
                  stroke={last ? 'var(--surface-1)' : 'none'}
                  strokeWidth={2}
                />
              )
            }}
          />
        </LineChart>
      </ChartContainer>
      <p className="text-sm text-ink-soft">{sentence}</p>
    </figure>
  )
}
