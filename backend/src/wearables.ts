import { createHash, randomUUID } from 'node:crypto'
import type pg from 'pg'
import type { FastifyInstance, FastifyRequest } from 'fastify'
import { canonical, strictDate } from './contracts.js'

export const wearableMetrics = {
  heartRate: { unit: 'bpm', min: 1, max: 350 },
  restingHeartRate: { unit: 'bpm', min: 1, max: 350 },
  spo2: { unit: '%', min: 0, max: 100 },
  respiratoryRate: { unit: 'breaths/min', min: 1, max: 150 },
  bodyMass: { unit: 'kg', min: 1, max: 500 },
  sleepDuration: { unit: 'h', min: 0, max: 24 },
  skinTemperature: { unit: 'degC', min: -20, max: 60 },
  photopicLight: { unit: 'lux', min: 0, max: 200000 },
  melanopicLight: { unit: 'melanopic-lux', min: 0, max: 200000 },
  stepCount: { unit: 'count', min: 0, max: 1000000 },
  walkingRunningDistance: { unit: 'm', min: 0, max: 10000000 },
  walkingSpeed: { unit: 'm/s', min: 0, max: 100 },
  activeEnergy: { unit: 'kcal', min: 0, max: 100000 },
  basalEnergy: { unit: 'kcal', min: 0, max: 100000 },
} as const
type Source = 'apple' | 'samsung' | 'garmin' | 'actlumus'
interface Sample { device: string; metric: keyof typeof wearableMetrics; value: number; unit: string; at: string; endAt?: string }
interface ImportInput { clientId: string; version: 1; source: Source; format: 'health7-json-v1' | 'health7-csv-v1' | 'apple-health-xml'; quality: 'unverified' | 'example'; samples: Sample[] }
const date = { type: 'string', format: 'date-time', maxLength: 40 }
export const wearableSchema = {
  type: 'object', additionalProperties: false,
  required: ['clientId', 'version', 'source', 'format', 'quality', 'samples'],
  properties: {
    clientId: { type: 'string', pattern: '^[A-Za-z0-9_-]{1,128}$' }, version: { const: 1 },
    source: { enum: ['apple', 'samsung', 'garmin', 'actlumus'] },
    format: { enum: ['health7-json-v1', 'health7-csv-v1', 'apple-health-xml'] },
    quality: { enum: ['unverified', 'example'] },
    samples: { type: 'array', minItems: 1, maxItems: 500, items: {
      type: 'object', additionalProperties: false, required: ['device', 'metric', 'value', 'unit', 'at'],
      properties: { device: { type: 'string', minLength: 1, maxLength: 160, pattern: '\\S' },
        metric: { enum: Object.keys(wearableMetrics) }, value: { type: 'number' },
        unit: { type: 'string', maxLength: 32 }, at: date, endAt: date },
    } },
  },
}
const fail = (statusCode: number, message: string): never => { throw Object.assign(new Error(message), { statusCode }) }
const hash = (input: unknown) => createHash('sha256').update(canonical(input)).digest('hex')
function normalize(input: ImportInput) {
  if (input.format === 'apple-health-xml' && input.source !== 'apple') fail(400, 'Apple XML requires Apple source')
  const samples = input.samples.map((s, index) => {
    const metric = wearableMetrics[s.metric]
    if (s.unit !== metric.unit || !Number.isFinite(s.value) || s.value < metric.min || s.value > metric.max)
      fail(400, `Sample ${index + 1}: invalid unit or value for ${s.metric}`)
    if (input.source === 'actlumus' && !['skinTemperature', 'photopicLight', 'melanopicLight'].includes(s.metric))
      fail(400, 'ActLumus adapter accepts only skin temperature and declared light channels')
    if (input.source !== 'actlumus' && ['photopicLight', 'melanopicLight'].includes(s.metric))
      fail(400, 'Light channels require the ActLumus adapter')
    let at: string, endAt: string | undefined
    try { at = strictDate(s.at); endAt = s.endAt ? strictDate(s.endAt) : undefined }
    catch { return fail(400, `Sample ${index + 1}: invalid timestamp`) }
    if (endAt && (endAt < at || Date.parse(endAt) - Date.parse(at) > 86400000)) fail(400, 'Sample interval must be ordered and at most 24 hours')
    if (s.metric === 'sleepDuration' && (!endAt || Math.abs((Date.parse(endAt) - Date.parse(at)) / 3600000 - s.value) > 0.000001))
      fail(400, 'Sleep duration requires an exact start/end interval; upload non-overlapping asleep intervals')
    return { ...s, device: s.device.trim(), at, ...(endAt ? { endAt } : {}) }
  })
  return { ...input, samples }
}

export function registerWearableRoutes(api: FastifyInstance, db: pg.Pool, crew: (request: FastifyRequest) => string) {
  api.post<{ Body: ImportInput }>('/me/wearables/imports', {
    bodyLimit: 262144, schema: { body: wearableSchema }, config: { rateLimit: { max: 120, timeWindow: '1 minute', keyGenerator: (request: FastifyRequest) => crew(request) } },
  }, async (request, reply) => {
    const owner = crew(request), input = normalize(request.body)
    const digest = hash(input), client = await db.connect()
    try {
      await client.query('BEGIN')
      // Serialize retries and overlapping batches for one account, across API instances.
      await client.query("SELECT pg_advisory_xact_lock(hashtextextended($1,0))", ['health7-wearables:' + owner])
      const previous = await client.query('SELECT * FROM wearable_imports WHERE crew_id=$1 AND client_id=$2', [owner, input.clientId])
      if (previous.rowCount) {
        if (previous.rows[0].digest !== digest) fail(409, 'Import identifier already used with different content')
        await client.query('COMMIT')
        return importOutput(previous.rows[0])
      }
      const id = randomUUID()
      await client.query('INSERT INTO wearable_imports(id,crew_id,client_id,digest,source,format,quality,sample_count,added,duplicates) VALUES($1,$2,$3,$4,$5,$6,$7,$8,0,0)',
        [id, owner, input.clientId, digest, input.source, input.format, input.quality, input.samples.length])
      let added = 0
      for (const s of input.samples) {
        const sampleKey = hash([input.source, input.quality, s.device, s.metric, s.at, s.endAt ?? null])
        const payload = { ...s, source: input.source, quality: input.quality, verification: 'user-declared', assessment: 'not-evaluated' }
        const old = await client.query('SELECT payload FROM wearable_samples WHERE crew_id=$1 AND sample_key=$2', [owner, sampleKey])
        if (old.rowCount) {
          if (canonical(old.rows[0].payload) !== canonical(payload)) fail(409, 'Existing observation has different content; batch was not saved')
        } else {
          await client.query('INSERT INTO wearable_samples(id,crew_id,import_id,sample_key,at,payload) VALUES($1,$2,$3,$4,$5,$6)', [randomUUID(), owner, id, sampleKey, s.at, payload])
          added++
        }
      }
      const saved = await client.query('UPDATE wearable_imports SET added=$2,duplicates=$3 WHERE id=$1 RETURNING *', [id, added, input.samples.length - added])
      await client.query('COMMIT'); reply.code(201)
      return importOutput(saved.rows[0])
    } catch (error) { await client.query('ROLLBACK'); throw error }
    finally { client.release() }
  })
  api.get('/me/wearables', async request => {
    const owner = crew(request)
    // One SQL snapshot keeps count and rows consistent during concurrent imports.
    const result = await db.query(`SELECT (SELECT count(*)::int FROM wearable_samples WHERE crew_id=$1) AS total,
      coalesce((SELECT jsonb_agg(t ORDER BY t.at DESC,t.id DESC) FROM
      (SELECT id,import_id AS "importId",at,payload,received_at AS "receivedAt" FROM wearable_samples WHERE crew_id=$1 ORDER BY at DESC,id DESC LIMIT 100) t),'[]'::jsonb) AS items`, [owner])
    const { total, items } = result.rows[0]
    return { crewId: owner, total, truncated: total > items.length, items: items.map((r: any) => ({ ...r.payload, id: r.id, importId: r.importId, receivedAt: r.receivedAt })) }
  })
}
function importOutput(row: any) {
  return { id: row.id, crewId: row.crew_id, clientId: row.client_id, source: row.source, format: row.format, quality: row.quality,
    count: row.sample_count, added: row.added, duplicates: row.duplicates, receivedAt: new Date(row.received_at).toISOString() }
}
