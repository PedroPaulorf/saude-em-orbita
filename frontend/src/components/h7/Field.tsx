import { useId, type InputHTMLAttributes } from 'react'

/** Campo numérico de uma medida. A frase de apoio informa a linha de base e não julga o valor. */
export function Field({
  label,
  unit,
  hint,
  error,
  ...input
}: {
  label: string
  unit?: string
  hint?: string
  error?: string
} & Omit<InputHTMLAttributes<HTMLInputElement>, 'id'>) {
  const id = useId()
  const hintId = `${id}-hint`
  return (
    <div className="h7-field">
      <label className="h7-label" htmlFor={id}>
        {label}
      </label>
      <div className="h7-input">
        <input id={id} aria-describedby={hint || error ? hintId : undefined} aria-invalid={!!error} {...input} />
        {unit && <span className="h7-meta">{unit}</span>}
      </div>
      {(error || hint) && (
        <p id={hintId} className="h7-sm" role={error ? 'alert' : undefined}>
          {error ?? hint}
        </p>
      )}
    </div>
  )
}
