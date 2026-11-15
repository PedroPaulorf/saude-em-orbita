import { useState } from 'react'
import { Radio } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { scopedStorageKey } from '@/lib/active-profile'
import { sendAlert, type AlertInput, type AlertRecord } from '@/lib/alert'
import { ESCALATE_PROTOCOL } from '@/lib/monitor'
import { utcTime } from '@/lib/utils'

const KEY = 'health7:ground-notified:v1'

function readNotified(date: string): AlertRecord | null {
  try {
    const k = scopedStorageKey(KEY)
    const v = k ? (JSON.parse(localStorage.getItem(k) ?? '{}') as Record<string, AlertRecord | string>)[date] : undefined
    return typeof v === 'string' ? { at: v, delivery: 'device' } : v ?? null
  } catch { return null }
}
function writeNotified(date: string, record: AlertRecord) {
  try {
    const k = scopedStorageKey(KEY)
    if (!k) return
    const all = JSON.parse(localStorage.getItem(k) ?? '{}') as Record<string, AlertRecord>
    localStorage.setItem(k, JSON.stringify({ ...all, [date]: record }))
  } catch { /* sem espaço: vale só nesta visita */ }
}

/**
 * Faixa vermelha fixa em ESCALATE (plano do assistente, seção 9, ajuste 4). Texto fixo do protocolo,
 * direto da regra, sem IA. "Notify ground" registra o alerta no fluxo "[H7] Alerta" do n8n; por enquanto
 * o alerta fica com a tripulação (sem envio para fora). Sem n8n ou sem rede, fica registrado no aparelho.
 */
export function EscalateBanner({ alert }: { alert: AlertInput }) {
  const [record, setRecord] = useState(() => readNotified(alert.date))
  const [sending, setSending] = useState(false)
  async function notify() {
    setSending(true)
    const result = await sendAlert(alert)
    writeNotified(alert.date, result)
    setRecord(result)
    setSending(false)
  }
  return (
    <div role="alert" className="sticky top-16 z-20 border-b-2 border-flag-mark bg-flag-mark text-white">
      <div className="mx-auto flex max-w-[1360px] flex-col gap-2 px-4 py-3 md:flex-row md:items-center md:gap-4 md:px-8">
        <Radio className="hidden size-6 shrink-0 md:block" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="font-semibold">
            Escalate · Day <span className="font-mono">{alert.day}</span>. {ESCALATE_PROTOCOL}
          </p>
          <p className="text-sm text-white/90">{alert.reasons.join(' · ')}</p>
        </div>
        {record ? (
          <p role="status" className="text-sm font-semibold">
            Alert recorded at <span className="font-mono">{utcTime(record.at)}</span>
            <span className="block text-xs font-normal text-white/85">
              {record.delivery === 'crew-only' ? 'Crew only for now: no message leaves the station in this demo' : 'Saved on this device; no ground link right now'}
            </span>
          </p>
        ) : (
          <Button onClick={() => { void notify() }} disabled={sending} className="shrink-0 self-start bg-white text-sa-deep hover:bg-white/90 md:self-center">
            {sending ? 'Recording…' : 'Notify ground'}
          </Button>
        )}
      </div>
    </div>
  )
}
