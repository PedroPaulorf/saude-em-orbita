import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import { createApp } from '../src/app.js'
import { RULE_VERSION, rules, references } from '../src/medical.js'
import { simulate } from '../src/simulation.js'
import { deliver, type OutboxEntry } from '../../frontend/src/lib/sync-core.js'

const headers = { 'x-api-key': 'test-medical' }
const url = '/api/v1/crew/crew-02/checkins'
const payload = { clientId: 'medical-1', at: '2026-11-14T12:00:00Z', source: 'simulated',
  vitals: { sleep: 5.1, spo2: 96, respiratoryRate: 16, bodyMass: 73.3 }, behavioral: {},
  provenance: { sleep: { method: 'manual', quality: 'simulated' } } }

test('persists provenance, immutable assessment snapshots and research registry across restart', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'health7-medical-')), databasePath = join(dir, 'data.sqlite')
  let app = createApp({ databasePath, apiKey: 'test-medical' })
  try {
    const response = await app.inject({ method: 'POST', url, headers, payload })
    assert.equal(response.statusCode, 201)
    const saved = response.json()
    const sleep = saved.observations.find((o: { metric: string }) => o.metric === 'sleep')
    assert.equal(sleep.method, 'manual'); assert.equal(sleep.quality, 'simulated')
    assert.equal(sleep.ruleVersion, RULE_VERSION); assert.equal(sleep.status, 'flagged'); assert.equal(sleep.unit, 'h')
    assert.equal(sleep.clinicalSource, null)
    assert.equal(saved.observations.length, 4)
    assert.equal((await app.inject({ url: '/api/v1/references', headers })).json().items.length, 4)
    assert.equal((await app.inject({ url: '/api/v1/rules', headers })).json().items[0].clinicalSource, null)
    assert.equal((await app.inject('/api/v1/references')).statusCode, 401)
    await app.close()
    // Changing a person's baseline cannot rewrite an already stored assessment.
    const db = new DatabaseSync(databasePath)
    const profile = JSON.parse(db.prepare('SELECT profile FROM crew WHERE id = ?').get('crew-02')!.profile as string)
    profile.baseline.sleep = 5.1
    db.prepare('UPDATE crew SET profile = ? WHERE id = ?').run(JSON.stringify(profile), 'crew-02')
    db.close()
    app = createApp({ databasePath, apiKey: 'test-medical' })
    const repeated = await app.inject({ method: 'POST', url, headers, payload })
    assert.equal(repeated.statusCode, 200)
    assert.deepEqual(repeated.json().observations, saved.observations)
    assert.deepEqual((await app.inject({ url, headers })).json().items[0].observations, saved.observations)
    assert.equal((await app.inject({ method: 'POST', url, headers, payload: { ...payload, provenance: { sleep: { method: 'manual', quality: 'clinical' } } } })).statusCode, 400)
    assert.equal((await app.inject({ method: 'POST', url, headers, payload: { ...payload, clientId: 'bad-meta', provenance: { heartRate: { method: 'manual', quality: 'simulated' } } } })).statusCode, 400)
  } finally { await app.close(); rmSync(dir, { recursive: true, force: true }) }
})

test('upgrades a legacy database without fabricating collection provenance or losing records', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'health7-legacy-')), databasePath = join(dir, 'data.sqlite')
  const db = new DatabaseSync(databasePath)
  db.exec('CREATE TABLE crew (id TEXT PRIMARY KEY, profile TEXT NOT NULL); CREATE TABLE checkins (id TEXT PRIMARY KEY, crew_id TEXT NOT NULL REFERENCES crew(id), client_id TEXT NOT NULL, at TEXT NOT NULL, received_at TEXT NOT NULL, payload TEXT NOT NULL, UNIQUE(crew_id, client_id));')
  db.prepare('INSERT INTO crew VALUES (?, ?)').run('crew-02', JSON.stringify({ baseline: { sleep: 7.2 } }))
  db.prepare('INSERT INTO checkins VALUES (?, ?, ?, ?, ?, ?)').run('old', 'crew-02', payload.clientId, payload.at, payload.at, JSON.stringify({ ...payload, provenance: undefined }))
  db.close()
  const app = createApp({ databasePath, apiKey: 'test-medical' })
  try {
    const list = (await app.inject({ url, headers })).json().items
    assert.equal(list.length, 1); assert.equal(list[0].id, 'old')
    const sleep = list[0].observations.find((o: { metric: string }) => o.metric === 'sleep')
    assert.equal(sleep.method, 'unknown'); assert.equal(sleep.quality, 'unknown'); assert.equal(sleep.ingestedFromLegacy, true)
    const oxygen = list[0].observations.find((o: { metric: string }) => o.metric === 'spo2')
    assert.equal(oxygen.status, 'not-evaluated')
  } finally { await app.close(); rmSync(dir, { recursive: true, force: true }) }
})

test('backend rules and bundled references match the frontend demonstration configuration', () => {
  const simulated = JSON.parse(readFileSync(new URL('../../frontend/src/data/simulated.json', import.meta.url), 'utf8'))
  for (const vital of simulated.vitals) assert.deepEqual(rules[vital.id], { unit: vital.unit, baseline: vital.baseline, ...vital.rule })
  const bundled = JSON.parse(readFileSync(new URL('../../frontend/src/data/medical-references.json', import.meta.url), 'utf8'))
  assert.deepEqual(bundled.map((r: { id: string }) => r.id), references.map((r) => r.id))
})

const scenario = { seed: 42, trials: 2000, crewSize: 4, days: 180, availableResources: 2,
  conditions: [{ id: 'hypothetical', ratePerPersonDay: 0.001, resourcesPerEvent: 1 }] }
test('mission simulator is reproducible, handles zero incidence and approximates the known Poisson mean', () => {
  const result = simulate(scenario)
  assert.deepEqual(result, simulate(scenario))
  assert.ok(Math.abs(result.events.mean - 0.72) < 0.08)
  assert.ok(result.resourceShortfallFraction >= 0 && result.resourceShortfallFraction <= 1)
  const zero = simulate({ ...scenario, conditions: [{ ...scenario.conditions[0], ratePerPersonDay: 0 }] })
  assert.equal(zero.events.mean, 0); assert.equal(zero.resources.mean, 0); assert.equal(zero.resourceShortfallFraction, 0)
})

test('simulation API retains scenarios and rejects oversized or ambiguous requests', async () => {
  const app = createApp({ databasePath: ':memory:', apiKey: 'test-medical' })
  try {
    const created = await app.inject({ method: 'POST', url: '/api/v1/simulations', headers, payload: scenario })
    assert.equal(created.statusCode, 201)
    const saved = created.json()
    assert.deepEqual((await app.inject({ url: `/api/v1/simulations/${saved.id}`, headers })).json(), saved)
    for (const invalid of [{ ...scenario, trials: 100000 }, { ...scenario, days: -1 }, { ...scenario, conditions: [scenario.conditions[0], scenario.conditions[0]] }])
      assert.equal((await app.inject({ method: 'POST', url: '/api/v1/simulations', headers, payload: invalid })).statusCode, 400)
  } finally { await app.close() }
})

test('offline queue retains identical payload after lost response and server deduplicates the retry', async () => {
  const app = createApp({ databasePath: ':memory:', apiKey: 'test-medical' })
  const entry: OutboxEntry = { state: 'pending', payload: { ...payload, source: 'simulated', provenance: { sleep: { method: 'manual', quality: 'simulated' } } } }
  try {
    const pending = await deliver(entry, async (body) => {
      assert.equal((await app.inject({ method: 'POST', url, headers, payload: body })).statusCode, 201)
      throw new Error('Response lost')
    })
    assert.equal(pending.state, 'pending')
    const reloaded = JSON.parse(JSON.stringify(pending)) as OutboxEntry
    assert.deepEqual(reloaded.payload, entry.payload)
    const synced = await deliver(reloaded, async (body) => {
      const response = await app.inject({ method: 'POST', url, headers, payload: body })
      assert.equal(response.statusCode, 200)
      return new Response(response.body, { status: response.statusCode })
    })
    assert.equal(synced.state, 'synced'); assert.ok(synced.observations?.length)
    assert.equal((await app.inject({ url, headers })).json().items.length, 1)
    assert.equal((await deliver(entry, async () => new Response('{}', { status: 409 }))).state, 'conflict')
    assert.equal((await deliver(entry, async () => new Response('{}', { status: 401 }))).state, 'rejected')
    assert.equal((await deliver(entry, async () => new Response('{}', { status: 503 }))).state, 'pending')
    assert.equal((await deliver(entry, async () => new Response('{}', { status: 200 }))).state, 'pending')
  } finally { await app.close() }
})
