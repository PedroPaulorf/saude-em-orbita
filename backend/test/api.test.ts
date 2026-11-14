import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import { createApp } from '../src/app.js'

const token = 'health7-test-token'
const headers = { 'x-api-key': token }
const url = '/api/v1/crew/crew-02/checkins'
const payload = {
  clientId: 'tablet-1-checkin-1', at: '2026-11-14T14:00:00Z', source: 'simulated',
  vitals: { heartRate: 71, bloodPressure: 118, bloodPressureDiastolic: 76, sleep: 0, temperature: 36.7 },
  behavioral: { mood: 4, stress: 3, rest: 2 },
}

test('stores once, survives restart and separates crews', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'health7-'))
  const databasePath = join(dir, 'test.sqlite')
  let app = createApp({ databasePath, apiKey: token })
  try {
    assert.equal((await app.inject('/health')).statusCode, 200)
    assert.equal((await app.inject(url)).statusCode, 401)
    assert.equal((await app.inject({ url: '/api/v1/crew/crew-02', headers })).json().id, 'crew-02')
    const post = () => app.inject({ method: 'POST', url, headers, payload })
    const created = await post()
    assert.equal(created.statusCode, 201)
    assert.ok(created.json().receivedAt)
    assert.equal((await post()).statusCode, 200)
    assert.equal((await app.inject({ method: 'POST', url, headers, payload: { ...payload, vitals: { sleep: 6 } } })).statusCode, 409)
    await app.close()
    app = createApp({ databasePath, apiKey: token })
    const list = (await app.inject({ url, headers })).json()
    assert.equal(list.items.length, 1)
    assert.equal(list.items[0].id, created.json().id)
    assert.equal(list.items[0].vitals.sleep, 0)
    const fixture = new DatabaseSync(databasePath)
    fixture.prepare('INSERT INTO crew(id, profile) VALUES (?, ?)').run('crew-03', JSON.stringify({ id: 'crew-03' }))
    fixture.close()
    const otherUrl = '/api/v1/crew/crew-03/checkins'
    assert.equal((await app.inject({ url: otherUrl, headers })).json().items.length, 0)
    assert.equal((await app.inject({ method: 'POST', url: otherUrl, headers, payload })).statusCode, 201)
    assert.equal((await app.inject({ url, headers })).json().items.length, 1)
    assert.equal((await app.inject({ url: '/api/v1/crew/missing/checkins', headers })).statusCode, 404)
    assert.equal((await app.inject({ url: url + '?from=2026-11-15T00:00:00Z', headers })).json().items.length, 0)
  } finally { await app.close(); rmSync(dir, { recursive: true, force: true }) }
})

test('rejects invalid data and supports partial physical or behavioral check-ins', async () => {
  const app = createApp({ databasePath: ':memory:', apiKey: token })
  try {
    for (const invalid of [
      { ...payload, at: 'yesterday' }, { ...payload, behavioral: { stress: 6 } },
      { ...payload, at: '2026-11-14T23:59:60Z' },
      { ...payload, behavioral: { mood: 2.5 } }, { ...payload, vitals: { heartRate: -1 } },
      { ...payload, vitals: { bloodPressure: 118 } }, { ...payload, vitals: {}, behavioral: {} },
      { ...payload, source: 'live' }, { ...payload, extra: 'unknown' },
    ]) assert.equal((await app.inject({ method: 'POST', url, headers, payload: invalid })).statusCode, 400)
    assert.equal((await app.inject({ method: 'POST', url, headers, payload: {
      clientId: 'behavioral-only', at: payload.at, source: 'simulated', vitals: {}, behavioral: { mood: 4 },
    } })).statusCode, 201)
    assert.equal((await app.inject({ url: url + '?limit=1000', headers })).statusCode, 400)
    assert.equal((await app.inject({ url: url + '?from=2026-11-14T23:59:60Z', headers })).statusCode, 400)
    assert.equal((await app.inject({ url: url + '?from=2026-11-15T00:00:00Z&to=2026-11-14T00:00:00Z', headers })).statusCode, 400)
  } finally { await app.close() }
})

test('serves real HTTP and allows only configured browser origins', async () => {
  const app = createApp({ databasePath: ':memory:', apiKey: token, origins: ['http://tablet.local:5173'] })
  try {
    const address = await app.listen({ host: '127.0.0.1', port: 0 })
    assert.equal((await fetch(address + '/health')).status, 200)
    const allowed = await app.inject({ method: 'OPTIONS', url, headers: {
      origin: 'http://tablet.local:5173', 'access-control-request-method': 'POST',
      'access-control-request-headers': 'content-type,x-api-key',
    } })
    assert.equal(allowed.headers['access-control-allow-origin'], 'http://tablet.local:5173')
    const denied = await app.inject({ url, headers: { ...headers, origin: 'http://unknown.local' } })
    assert.equal(denied.headers['access-control-allow-origin'], undefined)
  } finally { await app.close() }
})
