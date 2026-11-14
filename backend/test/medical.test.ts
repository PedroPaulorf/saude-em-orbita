import { before, after, test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { randomUUID } from 'node:crypto'
import pg from 'pg'
import { createApp } from '../src/app.js'
import { openDatabase, migrate } from '../src/database.js'
import { seedDemo } from '../src/seed.js'
import { RULE_VERSION, rules, references } from '../src/medical.js'
import { simulate } from '../src/simulation.js'

const databaseUrl = process.env.TEST_DATABASE_URL
if (!databaseUrl) throw new Error('TEST_DATABASE_URL must point to a real PostgreSQL test database')
const schema = 'health7_medical_' + randomUUID().replaceAll('-', '')
const admin = new pg.Pool({ connectionString: databaseUrl })
const scoped = new URL(databaseUrl)
scoped.searchParams.set('options', '-c search_path=' + schema)
const db = openDatabase(scoped.toString())
const password = 'test-medical-password-29'
let app: Awaited<ReturnType<typeof createApp>>, a: Record<string, string>, b: Record<string, string>
const url = '/api/v1/me/checkins'
const payload = { clientId: 'medical-1', at: '2026-11-14T12:00:00Z', source: 'simulated',
  vitals: { sleep: 5.1, spo2: 96 }, behavioral: {}, provenance: { sleep: { method: 'manual', quality: 'simulated' } } }
const window = '?from=2026-11-14T00:00:00Z&to=2026-11-15T00:00:00Z'
async function login(username: string) {
  const response = await app.inject({ method: 'POST', url: '/api/v1/auth/login', headers: { 'x-requested-with': 'Health7' }, payload: { username, password } })
  assert.equal(response.statusCode, 200, response.body)
  return { cookie: String(response.headers['set-cookie']).split(';')[0], 'x-requested-with': 'Health7' }
}
const post = (path: string, body: any, headers = a) => app.inject({ method: 'POST', url: path, headers, payload: body })
before(async () => {
  await admin.query('CREATE SCHEMA ' + schema)
  await migrate(db); await seedDemo(db, password)
  // An existing check-up has no collection metadata; never fabricate it on upgrade.
  await db.query('INSERT INTO checkins(id,crew_id,client_id,at,payload) VALUES($1,$2,$3,$4,$5)', [randomUUID(), 'crew-02', 'legacy', payload.at, { ...payload, clientId: 'legacy', provenance: undefined }])
  app = await createApp({ databaseUrl: scoped.toString() })
  a = await login('crew02'); b = await login('crew03')
})
after(async () => { await app?.close(); await db.end(); await admin.query('DROP SCHEMA IF EXISTS ' + schema + ' CASCADE'); await admin.end() })

test('research registry requires authentication and upgrade preserves legacy data with explicit unknown provenance', async () => {
  assert.equal((await app.inject('/api/v1/references')).statusCode, 401)
  const registered = (await app.inject({ url: '/api/v1/references', headers: a })).json().items
  assert.equal(registered.length, 4); assert.ok(registered.every((r: any) => r.clinicalThresholdEvidence === false))
  assert.equal((await app.inject({ url: '/api/v1/rules', headers: a })).json().items[0].clinicalSource, null)
  const legacy = (await app.inject({ url: url + window, headers: a })).json().items.find((c: any) => c.clientId === 'legacy')
  const sleep = legacy.observations.find((o: any) => o.metric === 'sleep')
  assert.equal(sleep.method, 'unknown'); assert.equal(sleep.quality, 'unknown'); assert.equal(sleep.retrospective, true)
  const oxygen = legacy.observations.find((o: any) => o.metric === 'spo2')
  assert.equal(oxygen.status, 'not-evaluated'); assert.equal(oxygen.baseline, null)
  assert.equal(legacy.provenance, undefined)
})

test('concurrent retries store one immutable assessment and preserve per-person baseline ownership', async () => {
  const responses = await Promise.all([post(url, payload), post(url, payload)])
  assert.deepEqual(responses.map(r => r.statusCode).sort(), [200, 201])
  const created = responses[0].json(), sleep = created.observations.find((o: any) => o.metric === 'sleep')
  assert.equal(sleep.status, 'flagged'); assert.equal(sleep.method, 'manual'); assert.equal(sleep.ruleVersion, RULE_VERSION)
  assert.equal(sleep.baseline, 7.2); assert.equal(sleep.retrospective, false)
  await db.query("UPDATE crew SET profile=jsonb_set(profile,'{baseline,sleep}','5.1'::jsonb) WHERE id='crew-02'")
  await app.close(); app = await createApp({ databaseUrl: scoped.toString() })
  const repeated = await post(url, payload)
  assert.equal(repeated.statusCode, 200); assert.deepEqual(repeated.json().observations, created.observations)
  const next = await post(url, { ...payload, clientId: 'new-baseline' })
  const changed = next.json().observations.find((o: any) => o.metric === 'sleep')
  assert.equal(changed.baseline, 5.1); assert.equal(changed.status, 'baseline'); assert.notEqual(changed.baselineVersion, sleep.baselineVersion)
  assert.equal((await app.inject({ url: url + window, headers: b })).json().items.length, 0)
  assert.equal((await post(url, { ...payload, clientId: 'wrong-owner' }, { ...a, 'x-health7-crew': 'crew-03' })).statusCode, 401)
  assert.equal((await post(url, { ...payload, vitals: { sleep: 6 } })).statusCode, 409)
})

test('validates metadata and rolls back check-up plus domain projections when snapshot persistence fails', async () => {
  for (const provenance of [
    { sleep: { method: 'manual', quality: 'clinical' } },
    { heartRate: { method: 'manual', quality: 'simulated' } },
  ]) assert.equal((await post(url, { ...payload, clientId: 'invalid-meta', provenance })).statusCode, 400)
  await db.query("CREATE FUNCTION reject_test_observation() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'test failure'; END; $$; CREATE TRIGGER test_observation BEFORE INSERT ON medical_observations FOR EACH ROW EXECUTE FUNCTION reject_test_observation();")
  try {
    assert.equal((await post(url, { ...payload, clientId: 'must-rollback' })).statusCode, 500)
    assert.equal((await db.query("SELECT count(*)::int AS n FROM checkins WHERE client_id='must-rollback'")).rows[0].n, 0)
    assert.equal((await db.query("SELECT count(*)::int AS n FROM health WHERE client_id='must-rollback'")).rows[0].n, 0)
  } finally { await db.query('DROP TRIGGER test_observation ON medical_observations; DROP FUNCTION reject_test_observation()') }
})

const scenario = { seed: 42, trials: 2000, crewSize: 4, days: 180, availableResources: 2,
  conditions: [{ id: 'hypothetical', ratePerPersonDay: 0.001, resourcesPerEvent: 1 }] }
test('simulations remain private to the authenticated owner and survive restart', async () => {
  const created = await post('/api/v1/me/simulations', scenario)
  assert.equal(created.statusCode, 201, created.body)
  const saved = created.json()
  assert.equal(saved.crewId, 'crew-02')
  await app.close(); app = await createApp({ databaseUrl: scoped.toString() })
  assert.deepEqual((await app.inject({ url: `/api/v1/me/simulations/${saved.id}`, headers: a })).json(), saved)
  assert.equal((await app.inject({ url: `/api/v1/me/simulations/${saved.id}`, headers: b })).statusCode, 404)
  assert.equal((await app.inject({ url: '/api/v1/me/simulations', headers: b })).json().items.length, 0)
  assert.equal((await app.inject({ url: '/api/v1/me/simulations', headers: a })).json().items[0].id, saved.id)
  assert.equal((await post('/api/v1/me/simulations', scenario, {})).statusCode, 403)
  for (const input of [{ ...scenario, crewId: 'crew-03' }, { ...scenario, trials: 100000 }, { ...scenario, conditions: [scenario.conditions[0], scenario.conditions[0]] }])
    assert.equal((await post('/api/v1/me/simulations', input)).statusCode, 400)
})

test('educational Poisson simulation is reproducible, handles zero incidence and approximates its analytic mean', () => {
  const result = simulate(scenario)
  assert.deepEqual(result, simulate(scenario)); assert.ok(Math.abs(result.events.mean - 0.72) < 0.08)
  assert.ok(result.resourceShortfallFraction >= 0 && result.resourceShortfallFraction <= 1)
  const zero = simulate({ ...scenario, conditions: [{ ...scenario.conditions[0], ratePerPersonDay: 0 }] })
  assert.equal(zero.events.mean, 0); assert.equal(zero.resources.mean, 0)
})

test('research references and demo rules match the frontend without imposing a shared baseline', () => {
  const simulated = JSON.parse(readFileSync(new URL('../../frontend/src/data/simulated.json', import.meta.url), 'utf8'))
  for (const vital of simulated.vitals) assert.deepEqual(rules[vital.id], { unit: vital.unit, ...vital.rule })
  const bundled = JSON.parse(readFileSync(new URL('../../frontend/src/data/medical-references.json', import.meta.url), 'utf8'))
  assert.deepEqual(bundled.map((r: any) => r.id), references.map(r => r.id))
})
