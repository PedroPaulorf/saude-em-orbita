import { before, after, test } from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import pg from 'pg'
import { createApp } from '../src/app.js'
import { hashPassword } from '../src/auth.js'
import { migrate } from '../src/database.js'

if (!process.env.TEST_DATABASE_URL) throw new Error('Use a separate PostgreSQL test database')
const admin = new pg.Pool({ connectionString: process.env.TEST_DATABASE_URL })
const schema = 'health7_menstrual_' + randomUUID().replaceAll('-', '')
const scoped = new URL(process.env.TEST_DATABASE_URL)
scoped.searchParams.set('options', '-c search_path=' + schema)
const db = new pg.Pool({ connectionString: scoped.toString() })
let app: Awaited<ReturnType<typeof createApp>>
const headers: Record<string, Record<string, string>> = {}
const input = (patch = {}) => ({ clientId: randomUUID(), startDate: '2024-02-28', endDate: '2024-03-02', flow: 'moderate', pain: null, symptoms: [], note: '', ...patch })
const get = (query = 'from=2024-02-01&to=2024-03-31', who = 'a') => app.inject({ url: '/api/v1/me/menstrual?' + query, headers: headers[who] })
const post = (path: string, payload: unknown, who = 'a') => app.inject({ method: 'POST', url: '/api/v1/me/menstrual' + path, headers: headers[who], payload: payload as any })
const bodyForEdit = (record: any, patch = {}) => ({ startDate: record.startDate, endDate: record.endDate, flow: record.flow, pain: record.pain, symptoms: record.symptoms, note: record.note, version: record.version, ...patch })
before(async () => {
  await admin.query('CREATE SCHEMA ' + schema); await migrate(db)
  for (const id of ['a', 'b', 'male']) {
    const profile = { id, displayName: 'Fictional ' + id, bodyModel: id === 'male' ? 'male' : 'female', source: 'simulated', missionDay: 1, baseline: {} }
    await db.query('INSERT INTO crew(id,username,password_hash,profile) VALUES($1,$1,$2,$3)', [id, await hashPassword('menstrual-test-password'), profile])
  }
  app = await createApp({ databaseUrl: scoped.toString() })
  for (const id of ['a', 'b', 'male']) {
    const response = await app.inject({ method: 'POST', url: '/api/v1/auth/login', headers: { 'x-requested-with': 'Health7' }, payload: { username: id, password: 'menstrual-test-password' } })
    assert.equal(response.statusCode, 200)
    headers[id] = { cookie: String(response.headers['set-cookie']).split(';')[0], 'x-requested-with': 'Health7', 'x-health7-crew': id }
  }
})
after(async () => { await app?.close(); await db.end(); await admin.query('DROP SCHEMA IF EXISTS ' + schema + ' CASCADE'); await admin.end() })

test('calendar is authenticated, empty by default and scoped to eligible account', async () => {
  assert.equal((await app.inject({ url: '/api/v1/me/menstrual?from=2024-01-01&to=2024-01-31' })).statusCode, 401)
  assert.deepEqual((await get()).json().items, [])
  assert.equal((await get('', 'male')).statusCode, 400)
  assert.equal((await get(undefined, 'male')).statusCode, 403)
  assert.equal((await post('/periods', input(), 'male')).statusCode, 403)
  assert.equal((await app.inject({ url: '/api/v1/me/menstrual?from=2024-01-01&to=2024-01-31', headers: { ...headers.a, 'x-health7-crew': 'b' } })).statusCode, 401)
})
test('date-only period spans leap day and month boundaries, preserves unknown pain and persists after restart', async () => {
  const payload = input({ note: 'Fictional test: cólica 🧪', symptoms: ['cramps'] })
  const saved = await post('/periods', payload)
  assert.equal(saved.statusCode, 201, saved.body)
  const record = saved.json()
  assert.equal(record.source, 'self-reported'); assert.equal(record.pain, null)
  assert.equal(record.startDate, '2024-02-28'); assert.equal(record.endDate, '2024-03-02')
  assert.equal((await get('from=2024-03-01&to=2024-03-31')).json().items.length, 1)
  assert.equal((await get(undefined, 'b')).json().items.length, 0)
  const restarted = await createApp({ databaseUrl: scoped.toString() })
  try {
    const read = await restarted.inject({ url: '/api/v1/me/menstrual?from=2024-02-29&to=2024-02-29', headers: headers.a })
    assert.equal(read.json().items[0].note, payload.note)
  } finally { await restarted.close() }
  assert.equal((await post('/periods', payload)).statusCode, 200, 'retry is idempotent')
  assert.equal((await post('/periods', { ...payload, pain: 0 })).statusCode, 409)
  assert.equal((await post('/periods', input({ crewId: 'b' }))).statusCode, 400)
  assert.equal((await db.query('SELECT count(*)::int n FROM checkins')).rows[0].n, 0, 'no clinical measurements fabricated')
})
test('invalid dates, reversed dates, future observations, invalid values and excessive windows fail', async () => {
  for (const patch of [{ startDate: '2023-02-29' }, { endDate: '2024-02-30' }, { startDate: '2024-2-01' }, { endDate: '2024-01-31' }, { startDate: '2999-01-01', endDate: null }, { endDate: '2999-01-01' }, { pain: -1 }, { pain: 11 }, { pain: 1.5 }, { flow: 'danger' }, { symptoms: ['cramps', 'cramps'] }, { symptoms: ['unsupported'] }, { note: 'a'.repeat(1001) }])
    assert.equal((await post('/periods', input(patch))).statusCode, 400, JSON.stringify(patch))
  for (const query of ['from=2023-02-29&to=2024-03-01', 'from=2024-03-01&to=2024-02-01', 'from=2020-01-01&to=2024-03-01', 'from=2024-01-01&to=2024-01-31&crewId=b'])
    assert.equal((await get(query)).statusCode, 400)
})
test('edits and deletion are owner-bound and reject stale versions', async () => {
  const record = (await get()).json().items[0]
  assert.equal((await post('/periods/' + record.id, bodyForEdit(record), 'b')).statusCode, 404)
  const edited = await post('/periods/' + record.id, bodyForEdit(record, { pain: 0, flow: 'light' }))
  assert.equal(edited.statusCode, 200, edited.body)
  assert.equal(edited.json().pain, 0); assert.equal(edited.json().version, 2)
  assert.equal((await post('/periods/' + record.id, bodyForEdit(record))).statusCode, 409)
  assert.equal((await post('/periods/' + record.id + '/delete', { version: 1 })).statusCode, 409)
  assert.equal((await post('/periods/' + record.id + '/delete', { version: 2 }, 'b')).statusCode, 404)
  assert.equal((await post('/periods/' + record.id + '/delete', { version: 2 })).statusCode, 204)
  assert.equal((await get()).json().items.length, 0)
})
test('simultaneous overlapping inserts cannot both succeed, including touching endpoints', async () => {
  const responses = await Promise.all([post('/periods', input()), post('/periods', input({ startDate: '2024-03-02', endDate: '2024-03-04' }))])
  assert.deepEqual(responses.map(r => r.statusCode).sort(), [201, 409])
  const record = (await get()).json().items[0]
  await post('/periods/' + record.id + '/delete', { version: record.version })
})
test('ongoing period blocks later overlapping records until ended and is visible in subsequent months', async () => {
  const record = (await post('/periods', input({ endDate: null }))).json()
  assert.equal((await get('from=2024-04-01&to=2024-04-30')).json().items[0].id, record.id)
  assert.equal((await post('/periods', input({ startDate: '2024-03-20', endDate: '2024-03-22' }))).statusCode, 409)
  assert.equal((await post('/periods/' + record.id, bodyForEdit(record, { endDate: '2024-03-02' }))).statusCode, 200)
  const next = await post('/periods', input({ startDate: '2024-03-20', endDate: '2024-03-22' }))
  assert.equal(next.statusCode, 201, next.body)
  assert.equal((await get('from=2024-04-01&to=2024-04-30')).json().items.length, 0)
  // Repeat migration leaves existing records intact.
  await migrate(db)
  assert.equal((await get()).json().items.length, 2)
})
