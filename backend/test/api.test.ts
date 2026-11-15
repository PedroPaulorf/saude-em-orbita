import { after, before, test } from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID, createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { migrate } from '../src/database.js'
import { createServer } from 'node:http'
import pg from 'pg'
import { createApp } from '../src/app.js'
import { seedDemo } from '../src/seed.js'

const databaseUrl = process.env.TEST_DATABASE_URL
if (!databaseUrl) throw new Error('TEST_DATABASE_URL must point to a real PostgreSQL test database; tests do not skip')
const schema = 'health7_test_' + randomUUID().replaceAll('-', '')
const admin = new pg.Pool({ connectionString: databaseUrl })
const scoped = new URL(databaseUrl)
scoped.searchParams.set('options', '-c search_path=' + schema)
const pool = new pg.Pool({ connectionString: scoped.toString() })
const password = 'test-only-password-39'
let app: Awaited<ReturnType<typeof createApp>>
let a: Record<string, string>, b: Record<string, string>
const at = '2026-11-14T14:00:00Z'
const payload = { clientId: 'check-1', at, source: 'simulated', vitals: { sleep: 0, heartRate: 71, spo2: 97, respiratoryRate: 16, bodyMass: 72 }, behavioral: { mood: 4 } }
const csrf = { 'x-requested-with': 'Health7' }
async function login(username = 'crew02') {
  const response = await app.inject({ method: 'POST', url: '/api/v1/auth/login', headers: csrf, payload: { username, password } })
  assert.equal(response.statusCode, 200, response.body)
  const cookie = String(response.headers['set-cookie']).split(';')[0]
  assert.match(String(response.headers['set-cookie']), /HttpOnly/)
  return { ...csrf, cookie }
}
const post = (url: string, data: unknown, headers = a) => app.inject({ method: 'POST', url, headers, payload: data as any })
const get = (url: string, headers = a) => app.inject({
  url: /^\/api\/v1\/me\/(checkins|symptoms)$/.test(url)
    ? url + '?from=2026-11-14T00:00:00Z&to=2026-11-15T00:00:00Z' : url,
  headers,
})
before(async () => {
  await admin.query('CREATE SCHEMA ' + schema)
  app = await createApp({ databaseUrl: scoped.toString(), origins: ['http://tablet.local'] })
  await seedDemo(pool, password)
  a = await login(); b = await login('crew03')
})
after(async () => {
  await app?.close(); await pool.end()
  await admin.query('DROP SCHEMA IF EXISTS ' + schema + ' CASCADE'); await admin.end()
})

test('migration checksums tolerate Windows line endings but still reject content changes', async () => {
  const sql = (await readFile(new URL('../migrations/001_initial.sql', import.meta.url), 'utf8')).replace(/\r\n/g, '\n')
  const hash = (text: string) => createHash('sha256').update(text).digest('hex')
  try {
    for (const checksum of [hash(sql), hash(sql.replace(/\n/g, '\r\n'))]) {
      await pool.query('UPDATE schema_migrations SET checksum=$1 WHERE version=$2', [checksum, '001_initial.sql'])
      await migrate(pool)
    }
    await pool.query('UPDATE schema_migrations SET checksum=$1 WHERE version=$2', [hash(sql + '-- changed'), '001_initial.sql'])
    await assert.rejects(migrate(pool), /Applied migration changed/)
  } finally {
    await pool.query('UPDATE schema_migrations SET checksum=$1 WHERE version=$2', [hash(sql), '001_initial.sql'])
  }
})

test('sign-in profile list is public and carries identity labels only', async () => {
  const response = await get('/api/v1/auth/profiles', {})
  assert.equal(response.statusCode, 200, response.body)
  const { profiles } = response.json()
  assert.deepEqual(profiles.find((p: { username: string }) => p.username === 'crew03'),
    { username: 'crew03', name: 'Tripulante fictício 03', role: null, bodyModel: 'female' })
  assert.equal(profiles.find((p: { username: string }) => p.username === 'crew02').bodyModel, 'male')
  for (const profile of profiles) assert.deepEqual(Object.keys(profile).sort(), ['bodyModel', 'name', 'role', 'username'])
})

test('crew summary requires authentication, keeps groups separate and omits research scenarios', async () => {
  assert.equal((await get('/api/v1/crew', {})).statusCode, 401)
  const id = 'crew-nexus-merge-test'
  const original = (await pool.query('SELECT profile FROM crew WHERE id=$1', ['crew-02'])).rows[0].profile
  const profile = { ...original, id, source: 'synthetic-nexus', scenario: 'research-only-answer' }
  await pool.query('INSERT INTO crew(id,username,password_hash,profile) SELECT $1,$2,password_hash,$3 FROM crew WHERE id=$4',
    [id, 'nexus-merge-test', profile, 'crew-02'])
  try {
    const demo = await get('/api/v1/crew')
    assert.equal(demo.statusCode, 200, demo.body)
    assert.deepEqual(demo.json().items.map((item: any) => item.profile.id).sort(), ['crew-02', 'crew-03'])
    assert.equal(demo.json().items.filter((item: any) => item.self).length, 1)
    assert.equal(demo.json().items.find((item: any) => item.self).profile.id, 'crew-02')
    const nexus = await get('/api/v1/crew', await login('nexus-merge-test'))
    assert.equal(nexus.statusCode, 200, nexus.body)
    assert.equal(nexus.json().items.length, 1)
    assert.equal(nexus.json().items[0].profile.id, id)
    assert.equal(nexus.json().items[0].self, true)
    assert.ok(!('scenario' in nexus.json().items[0].profile))
  } finally {
    await pool.query('DELETE FROM sessions WHERE crew_id=$1', [id])
    await pool.query('DELETE FROM person WHERE id=$1', [id])
    await pool.query('DELETE FROM crew WHERE id=$1', [id])
  }
})

test('auth rejects bad credentials, cross-origin writes and missing CSRF; profiles are own only', async () => {
  assert.equal((await get('/api/v1/me', {})).statusCode, 401)
  assert.equal((await post('/api/v1/auth/login', { username: 'crew02', password: 'wrong' }, csrf)).statusCode, 401)
  assert.equal((await post('/api/v1/auth/login', { username: 'absent', password: 'wrong' }, csrf)).statusCode, 401)
  assert.equal((await post('/api/v1/me/checkins', payload, { cookie: a.cookie })).statusCode, 403)
  assert.equal((await post('/api/v1/me/checkins', payload, { ...a, origin: 'https://evil.invalid' })).statusCode, 403)
  assert.equal((await get('/api/v1/me', { ...a, origin: 'https://evil.invalid' })).statusCode, 403)
  assert.equal((await get('/api/v1/me')).json().id, 'crew-02')
  assert.equal((await get('/api/v1/me', { ...a, 'x-health7-crew': 'crew-03' })).statusCode, 401)
  assert.equal((await get('/api/v1/me', { ...a, 'x-health7-crew': 'crew-02' })).statusCode, 200)
  assert.equal((await get('/api/v1/me', b)).json().bodyModel, 'female')
  assert.equal((await get('/api/v1/crew/crew-03/checkins')).statusCode, 404)
})

test('checkins survive restart, handle concurrent retries and separate known crew accounts', async () => {
  const responses = await Promise.all([post('/api/v1/me/checkins', payload), post('/api/v1/me/checkins', payload)])
  assert.deepEqual(responses.map(r => r.statusCode).sort(), [200, 201])
  assert.equal(responses[0].json().id, responses[1].json().id)
  assert.equal((await post('/api/v1/me/checkins', { ...payload, vitals: { sleep: 6 } })).statusCode, 409)
  assert.equal((await get('/api/v1/me/checkins', b)).json().items.length, 0)
  assert.equal((await post('/api/v1/me/checkins', payload, b)).statusCode, 201)
  await app.close()
  app = await createApp({ databaseUrl: scoped.toString(), origins: ['http://tablet.local'] })
  const list = (await get('/api/v1/me/checkins')).json()
  assert.equal(list.items.length, 1); assert.equal(list.items[0].vitals.sleep, 0)
})

test('rejects impossible dates, reversed intervals, oversized limits and invalid checkins', async () => {
  for (const invalid of [
    { ...payload, at: '2026-02-30T00:00:00Z' }, { ...payload, at: '2026-11-14T23:59:60Z' },
    { ...payload, at: 'yesterday' }, { ...payload, vitals: {}, behavioral: {} },
    { ...payload, vitals: { bloodPressure: 110 } }, { ...payload, behavioral: { mood: 6 } },
    { ...payload, source: 'live' }, { ...payload, crewId: 'crew-03' },
  ]) assert.equal((await post('/api/v1/me/checkins', invalid)).statusCode, 400)
  for (const path of ['/api/v1/me/checkins?limit=1000', '/api/v1/me/context?from=2026-02-30T00:00:00Z',
    '/api/v1/me/checkins?from=2026-11-15T00:00:00Z&to=2026-11-14T00:00:00Z'])
    assert.equal((await get(path)).statusCode, 400)
})

test('symptoms keep authored append-only start, evolution and resolution with scoped identifiers', async () => {
  const input = { clientId: 'symptom-1', at, label: 'Dor leve', bodyPart: 'head', severity: 2, note: 'Relato fictício' }
  const start = await post('/api/v1/me/symptoms', input)
  assert.equal(start.statusCode, 201, start.body)
  const id = start.json().id
  assert.equal((await post('/api/v1/me/symptoms', input)).json().id, id)
  assert.equal((await post('/api/v1/me/symptoms', { ...input, severity: 3 })).statusCode, 409)
  const event = { clientId: 'event-1', at: '2026-11-14T15:00:00Z', type: 'evolution', severity: 1 }
  assert.equal((await post(`/api/v1/me/symptoms/${id}/events`, event, b)).statusCode, 404)
  assert.equal((await post('/api/v1/me/symptoms/not-a-uuid/events', event)).statusCode, 400)
  assert.equal((await post(`/api/v1/me/symptoms/${id}/events`, { ...event, at: '2026-11-13T15:00:00Z' })).statusCode, 400)
  assert.equal((await post(`/api/v1/me/symptoms/${id}/events`, event)).statusCode, 201)
  assert.equal((await post(`/api/v1/me/symptoms/${id}/events`, event)).statusCode, 200)
  assert.equal((await get('/api/v1/me/symptoms')).json().items[0].status, 'active')
  assert.equal((await post(`/api/v1/me/symptoms/${id}/events`, { clientId: 'event-2', at: '2026-11-14T16:00:00Z', type: 'resolution' })).statusCode, 201)
  const symptom = (await get('/api/v1/me/symptoms')).json().items[0]
  assert.equal(symptom.status, 'resolved'); assert.equal(symptom.events.length, 3)
  assert.equal(symptom.events[0].authorCrewId, 'crew-02')
  assert.equal((await get('/api/v1/me/symptoms', b)).json().items.length, 0)
})

test('context scopes records and persisted deterministic analyses keep trustworthy provenance', async () => {
  const context = (await get('/api/v1/me/context?from=2026-11-14T00:00:00Z&to=2026-11-15T00:00:00Z')).json()
  assert.equal(context.profile.id, 'crew-02'); assert.equal(context.checkins.length, 1)
  assert.ok(context.sources.length >= 4)
  assert.ok(context.sources.every((source: any) => source.crewId === 'crew-02'))
  const result = await post('/api/v1/me/analyses', { from: '2026-11-14T00:00:00Z', to: '2026-11-15T00:00:00Z', method: 'deterministic' })
  assert.equal(result.statusCode, 201, result.body)
  const analysis = result.json()
  assert.equal(analysis.isAi, false); assert.equal(analysis.methodVersion, 'health7-summary-v1')
  assert.match(analysis.summary, /não utiliza IA/)
  assert.deepEqual(analysis.sources, context.sources)
  assert.equal((await get('/api/v1/me/analyses')).json().items[0].id, analysis.id)
  assert.equal((await get('/api/v1/me/analyses', b)).json().items.length, 0)
})

test('optional AI HTTP adapter sends only own bounded context and ignores provider source claims', async () => {
  let transmitted: any
  const stub = createServer((req, res) => {
    let body = ''; req.on('data', chunk => body += chunk); req.on('end', () => {
      transmitted = JSON.parse(body)
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ summary: 'Organize os relatos para a equipe de saúde.', sources: [{ id: 'fabricated' }] }))
    })
  })
  await new Promise<void>(resolve => stub.listen(0, '127.0.0.1', resolve))
  const port = (stub.address() as any).port
  const aiApp = await createApp({ databaseUrl: scoped.toString(), aiProvider: { url: `http://127.0.0.1:${port}`, name: 'local-test', modelVersion: 'fixture-v1', timeoutMs: 500 } })
  try {
    const result = await aiApp.inject({ method: 'POST', url: '/api/v1/me/analyses', headers: a,
      payload: { from: '2026-11-14T00:00:00Z', to: '2026-11-15T00:00:00Z', method: 'ai' } })
    assert.equal(result.statusCode, 201, result.body)
    assert.equal(result.json().isAi, true); assert.equal(result.json().provider.modelVersion, 'fixture-v1')
    assert.ok(result.json().sources.every((source: any) => source.id !== 'fabricated' && source.crewId === 'crew-02'))
    assert.equal(transmitted.context.checkins.length, 1)
    assert.equal(transmitted.context.profile.id, 'crew-02')
    assert.equal(JSON.stringify(transmitted).includes('password'), false)
  } finally { await aiApp.close(); await new Promise<void>(resolve => stub.close(() => resolve())) }
})

test('AI failure modes reject timeouts, oversized responses and diagnostic claims without persisting them', async () => {
  const before = Number((await pool.query('SELECT count(*) FROM analyses')).rows[0].count)
  const stub = createServer((req, res) => {
    req.resume()
    if (req.url === '/timeout') return
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ summary: req.url === '/large' ? 'x'.repeat(17000) : 'Diagnosis: the patient will develop disease.' }))
  })
  await new Promise<void>(resolve => stub.listen(0, '127.0.0.1', resolve))
  const port = (stub.address() as any).port
  try {
    for (const path of ['/timeout', '/large', '/diagnosis']) {
      const aiApp = await createApp({ databaseUrl: scoped.toString(), aiProvider: { url: `http://127.0.0.1:${port}${path}`, name: 'local-test', modelVersion: 'fixture-v1', timeoutMs: 100 } })
      try {
        const response = await aiApp.inject({ method: 'POST', url: '/api/v1/me/analyses', headers: a,
          payload: { from: '2026-11-14T00:00:00Z', to: '2026-11-15T00:00:00Z', method: 'ai' } })
        assert.equal(response.statusCode, 502, path + ': ' + response.body)
      } finally { await aiApp.close() }
    }
    assert.equal(Number((await pool.query('SELECT count(*) FROM analyses')).rows[0].count), before)
    assert.equal((await post('/api/v1/me/analyses', { from: '2026-11-14T00:00:00Z', to: '2026-11-15T00:00:00Z', method: 'ai' })).statusCode, 503)
  } finally { stub.closeAllConnections(); await new Promise<void>(resolve => stub.close(() => resolve())) }
})

test('historical windows retain prior active symptoms and exclude episodes resolved before the window', async () => {
  const prior = { clientId: 'prior-active', at: '2026-10-01T00:00:00Z', onsetAt: '2026-09-30T00:00:00Z', label: 'Relato anterior', bodyPart: 'back', severity: 1 }
  const active = await post('/api/v1/me/symptoms', prior)
  assert.equal(active.statusCode, 201)
  const done = await post('/api/v1/me/symptoms', { ...prior, clientId: 'prior-resolved' })
  assert.equal((await post(`/api/v1/me/symptoms/${done.json().id}/events`, { clientId: 'prior-resolve', at: '2026-10-02T00:00:00Z', type: 'resolution' })).statusCode, 201)
  const context = (await get('/api/v1/me/context?from=2026-11-14T00:00:00Z&to=2026-11-15T00:00:00Z')).json()
  assert.equal(context.symptoms.some((item: any) => item.id === active.json().id), true)
  assert.equal(context.symptoms.some((item: any) => item.id === done.json().id), false)
  assert.equal(context.symptoms.find((item: any) => item.id === active.json().id).status, 'active')
  const limited = (await get('/api/v1/me/context?from=2026-11-14T00:00:00Z&to=2026-11-15T00:00:00Z&limit=1')).json()
  assert.equal(limited.truncated.symptoms, true)
})

test('database protects event history and stores only hashed opaque sessions', async () => {
  const sessionRows = (await pool.query('SELECT token_hash FROM sessions')).rows
  assert.ok(sessionRows.every(row => row.token_hash !== a.cookie.split('=')[1]))
  await assert.rejects(pool.query("UPDATE symptom_events SET type='resolution' WHERE crew_id='crew-02'"), /append-only/)
})

test('logout revokes the cookie and expired sessions are rejected', async () => {
  const headers = await login()
  assert.equal((await post('/api/v1/auth/logout', {}, headers)).statusCode, 204)
  assert.equal((await get('/api/v1/me', headers)).statusCode, 401)
  const expired = await login()
  await pool.query("UPDATE sessions SET expires_at = now() - interval '1 second' WHERE crew_id = 'crew-02'")
  assert.equal((await get('/api/v1/me', expired)).statusCode, 401)
})
