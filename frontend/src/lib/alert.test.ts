import { expect, test } from 'vitest'
import { alertPayload, sendAlert, type AlertInput } from './alert'

const input: AlertInput = { crew: 'NX-06', crewId: 'crew-nx06', date: '2026-11-14', day: 14, reasons: ['Red flag answered in the check-up'], signals: ['temperature +1.2 °C vs in-flight 36.6'], ruleVersion: 'health7-nexus-2026-11-14-v1' }

test('the alert always goes as ESCALATE, with the rule reasons and no AI text', () => {
  const p = alertPayload(input)
  expect(p.state).toBe('ESCALATE')
  expect(p.reasons).toEqual(input.reasons)
  expect(Date.parse(p.notifiedAt)).not.toBeNaN()
})

test('a confirmed n8n record is crew-only; no URL, an error or a bad answer stay on the device', async () => {
  const ok = (async () => new Response(JSON.stringify({ ok: true, recordedAt: '2026-11-14T22:44:58.777Z', delivery: 'crew-only' }))) as typeof fetch
  expect(await sendAlert(input, 'https://n8n.example/webhook/h7-alerta', ok)).toEqual({ at: '2026-11-14T22:44:58.777Z', delivery: 'crew-only' })
  expect((await sendAlert(input, '')).delivery).toBe('device')
  const down = (async () => { throw new TypeError('offline') }) as typeof fetch
  expect((await sendAlert(input, 'https://n8n.example/webhook/h7-alerta', down)).delivery).toBe('device')
  const refused = (async () => new Response('{"ok":false}', { status: 400 })) as typeof fetch
  expect((await sendAlert(input, 'https://n8n.example/webhook/h7-alerta', refused)).delivery).toBe('device')
})
