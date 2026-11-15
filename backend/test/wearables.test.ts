import { before, after, test } from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import pg from 'pg'
import { createApp } from '../src/app.js'
import { openDatabase, migrate } from '../src/database.js'
import { seedDemo } from '../src/seed.js'

const databaseUrl = process.env.TEST_DATABASE_URL
if (!databaseUrl) throw new Error('TEST_DATABASE_URL must point to a separate PostgreSQL test database')
const schema = 'health7_wearables_' + randomUUID().replaceAll('-', '')
const admin = new pg.Pool({ connectionString: databaseUrl }), scoped = new URL(databaseUrl)
scoped.searchParams.set('options', '-c search_path=' + schema)
const db = openDatabase(scoped.toString()), password = 'wearables-test-password-29'
let app: Awaited<ReturnType<typeof createApp>>, a: Record<string, string>, b: Record<string, string>
const path = '/api/v1/me/wearables'
const sample = { device: 'Declared watch', metric: 'restingHeartRate', value: 62, unit: 'bpm', at: '2026-11-14T12:00:00Z' }
const batch = (clientId: string, extra = {}) => ({ clientId, version: 1, source: 'apple', format: 'health7-json-v1', quality: 'unverified', samples: [sample], ...extra })
const post = (input: unknown, headers = a) => app.inject({ method: 'POST', url: path + '/imports', headers, payload: input as any })
const history = (headers = a) => app.inject({ url: path, headers })
before(async () => {
  await admin.query('CREATE SCHEMA ' + schema)
  await migrate(db); await seedDemo(db, password)
  app = await createApp({ databaseUrl: scoped.toString() })
  async function login(username: string) {
    const result = await app.inject({ method: 'POST', url: '/api/v1/auth/login', headers: { 'x-requested-with': 'Health7' }, payload: { username, password } })
    assert.equal(result.statusCode, 200)
    return { cookie: String(result.headers['set-cookie']).split(';')[0], 'x-requested-with': 'Health7' }
  }
  a = await login('crew02'); b = await login('crew03')
})
after(async () => { await app?.close(); await db.end(); await admin.query('DROP SCHEMA IF EXISTS ' + schema + ' CASCADE'); await admin.end() })

test('wearable imports require session, CSRF and matching account, and reject foreign owner fields', async () => {
  assert.equal((await app.inject(path)).statusCode, 401)
  assert.equal((await post(batch('no-csrf'), { cookie: a.cookie })).statusCode, 403)
  assert.equal((await post(batch('mismatch'), { ...a, 'x-health7-crew': 'crew-03' })).statusCode, 401)
  assert.equal((await post(batch('foreign', { crewId: 'crew-03' }))).statusCode, 400)
  assert.equal((await history()).json().total, 0)
})
test('concurrent retries and overlapping files deduplicate without running demo medical rules', async () => {
  const results = await Promise.all([post(batch('first')), post(batch('first'))])
  assert.deepEqual(results.map(r => r.statusCode).sort(), [200, 201])
  assert.equal(results[0].json().id, results[1].json().id)
  const repeated = await post(batch('different-file'))
  assert.equal(repeated.statusCode, 201); assert.equal(repeated.json().added, 0); assert.equal(repeated.json().duplicates, 1)
  const item = (await history()).json().items[0]
  assert.equal(item.value, 62); assert.equal(item.quality, 'unverified'); assert.equal(item.verification, 'user-declared'); assert.equal(item.assessment, 'not-evaluated')
  assert.equal((await history(b)).json().total, 0)
  assert.equal((await db.query("SELECT count(*)::int AS n FROM checkins WHERE crew_id='crew-02'")).rows[0].n, 0)
  assert.equal((await db.query("SELECT count(*)::int AS n FROM medical_observations WHERE crew_id='crew-02'")).rows[0].n, 0)
})
test('changed observations or reused batch identifiers roll back the entire import', async () => {
  assert.equal((await post(batch('first', { samples: [{ ...sample, value: 63 }] }))).statusCode, 409)
  const mixed = await post(batch('conflict', { samples: [{ ...sample, at: '2026-11-14T14:00:00Z' }, { ...sample, value: 63 }] }))
  assert.equal(mixed.statusCode, 409, mixed.body)
  assert.equal((await history()).json().total, 1)
  assert.equal((await db.query("SELECT count(*)::int AS n FROM wearable_imports WHERE client_id='conflict'")).rows[0].n, 0)
})
test('rejects malformed dates, units, intervals, metric confusion and oversized batches', async () => {
  // Restart only this test server to reset its request-rate window for validation cases.
  await app.close(); app = await createApp({ databaseUrl: scoped.toString() })
  for (const input of [
    batch('bad', { samples: [{ ...sample, at: '2026-02-30T12:00:00Z' }] }),
    batch('bad', { samples: [{ ...sample, at: '2026-11-14T12:00:00' }] }),
    batch('bad', { samples: [{ ...sample, unit: 'Hz' }] }),
    batch('bad', { samples: [{ ...sample, value: -1 }] }),
    batch('bad', { samples: [{ ...sample, metric: 'temperature', unit: 'degC', value: 36 }] }),
    batch('bad', { samples: [{ ...sample, metric: 'sleepDuration', unit: 'h', value: 8 }] }),
    batch('bad', { samples: [{ ...sample, endAt: '2026-11-14T11:00:00Z' }] }),
    batch('bad', { samples: [{ ...sample, metric: 'spo2', unit: '%', value: 101 }] }),
    batch('bad', { source: 'actlumus' }),
    batch('bad', { source: 'samsung', format: 'apple-health-xml' }),
    batch('bad', { quality: 'clinical' }), batch('bad', { samples: Array(501).fill(sample) }),
  ]) assert.equal((await post(input)).statusCode, 400, JSON.stringify(input).slice(0, 200))
  assert.equal((await history()).json().total, 1)
})
test('all four declared sources persist with separate skin/light semantics and example quality after restart', async () => {
  await app.close(); app = await createApp({ databaseUrl: scoped.toString() })
  for (const source of ['apple', 'samsung', 'garmin', 'actlumus']) {
    const s = source === 'actlumus' ? { ...sample, metric: 'photopicLight', unit: 'lux', value: 120 } : sample
    const result = await post(batch(source, { source, quality: 'example', samples: [s] }))
    assert.equal(result.statusCode, 201, result.body); assert.equal(result.json().added, 1)
  }
  await app.close(); app = await createApp({ databaseUrl: scoped.toString() })
  const saved = (await history()).json()
  assert.equal(saved.total, 5); assert.equal(saved.items.filter((s: any) => s.quality === 'example').length, 4)
  assert.equal((await history(b)).json().total, 0)
})
test('history explicitly reports truncation and samples survive batches larger than the default request limit', async () => {
  const samples = Array.from({ length: 105 }, (_, i) => ({ ...sample, device: 'History watch '.repeat(8), at: new Date(Date.UTC(2026, 10, 15, 12, i)).toISOString() }))
  const result = await post(batch('history', { samples }))
  assert.equal(result.statusCode, 201, result.body)
  const saved = (await history()).json()
  assert.equal(saved.total, 110); assert.equal(saved.items.length, 100); assert.equal(saved.truncated, true)
  assert.ok(saved.items.every((s: any, i: number, rows: any[]) => i === 0 || rows[i - 1].at >= s.at))
  assert.ok(saved.nextCursor)
  const older = (await app.inject({ url: path + '?cursor=' + saved.nextCursor, headers: a })).json()
  assert.equal(older.items.length, 10); assert.equal(older.nextCursor, null); assert.equal(older.truncated, false)
  assert.equal(new Set([...saved.items, ...older.items].map((s: any) => s.id)).size, 110)
  assert.equal((await app.inject({ url: path + '?cursor=' + saved.nextCursor, headers: b })).json().total, 0)
  assert.equal((await app.inject({ url: path + '?cursor=invalid', headers: a })).statusCode, 400)
})

test('Bluetooth persists generic HRS transport without inferring a manufacturer or resting context', async () => {
  await app.close(); app = await createApp({ databaseUrl: scoped.toString() })
  const bluetooth = batch('ble-reading', { source: 'bluetooth', format: 'bluetooth-hrs-v1', samples: [{ ...sample, metric: 'heartRate' }] })
  for (const invalid of [
    { ...bluetooth, format: 'health7-json-v1' }, { ...bluetooth, source: 'samsung' },
    { ...bluetooth, quality: 'example' }, { ...bluetooth, samples: [sample] },
    { ...bluetooth, samples: [{ ...sample, metric: 'heartRate', endAt: sample.at }] },
  ]) assert.equal((await post(invalid, b)).statusCode, 400)
  const created = await post(bluetooth, b)
  assert.equal(created.statusCode, 201, created.body)
  assert.equal((await post(bluetooth, b)).statusCode, 200)
  const rows = (await history(b)).json()
  assert.equal(rows.total, 1)
  assert.equal(rows.items[0].source, 'bluetooth'); assert.equal(rows.items[0].metric, 'heartRate')
  assert.equal(rows.items[0].transport, 'bluetooth-le'); assert.equal(rows.items[0].protocol, 'heart-rate-service')
  assert.equal(rows.items[0].verification, 'user-declared'); assert.equal(rows.items[0].assessment, 'not-evaluated')
})

test('Samsung phone bridge keeps Health Connect provenance, restrictions and retry identity', async () => {
  await app.close(); app = await createApp({ databaseUrl: scoped.toString() })
  const phone = batch('phone-reading', { source: 'samsung', format: 'samsung-health-connect-v1', samples: [{ ...sample, device: 'Samsung Health | SM-R390', metric: 'heartRate' }] })
  for (const invalid of [
    { ...phone, source: 'garmin' }, { ...phone, quality: 'example' },
    { ...phone, samples: [{ ...sample, metric: 'restingHeartRate' }] },
  ]) assert.equal((await post(invalid, b)).statusCode, 400)
  const saved = await post(phone, b)
  assert.equal(saved.statusCode, 201, saved.body)
  assert.equal((await post(phone, b)).statusCode, 200)
  const same = await post({ ...phone, clientId: 'same-from-new-sync' }, b)
  assert.equal(same.json().added, 0); assert.equal(same.json().duplicates, 1)
  const item = (await history(b)).json().items.find((s: any) => s.device === 'Samsung Health | SM-R390')
  assert.equal(item.transport, 'android-health-connect'); assert.equal(item.protocol, 'samsung-health-heart-rate')
  assert.equal(item.verification, 'user-declared'); assert.equal(item.assessment, 'not-evaluated')
})
