/*
  Alerta de ESCALATE (fluxo "[H7] Alerta" do n8n). Sem IA: o motor decide e o texto é fixo.
  Por enquanto o alerta fica com a tripulação: o n8n registra e confirma (delivery "crew-only"),
  sem mandar mensagem para fora. Sem VITE_N8N_ALERT_WEBHOOK_URL, ou sem rede, o horário fica
  registrado só neste aparelho.
*/
export const ALERT_URL = (import.meta.env.VITE_N8N_ALERT_WEBHOOK_URL ?? '').trim()

export interface AlertInput {
  crew: string
  crewId: string
  date: string
  day: number
  reasons: string[]
  signals: string[]
  ruleVersion: string
}

export interface AlertRecord {
  at: string
  /** crew-only: registrado no n8n, sem envio para fora · device: só neste aparelho. */
  delivery: 'crew-only' | 'device'
}

export function alertPayload(input: AlertInput) {
  return { ...input, state: 'ESCALATE' as const, notifiedAt: new Date().toISOString() }
}

/** Envia ao n8n; qualquer falha vira registro só no aparelho (a faixa funciona sem rede). */
export async function sendAlert(input: AlertInput, url = ALERT_URL, fetcher: typeof fetch = fetch): Promise<AlertRecord> {
  const local: AlertRecord = { at: new Date().toISOString(), delivery: 'device' }
  if (!url) return local
  try {
    const res = await fetcher(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(alertPayload(input)),
      signal: AbortSignal.timeout(10_000),
    })
    if (!res.ok) return local
    const body = (await res.json()) as { ok?: boolean; recordedAt?: string }
    return body.ok && typeof body.recordedAt === 'string' ? { at: body.recordedAt, delivery: 'crew-only' } : local
  } catch {
    return local
  }
}
