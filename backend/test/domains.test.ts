import { before, after, test } from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID, createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import pg from 'pg'
import { createApp } from '../src/app.js'
import { hashPassword } from '../src/auth.js'
import { migrate } from '../src/database.js'

const databaseUrl = process.env.TEST_DATABASE_URL
if (!databaseUrl) throw new Error('TEST_DATABASE_URL must point to a separate PostgreSQL test database')
const admin = new pg.Pool({ connectionString: databaseUrl })
const schema = 'health7_domains_' + randomUUID().replaceAll('-', '')
const scoped = new URL(databaseUrl)
scoped.searchParams.set('options', '-c search_path=' + schema)
const pool = new pg.Pool({ connectionString: scoped.toString() })
const password = 'domain-fixture-password-72'
const legacyId = randomUUID()
const at = '2026-11-14T10:00:00.000Z'
const oldPayload = { clientId: 'legacy', at, source: 'simulated', vitals: { heartRate: 70, spo2: 98, bloodPressure: 118, bloodPressureDiastolic: 76, temperature: 36.6, respiratoryRate: 16, sleep: 7, bodyMass: 65 }, behavioral: {} }
let app: Awaited<ReturnType<typeof createApp>>
let a: Record<string, string>, b: Record<string, string>
before(async () => {
  await admin.query('CREATE SCHEMA ' + schema)
  const initial = (await readFile(new URL('../migrations/001_initial.sql', import.meta.url), 'utf8')).replace(/\r\n/g, '\n')
  await pool.query(initial)
  await pool.query('CREATE TABLE schema_migrations(version text PRIMARY KEY, checksum text NOT NULL, applied_at timestamptz NOT NULL DEFAULT now())')
  await pool.query('INSERT INTO schema_migrations(version,checksum) VALUES($1,$2)', ['001_initial.sql', createHash('sha256').update(initial).digest('hex')])
  for (const id of ['a', 'b']) {
    const profile = { id, displayName: 'Fixture ' + id, missionDay: 1, bodyModel: 'female', source: 'simulated', baseline: { sleep: 8 } }
    await pool.query('INSERT INTO crew(id,username,password_hash,profile) VALUES($1,$1,$2,$3)', [id, await hashPassword(password), profile])
  }
  await pool.query('INSERT INTO checkins(id,crew_id,client_id,at,payload) VALUES($1,$2,$3,$4,$5)', [legacyId, 'a', oldPayload.clientId, at, oldPayload])
  await migrate(pool)
  app = await createApp({ databaseUrl: scoped.toString() })
  const login = async (username: string) => {
    const response = await app.inject({ method: 'POST', url: '/api/v1/auth/login', headers: { 'x-requested-with': 'Health7' }, payload: { username, password } })
    assert.equal(response.statusCode, 200)
    return { cookie: String(response.headers['set-cookie']).split(';')[0], 'x-requested-with': 'Health7', 'x-health7-crew': username }
  }
  a = await login('a'); b = await login('b')
})
after(async () => {
  await app?.close(); await pool.end()
  await admin.query('DROP SCHEMA IF EXISTS ' + schema + ' CASCADE'); await admin.end()
})
const get = (path: string, headers = a) => app.inject({ url: '/api/v1' + path, headers })
const post = (path: string, payload: unknown, headers = a) => app.inject({ method: 'POST', url: '/api/v1' + path, headers, payload: payload as any })
const window = '?from=2026-11-13T00:00:00Z&to=2026-11-15T00:00:00Z'

test('migration backfills person and health without erasing or rewriting legacy data', async () => {
  const person = await pool.query('SELECT * FROM person WHERE id=$1', ['a'])
  assert.equal(person.rows[0].name, 'Fixture a')
  assert.equal(person.rows[0].weight_kg, 65)
  assert.equal(person.rows[0].sex, null, 'avatar is not evidence of biological sex')
  const health = await pool.query('SELECT * FROM health WHERE checkin_id=$1', [legacyId])
  assert.equal(health.rows[0].oxygen_saturation_percent, 98)
  assert.equal(health.rows[0].respiratory_rate_per_min, 16)
  assert.equal(Object.hasOwn(health.rows[0], 'body_mass'), false)
  assert.deepEqual((await pool.query('SELECT payload FROM checkins WHERE id=$1', [legacyId])).rows[0].payload, oldPayload)
  await migrate(pool)
  assert.equal((await pool.query('SELECT count(*)::int n FROM health')).rows[0].n, 1)
})

test('person supports optional demographics, persists across restart and rejects invalid input or another owner', async () => {
  const initial = (await get('/me/person')).json()
  assert.equal(initial.age, null)
  assert.equal(initial.weightKg, 65)
  const input = { name: 'Fixture Alice', age: 31, weightKg: 64, heightCm: 170, sex: 'female', medicalHistory: 'Fictional fixture antecedents' }
  const saved = await post('/me/person', input)
  assert.equal(saved.statusCode, 200, saved.body)
  assert.equal(saved.json().heightCm, 170)
  const profile = (await get('/me')).json()
  assert.equal(profile.displayName, 'Fixture Alice')
  assert.equal((await get('/me/person', b)).json().name, 'Fixture b')
  for (const invalid of [{ age: -1 }, { weightKg: 0 }, { heightCm: 1000 }, { sex: 'invalid' }, { crewId: 'b' }])
    assert.equal((await post('/me/person', invalid)).statusCode, 400)
  assert.equal((await post('/me/person', { age: null })).json().age, null)
  assert.equal((await get('/me/person', { ...a, 'x-health7-crew': 'b' })).statusCode, 401)
  const restarted = await createApp({ databaseUrl: scoped.toString() })
  try { assert.equal((await restarted.inject({ url: '/api/v1/me/person', headers: a })).json().heightCm, 170) }
  finally { await restarted.close() }
})

test('health accepts elimination-only reports, remains idempotent and keeps weight in person', async () => {
  const input = { clientId: 'elimination-only', at, source: 'simulated', vitals: {}, behavioral: {}, healthDetails: { urine: 'Fixture: pale yellow', stool: 'Fixture: no report yesterday' } }
  assert.equal((await post('/me/checkins', input)).statusCode, 201)
  assert.equal((await post('/me/checkins', input)).statusCode, 200)
  const result = await get('/me/health' + window)
  assert.equal(result.statusCode, 200, result.body)
  assert.equal(result.json().items.filter((row: any) => row.clientId === input.clientId).length, 1)
  assert.deepEqual(result.json().items.find((row: any) => row.clientId === input.clientId).healthDetails, input.healthDetails)
  assert.equal(result.json().items.some((row: any) => Object.hasOwn(row.vitals, 'bodyMass')), false)
  assert.deepEqual((await get('/me/health' + window, b)).json().items, [])
  assert.equal((await post('/me/checkins', { ...input, healthDetails: { urine: 'changed' } })).statusCode, 409)
  assert.equal((await post('/me/checkins', { ...input, clientId: 'too-long', healthDetails: { stool: 'x'.repeat(2001) } })).statusCode, 400)
  const weightOnly = { clientId: 'old-weight-outbox', at: '2026-11-13T10:00:00Z', source: 'simulated', vitals: { bodyMass: 99 }, behavioral: {} }
  assert.equal((await post('/me/checkins', weightOnly)).statusCode, 201)
  assert.equal((await get('/me/person')).json().weightKg, 64, 'old offline weight cannot replace a newer person update')
  assert.equal((await pool.query('SELECT count(*)::int n FROM health WHERE client_id=$1', [weightOnly.clientId])).rows[0].n, 0)
})

test('environment persists time-series data with units, idempotency, windows and account isolation', async () => {
  const input = { clientId: 'env-1', at, source: 'simulated', radiationDoseMsv: 12.5, altitudeMeters: 400000, temperatureC: 23.5, oxygenPercent: 21 }
  const saved = await post('/me/environment', input)
  assert.equal(saved.statusCode, 201, saved.body)
  assert.equal(saved.json().oxygenPercent, 21)
  assert.equal((await post('/me/environment', input)).statusCode, 200)
  assert.equal((await post('/me/environment', { ...input, oxygenPercent: 20 })).statusCode, 409)
  const history = (await get('/me/environment' + window)).json()
  assert.equal(history.items.length, 1)
  assert.equal(history.items[0].radiationDoseMsv, 12.5)
  assert.deepEqual((await get('/me/environment' + window, b)).json().items, [])
  assert.deepEqual((await get('/me/environment?from=2026-11-01T00:00:00Z&to=2026-11-02T00:00:00Z')).json().items, [])
  for (const invalid of [{ ...input, clientId: 'bad-oxygen', oxygenPercent: 101 }, { ...input, clientId: 'bad-dose', radiationDoseMsv: -1 }, { ...input, clientId: 'bad-temperature', temperatureC: -274 }, { ...input, crewId: 'b' }, { clientId: 'empty', at, source: 'simulated' }])
    assert.equal((await post('/me/environment', invalid)).statusCode, 400)
  assert.equal((await get('/me/environment?limit=101')).statusCode, 400)
  assert.equal((await get('/me/environment?from=2026-11-15T00:00:00Z&to=2026-11-14T00:00:00Z')).statusCode, 400)
  assert.equal((await post('/me/environment', input, {})).statusCode, 403)
  assert.equal((await get('/me/environment', {})).statusCode, 401)
})

test('analysis context includes only own three domains with provenance and truncation', async () => {
  const response = await get('/me/context' + window + '&limit=1')
  assert.equal(response.statusCode, 200, response.body)
  const context = response.json()
  assert.equal(context.person.name, 'Fixture Alice')
  assert.equal(context.health.length, 1)
  assert.equal(context.environment[0].radiationDoseMsv, 12.5)
  assert.equal(context.truncated.health, true)
  assert.equal(context.sources.some((source: any) => source.type === 'environment' && source.crewId === 'a'), true)
  assert.equal(context.sources.every((source: any) => source.crewId === 'a'), true)
  const other = (await get('/me/context' + window, b)).json()
  assert.deepEqual(other.health, [])
  assert.deepEqual(other.environment, [])
})

test('an explicit weight clear is not undone by an older queued measurement', async () => {
  assert.equal((await post('/me/person', { weightKg: null })).json().weightKg, null)
  const queued = { clientId: 'weight-before-clear', at: '2026-11-12T10:00:00Z', source: 'simulated', vitals: { bodyMass: 75 }, behavioral: {} }
  assert.equal((await post('/me/checkins', queued)).statusCode, 201)
  assert.equal((await get('/me/person')).json().weightKg, null)
})
