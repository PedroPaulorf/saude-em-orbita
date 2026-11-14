import { randomUUID } from 'node:crypto'
import type { FastifyInstance, FastifyRequest } from 'fastify'
import type pg from 'pg'
import { canonical, strictDate, historySchema } from './contracts.js'

type Row = Record<string, any>
export interface HistoryWindow { from: string; to: string; limit: number }
export type WindowInput = { from?: string; to?: string; limit?: string }
const iso = (value: Date | string | null) => value == null ? null : new Date(value).toISOString()
const fail = (statusCode: number, message: string): never => { throw Object.assign(new Error(message), { statusCode }) }
const defined = (entries: [string, unknown][]) => Object.fromEntries(entries.filter(([, value]) => value != null))
const personOutput = (row: Row) => ({ id: row.id, name: row.name, age: row.age, weightKg: row.weight_kg,
  heightCm: row.height_cm, sex: row.sex, medicalHistory: row.medical_history, source: 'simulated',
  weightMeasuredAt: iso(row.weight_measured_at), weightUpdatedAt: iso(row.weight_updated_at), updatedAt: iso(row.updated_at) })
const healthOutput = (row: Row) => ({ id: row.checkin_id, crewId: row.crew_id, clientId: row.client_id,
  at: iso(row.at), receivedAt: iso(row.received_at), source: row.source,
  vitals: defined([['heartRate', row.heart_rate_bpm], ['spo2', row.oxygen_saturation_percent],
    ['bloodPressure', row.blood_pressure_systolic_mmhg], ['bloodPressureDiastolic', row.blood_pressure_diastolic_mmhg],
    ['temperature', row.body_temperature_c], ['respiratoryRate', row.respiratory_rate_per_min], ['sleep', row.sleep_hours]]),
  healthDetails: defined([['urine', row.urine], ['stool', row.stool], ['urinations24h', row.urinations_24h], ['stools24h', row.stools_24h]]) })
const environmentInput = (row: Row) => ({ clientId: row.client_id, at: iso(row.at), source: row.source,
  ...defined([['radiationDoseMsv', row.radiation_dose_msv], ['altitudeMeters', row.altitude_meters],
    ['temperatureC', row.temperature_c], ['oxygenPercent', row.oxygen_percent],
    ['radiationDoseMgyDay', row.radiation_dose_mgy_day], ['radiationAccumMgy', row.radiation_accum_mgy],
    ['co2Ppm', row.co2_ppm], ['relativeHumidityPct', row.relative_humidity_pct]]) })
const environmentOutput = (row: Row) => ({ ...environmentInput(row), id: row.id, crewId: row.crew_id, receivedAt: iso(row.received_at) })

export async function personFor(db: pg.Pool, crewId: string) {
  const result = await db.query('SELECT * FROM person WHERE id=$1', [crewId])
  if (!result.rowCount) fail(404, 'Person not found')
  return personOutput(result.rows[0])
}
export async function healthFor(db: pg.Pool, crewId: string, window: HistoryWindow) {
  const result = await db.query('SELECT * FROM health WHERE crew_id=$1 AND at >= $2 AND at <= $3 ORDER BY at DESC,checkin_id DESC LIMIT $4',
    [crewId, window.from, window.to, window.limit + 1])
  return { items: result.rows.slice(0, window.limit).map(healthOutput), ...window, truncated: result.rows.length > window.limit }
}
export async function environmentFor(db: pg.Pool, crewId: string, window: HistoryWindow) {
  const result = await db.query('SELECT * FROM environment WHERE crew_id=$1 AND at >= $2 AND at <= $3 ORDER BY at DESC,id DESC LIMIT $4',
    [crewId, window.from, window.to, window.limit + 1])
  return { items: result.rows.slice(0, window.limit).map(environmentOutput), ...window, truncated: result.rows.length > window.limit }
}

interface PersonPatch { name?: string; age?: number | null; weightKg?: number | null; heightCm?: number | null; sex?: string | null; medicalHistory?: string | null }
const nullable = (schema: Row) => ({ anyOf: [schema, { type: 'null' }] })
const personSchema = { type: 'object', additionalProperties: false, minProperties: 1, properties: {
  name: { type: 'string', minLength: 1, maxLength: 120, pattern: '\\S' },
  age: nullable({ type: 'integer', minimum: 0, maximum: 130 }),
  weightKg: nullable({ type: 'number', exclusiveMinimum: 0, maximum: 1000 }),
  heightCm: nullable({ type: 'number', exclusiveMinimum: 0, maximum: 300 }),
  sex: nullable({ type: 'string', enum: ['female', 'male', 'intersex', 'unspecified'] }),
  medicalHistory: nullable({ type: 'string', maxLength: 4000, minLength: 1, pattern: '\\S' }) } }
interface EnvironmentInput { clientId: string; at: string; source: 'simulated'; radiationDoseMsv?: number; altitudeMeters?: number; temperatureC?: number; oxygenPercent?: number
  /** RR-1 cabin context (absorbed dose in mGy, never converted to mSv). */
  radiationDoseMgyDay?: number; radiationAccumMgy?: number; co2Ppm?: number; relativeHumidityPct?: number }
const ENVIRONMENT_VALUES = ['radiationDoseMsv', 'altitudeMeters', 'temperatureC', 'oxygenPercent', 'radiationDoseMgyDay', 'radiationAccumMgy', 'co2Ppm', 'relativeHumidityPct']
const environmentSchema = { type: 'object', additionalProperties: false, required: ['clientId', 'at', 'source'], properties: {
  clientId: { type: 'string', minLength: 1, maxLength: 128, pattern: '^[A-Za-z0-9_-]+$' },
  at: { type: 'string', format: 'date-time', maxLength: 40 }, source: { type: 'string', const: 'simulated' },
  radiationDoseMsv: { type: 'number', minimum: 0, maximum: 1000000 },
  altitudeMeters: { type: 'number', minimum: -500, maximum: 1000000000 },
  temperatureC: { type: 'number', minimum: -273.15, maximum: 1000 },
  oxygenPercent: { type: 'number', minimum: 0, maximum: 100 },
  radiationDoseMgyDay: { type: 'number', minimum: 0, maximum: 1000000 },
  radiationAccumMgy: { type: 'number', minimum: 0, maximum: 1000000 },
  co2Ppm: { type: 'number', minimum: 0, maximum: 1000000 },
  relativeHumidityPct: { type: 'number', minimum: 0, maximum: 100 } },
  anyOf: ENVIRONMENT_VALUES.map(key => ({ required: [key] })) }

/** Register inside the existing authenticated /api/v1 scope; identity never comes from the body. */
export function registerDomainRoutes(api: FastifyInstance, db: pg.Pool, crew: (request: FastifyRequest) => string, windowOf: (input: WindowInput) => HistoryWindow) {
  api.get('/me/person', request => personFor(db, crew(request)))
  api.post<{ Body: PersonPatch }>('/me/person', { schema: { body: personSchema } }, async request => {
    const crewId = crew(request), patch = request.body, client = await db.connect()
    try {
      await client.query('BEGIN')
      const old = (await client.query('SELECT * FROM person WHERE id=$1 FOR UPDATE', [crewId])).rows[0]
      if (!old) fail(404, 'Person not found')
      const field = (name: keyof PersonPatch, column: string) => Object.hasOwn(patch, name) ? patch[name] : old[column]
      const weight = field('weightKg', 'weight_kg')
      const weightUpdatedAt = Object.hasOwn(patch, 'weightKg') ? new Date() : old.weight_updated_at
      const measuredAt = Object.hasOwn(patch, 'weightKg') ? weight == null ? null : weightUpdatedAt : old.weight_measured_at
      const result = await client.query(`UPDATE person SET name=$2,age=$3,weight_kg=$4,height_cm=$5,sex=$6,
        medical_history=$7,weight_measured_at=$8,weight_updated_at=$9,updated_at=now() WHERE id=$1 RETURNING *`,
        [crewId, field('name', 'name'), field('age', 'age'), weight, field('heightCm', 'height_cm'),
          field('sex', 'sex'), field('medicalHistory', 'medical_history'), measuredAt, weightUpdatedAt])
      if (Object.hasOwn(patch, 'name')) await client.query("UPDATE crew SET profile=jsonb_set(profile,'{displayName}',to_jsonb($2::text)) WHERE id=$1", [crewId, patch.name])
      await client.query('COMMIT')
      return personOutput(result.rows[0])
    } catch (error) { await client.query('ROLLBACK'); throw error } finally { client.release() }
  })
  api.get<{ Querystring: WindowInput }>('/me/health', { schema: { querystring: historySchema } }, request => healthFor(db, crew(request), windowOf(request.query)))
  api.get<{ Querystring: WindowInput }>('/me/environment', { schema: { querystring: historySchema } }, request => environmentFor(db, crew(request), windowOf(request.query)))
  api.post<{ Body: EnvironmentInput }>('/me/environment', { schema: { body: environmentSchema } }, async (request, reply) => {
    let at: string
    try { at = strictDate(request.body.at) } catch { return fail(400, 'Invalid timestamp') }
    const input = { ...request.body, at }, crewId = crew(request)
    const inserted = await db.query(`INSERT INTO environment(id,crew_id,client_id,at,source,radiation_dose_msv,altitude_meters,temperature_c,oxygen_percent,
      radiation_dose_mgy_day,radiation_accum_mgy,co2_ppm,relative_humidity_pct)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) ON CONFLICT(crew_id,client_id) DO NOTHING RETURNING *`,
      [randomUUID(), crewId, input.clientId, at, input.source, input.radiationDoseMsv ?? null,
        input.altitudeMeters ?? null, input.temperatureC ?? null, input.oxygenPercent ?? null,
        input.radiationDoseMgyDay ?? null, input.radiationAccumMgy ?? null, input.co2Ppm ?? null, input.relativeHumidityPct ?? null])
    const row = inserted.rows[0] ?? (await db.query('SELECT * FROM environment WHERE crew_id=$1 AND client_id=$2', [crewId, input.clientId])).rows[0]
    if (canonical(environmentInput(row)) !== canonical(input)) fail(409, 'clientId already used with different data')
    return reply.code(inserted.rowCount ? 201 : 200).send(environmentOutput(row))
  })
}
