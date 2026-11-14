import { useId, useRef, type KeyboardEvent } from 'react'

/**
 * Escala de 1 a 5 para autorrelato (humor, estresse, sono).
 * A opção escolhida fica em inverse, não em amarelo: escolher não é alerta.
 * Não mostre pontuação somada nem interpretação.
 */
export function ScaleInput({
  label,
  low,
  high,
  value,
  onChange,
  hideLabel,
}: {
  label: string
  low: string
  high: string
  value: number | null
  onChange: (v: number) => void
  /** Esconde o rótulo visualmente quando a pergunta já aparece como título. */
  hideLabel?: boolean
}) {
  const id = useId()
  const refs = useRef<(HTMLButtonElement | null)[]>([])
  const options = [1, 2, 3, 4, 5]

  // Setas movem a escolha, como num grupo de rádio nativo.
  function onKeyDown(e: KeyboardEvent<HTMLButtonElement>, n: number) {
    const next = e.key === 'ArrowRight' || e.key === 'ArrowUp' ? n + 1 : e.key === 'ArrowLeft' || e.key === 'ArrowDown' ? n - 1 : null
    if (next == null || next < 1 || next > 5) return
    e.preventDefault()
    onChange(next)
    refs.current[next - 1]?.focus()
  }

  return (
    <div className="h7-field">
      <span className={hideLabel ? 'sr-only' : 'h7-label'} id={id}>
        {label}
      </span>
      <div className="h7-scale" role="radiogroup" aria-labelledby={id}>
        {options.map((n) => (
          <button
            key={n}
            ref={(el) => {
              refs.current[n - 1] = el
            }}
            type="button"
            className="h7-scale__opt"
            role="radio"
            aria-checked={value === n}
            tabIndex={value === n || (value == null && n === 1) ? 0 : -1}
            onClick={() => onChange(n)}
            onKeyDown={(e) => onKeyDown(e, n)}
          >
            {n}
          </button>
        ))}
      </div>
      <div className="h7-scale__ends h7-sm">
        <span>{low}</span>
        <span>{high}</span>
      </div>
    </div>
  )
}
