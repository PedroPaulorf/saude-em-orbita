/** Gráfico dos últimos dias contra a linha de base (tracejada). Usa a cor do texto; o estado fica no selo. */
export function Sparkline({ values, baseline, label }: { values: number[]; baseline: number; label: string }) {
  const W = 120
  const H = 40
  const PAD = 6
  const all = [...values, baseline]
  const min = Math.min(...all)
  const max = Math.max(...all)
  const span = max - min || 1
  const y = (v: number) => H - PAD - ((v - min) / span) * (H - PAD * 2)
  const step = values.length > 1 ? (W - 8) / (values.length - 1) : 0
  const points = values.map((v, i) => [4 + i * step, y(v)] as const)
  const last = points[points.length - 1]

  return (
    <svg className="h7-spark" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label}>
      <line className="h7-spark__base" x1="0" x2={W} y1={y(baseline)} y2={y(baseline)} />
      <polyline className="h7-spark__line" points={points.map(([px, py]) => `${px},${py}`).join(' ')} />
      {last && <circle className="h7-spark__dot" cx={last[0]} cy={last[1]} r="4" />}
    </svg>
  )
}
