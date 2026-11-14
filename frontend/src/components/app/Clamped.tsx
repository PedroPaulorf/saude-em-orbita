import { useState } from 'react'
import { cn } from '@/lib/utils'

/** Texto longo recortado em poucas linhas, com "Show more". */
export function Clamped({ text, lines = 4 }: { text: string; lines?: number }) {
  const [open, setOpen] = useState(false)
  return (
    <div>
      <p className={cn('text-[15px] leading-relaxed text-ink', !open && (lines === 3 ? 'line-clamp-3' : 'line-clamp-4'))}>{text}</p>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="mt-1 inline-flex h-8 cursor-pointer items-center text-sm font-semibold text-interactive underline underline-offset-3"
      >
        {open ? 'Show less' : 'Show more'}
      </button>
    </div>
  )
}
