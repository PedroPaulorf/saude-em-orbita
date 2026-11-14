import { after, before, test } from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import pg from 'pg'
import { createApp } from '../src/app.js'
import { createDemoUser } from '../src/users.js'
import { importNexus } from '../src/import-nexus.js'

const databaseUrl = process.env.TEST_DATABASE_URL
if (!databaseUrl) throw new Error('TEST_DATABASE_URL must point to a real PostgreSQL test database; tests do not skip')
const schema = 'health7_nexus_' + randomUUID().replaceAll('-', '')
const admin = new pg.Pool({ connectionString: databaseUrl })
const scoped = new URL(databaseUrl)
scoped.searchParams.set('options', '-c search_path=' + schema)
const pool = new pg.Pool({ connectionString: scoped.toString() })
const password = 'nexus-test-only-password'
const now = new Date('2026-11-14T15:00:00Z')
const window = '?from=2026-10-01T00:00:00Z&to=2026-11-15T00:00:00Z&limit=100'
let app: Awaited<ReturnType<typeof createApp>>

async function login(username: string) {
  const response = await app.inject({ method: 'POST', url: '/api/v1/auth/login', headers: { 'x-requested-with': 'Health7' }, payload: { username, password } })
  assert.equal(response.statusCode, 200, response.body)
  return { cookie: String(response.headers['set-cookie']).split(';')[0] }
}
const get = async (url: string, headers: Record<string, string>) => (await app.inject({ url: '/api/v1' + url + window, headers })).json()
const counts = async () => (await pool.query(`SELECT (SELECT count(*) FROM checkins)::int checkins, (SELECT count(*) FROM symptoms)::int symptoms,
  (SELECT count(*) FROM symptom_events)::int events, (SELECT count(*) FROM environment)::int environment,
  (SELECT count(*) FROM medical_observations)::int observations, (SELECT count(*) FROM sessions)::int sessions`)).rows[0]

before(async () => {
  await admin.query('CREATE SCHEMA ' + schema)
  await importNexus({ databaseUrl: scoped.toString(), password, now, only: ['NX-04', 'NX-06'] })
  app = await createApp({ databaseUrl: scoped.toString() })
})
after(async () => { await app?.close(); await pool.end(); await admin.query('DROP SCHEMA IF EXISTS ' + schema + ' CASCADE'); await admin.end() })

test('nx04 signs in and sees mission days 1 to 19, ending today, with device provenance and daily counts', async () => {
  const headers = await login('nx04')
  const me = await get('/me', headers)
  assert.equal(me.missionDay, 19); assert.equal(me.source, 'synthetic-nexus'); assert.equal(me.bodyModel, 'male')
  assert.equal(me.baseline.heartRate, 60); assert.equal(me.baseline.urinations24h, 6)
  const checkins = (await get('/me/checkins', headers)).items
  assert.equal(checkins.length, 19)
  assert.deepEqual(checkins.map((c: any) => c.clientId).sort(), Array.from({ length: 19 }, (_, i) => `nexus-NX-04-d${i + 1}`).sort())
  assert.equal(checkins[0].at, '2026-11-14T06:00:00.000Z')
  assert.equal(checkins.at(-1).at, '2026-10-27T06:00:00.000Z')
  const today = checkins[0]
  assert.equal(today.vitals.heartRate, 68); assert.equal(today.healthDetails.urinations24h, 3)
  assert.ok(today.observations.every((o: any) => o.method === 'simulated-device' && o.quality === 'simulated'))
  const health = (await get('/me/health', headers)).items
  assert.equal(health[0].healthDetails.urinations24h, 3)
  const environment = (await get('/me/environment', headers)).items
  assert.equal(environment.length, 19); assert.ok(environment[0].radiationDoseMgyDay > 0); assert.ok(environment[0].co2Ppm > 0)
  const symptoms = (await get('/me/symptoms', headers)).items
  assert.deepEqual(symptoms.map((s: any) => s.label), ['thirst'])
  assert.equal(symptoms[0].status, 'active'); assert.equal(symptoms[0].events.length, 4)
  const person = await get('/me/person', headers)
  assert.equal(person.weightKg, 79.4); assert.equal(person.sex, 'male')
})

test('nx06 day 14 keeps the dataset red flag on the check-up; episodes start, evolve and resolve', async () => {
  const headers = await login('nx06')
  const checkins = (await get('/me/checkins', headers)).items
  assert.equal(checkins.length, 14)
  assert.equal(checkins.find((c: any) => c.clientId === 'nexus-NX-06-d14').healthDetails.redFlag, true)
  assert.ok(checkins.filter((c: any) => c.clientId !== 'nexus-NX-06-d14').every((c: any) => !c.healthDetails.redFlag))
  const symptoms = (await get('/me/symptoms', headers)).items
  const sore = symptoms.find((s: any) => s.label === 'sore-throat')
  assert.equal(sore.status, 'resolved'); assert.equal(sore.bodyPart, 'general')
  assert.equal(symptoms.find((s: any) => s.label === 'cough').bodyPart, 'chest')
})

test('running the import again duplicates nothing and leaves no import session behind', async () => {
  // Sessions are compared too: the import's own short session is removed afterwards.
  const first = await counts()
  await importNexus({ databaseUrl: scoped.toString(), password, now: new Date('2026-11-16T10:00:00Z'), only: ['NX-04', 'NX-06'] })
  assert.deepEqual(await counts(), first)
  const references = (await pool.query("SELECT document FROM medical_references WHERE document->>'role'='data-anchor'")).rows
  assert.equal(references.length, 12); assert.ok(references.every(r => r.document.clinicalThresholdEvidence === false))
})

test('changing today requires --reset, which moves the anchor and replaces only that account', async () => {
  await assert.rejects(importNexus({ databaseUrl: scoped.toString(), now, only: ['NX-04'], todayDay: { 'NX-04': 21 } }), /--reset/)
  const before = (await pool.query("SELECT count(*)::int n FROM checkins WHERE crew_id='crew-nx06'")).rows[0].n
  await importNexus({ databaseUrl: scoped.toString(), now: new Date('2026-11-15T09:00:00Z'), only: ['NX-04'], todayDay: { 'NX-04': 21 }, reset: true })
  const headers = await login('nx04')
  const checkins = (await app.inject({ url: '/api/v1/me/checkins?from=2026-10-01T00:00:00Z&to=2026-11-16T00:00:00Z&limit=100', headers })).json().items
  assert.equal(checkins.length, 21); assert.equal(checkins[0].at, '2026-11-15T06:00:00.000Z')
  assert.equal((await pool.query("SELECT count(*)::int n FROM checkins WHERE crew_id='crew-nx06'")).rows[0].n, before)
  await assert.rejects(pool.query("DELETE FROM symptom_events WHERE crew_id='crew-nx06'"), /append-only/)
})

test('an account with the same username that is not a NEXUS synthetic account is never touched', async () => {
  await createDemoUser(pool, 'nx01', 'another-password')
  await assert.rejects(importNexus({ databaseUrl: scoped.toString(), password, now, only: ['NX-01'], reset: true }), /not a NEXUS synthetic account/)
  assert.equal((await pool.query("SELECT count(*)::int n FROM checkins c JOIN crew u ON u.id=c.crew_id WHERE u.username='nx01'")).rows[0].n, 0)
})
