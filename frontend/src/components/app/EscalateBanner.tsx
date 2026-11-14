import { useState } from 'react'
import { Radio } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { scopedStorageKey } from '@/lib/active-profile'
import { ESCALATE_PROTOCOL } from '@/lib/monitor'
import { utcTime } from '@/lib/utils'

const KEY = 'health7:ground-notified:v1'

function readNotified(date: string): string | null {
  try {
    const k = scopedStorageKey(KEY)
    return k ? (JSON.parse(localStorage.getItem(k) ?? '{}') as Record<string, string>)[date] ?? null : null
  } catch { return null }
}
function writeNotified(date: string, at: string) {
  try {
    const k = scopedStorageKey(KEY)
    if (!k) return
    const all = JSON.parse(localStorage.getItem(k) ?? '{}') as Record<string, string>
    localStorage.setItem(k, JSON.stringify({ ...all, [date]: at }))
  } catch { /* sem espaço: vale só nesta visita */ }
}

/**
 * Faixa vermelha fixa em ESCALATE (plano do assistente, seção 9, ajuste 4). Texto fixo do protocolo,
 * direto da regra, sem IA. "Notify ground" no demo só registra o horário neste aparelho.
 */
export function EscalateBanner({ date, day, reasons }: { date: string; day: number; reasons: string[] }) {
  const [notifiedAt, setNotifiedAt] = useState(() => readNotified(date))
  function notify() {
    const at = new Date().toISOString()
    writeNotified(date, at)
    setNotifiedAt(at)
  }
  return (
    <div role="alert" className="sticky top-16 z-20 border-b-2 border-flag-mark bg-flag-mark text-white">
      <div className="mx-auto flex max-w-[1360px] flex-col gap-2 px-4 py-3 md:flex-row md:items-center md:gap-4 md:px-8">
        <Radio className="hidden size-6 shrink-0 md:block" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="font-semibold">
            Escalate · Day <span className="font-mono">{day}</span>. {ESCALATE_PROTOCOL}
          </p>
          <p className="text-sm text-white/90">{reasons.join(' · ')}</p>
        </div>
        {notifiedAt ? (
          <p role="status" className="text-sm font-semibold">
            Ground notified at <span className="font-mono">{utcTime(notifiedAt)}</span>
            <span className="block text-xs font-normal text-white/85">Demo: time recorded on this device only</span>
          </p>
        ) : (
          <Button onClick={notify} className="shrink-0 self-start bg-white text-sa-deep hover:bg-white/90 md:self-center">
            Notify ground
          </Button>
        )}
      </div>
    </div>
  )
}
