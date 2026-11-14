import type { ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * primary: ação principal (Neon Yellow). Uma por tela.
   * secondary: ações secundárias, como voltar.
   * inverse: só para o que vai ao solo, como enviar o relatório.
   */
  variant?: 'primary' | 'secondary' | 'inverse'
  /** Ocupa a largura do contêiner. */
  block?: boolean
}

export function Button({ variant = 'secondary', block, className, type = 'button', ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        'h7-btn',
        variant === 'primary' && 'h7-btn--primary',
        variant === 'inverse' && 'h7-btn--inverse',
        block && 'h7-btn--block',
        className,
      )}
      {...props}
    />
  )
}
