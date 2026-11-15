import { randomUUID } from 'node:crypto'
import type { FastifyInstance, FastifyRequest } from 'fastify'
import type pg from 'pg'

const fail = (code: number, message: string): never => { throw Object.assign(new Error(message), { statusCode: code }) }
export function calendarDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || value < '1900-01-01' || !Number.isFinite(Date.parse(value + 'T00:00:00Z')) || new Date(value + 'T00:00:00Z').toISOString().slice(0, 10) !== value)
    fail(400, 'Use a valid calendar date (YYYY-MM-DD), from 1900 onward')
  return value
}
const dateSchema = { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$' }
const params = { type: 'object', additionalProperties: false, required: ['id'], properties: { id: { type: 'string', format: 'uuid' } } }
const properties = {
  startDate: dateSchema, endDate: { anyOf: [dateSchema, { type: 'null' }] },
  flow: { type: 'string', enum: ['unspecified', 'spotting', 'light', 'moderate', 'heavy'] },
  pain: { anyOf: [{ type: 'integer', minimum: 0, maximum: 10 }, { type: 'null' }] },
  symptoms: { type: 'array', maxItems: 6, uniqueItems: true, items: { type: 'string', enum: ['cramps', 'headache', 'fatigue', 'bloating', 'breast-tenderness', 'mood-change'] } },
  note: { type: 'string', maxLength: 1000 },
}
interface PeriodInput { startDate: string; endDate: string | null; flow: string; pain: number | null; symptoms: string[]; note: string }
type Row = Record<string, any>
const columns = 'id, client_id, start_date::text, end_date::text, flow, pain, symptoms, note, version, created_at, updated_at'
function output(row: Row) {
  return { id: row.id, clientId: row.client_id, startDate: row.start_date, endDate: row.end_date, flow: row.flow, pain: row.pain,
    symptoms: row.symptoms, note: row.note, version: row.version, source: 'self-reported', createdAt: row.created_at.toISOString(), updatedAt: row.updated_at.toISOString() }
}
function validate(input: PeriodInput) {
  calendarDate(input.startDate)
  if (input.endDate !== null) calendarDate(input.endDate)
  if (input.endDate && input.endDate < input.startDate) fail(400, 'End date must be on or after start date')
  const today = new Date().toISOString().slice(0, 10)
  if (input.startDate > today || (input.endDate && input.endDate > today)) fail(400, 'Observed dates cannot be in the future (UTC)')
}
function same(row: Row, input: PeriodInput) {
  return row.start_date === input.startDate && row.end_date === input.endDate && row.flow === input.flow && row.pain === input.pain && row.note === input.note &&
    [...row.symptoms].sort().join(',') === [...input.symptoms].sort().join(',')
}

export function registerMenstrualRoutes(api: FastifyInstance, db: pg.Pool, owner: (req: FastifyRequest) => string) {
  // Mirrors the existing female-profile entry point; it does not infer menstruation or fertility.
  async function eligible(req: FastifyRequest) {
    const id = owner(req)
    const result = await db.query("SELECT profile->>'bodyModel' AS model FROM crew WHERE id=$1", [id])
    if (result.rows[0]?.model !== 'female') fail(403, 'Calendar is available for the female profile')
    return id
  }
  api.get<{ Querystring: { from: string; to: string } }>('/me/menstrual', { schema: { querystring: {
    type: 'object', additionalProperties: false, required: ['from', 'to'], properties: { from: dateSchema, to: dateSchema },
  } } }, async req => {
    const id = await eligible(req), from = calendarDate(req.query.from), to = calendarDate(req.query.to)
    if (from > to || (Date.parse(to) - Date.parse(from)) / 86400000 > 366) fail(400, 'Select an ordered window of at most 366 days')
    const result = await db.query(`SELECT ${columns} FROM menstrual_periods WHERE crew_id=$1 AND start_date <= $3::date AND (end_date IS NULL OR end_date >= $2::date) ORDER BY start_date DESC LIMIT 501`, [id, from, to])
    return { crewId: id, from, to, today: new Date().toISOString().slice(0, 10), items: result.rows.slice(0, 500).map(output), truncated: result.rows.length > 500 }
  })
  async function write(req: FastifyRequest, input: PeriodInput, clientId?: string, id?: string, version?: number) {
    const crewId = await eligible(req); validate(input)
    const client = await db.connect()
    try {
      await client.query('BEGIN')
      // Serializes range checks, including simultaneous requests from different tabs.
      await client.query('SELECT id FROM crew WHERE id=$1 FOR UPDATE', [crewId])
      const existing = await client.query(`SELECT ${columns} FROM menstrual_periods WHERE crew_id=$1 AND ${id ? 'id' : 'client_id'}=$2`, [crewId, id ?? clientId])
      const row = existing.rows[0]
      if (id && !row) fail(404, 'Period not found')
      if (row && !id) {
        if (!same(row, input)) fail(409, 'This submission was already saved with different values; reload the calendar')
        await client.query('COMMIT'); return { record: output(row), created: false }
      }
      if (row && row.version !== version) fail(409, 'This record changed. Reload the calendar before editing')
      const overlap = await client.query('SELECT id FROM menstrual_periods WHERE crew_id=$1 AND ($4::uuid IS NULL OR id<>$4) AND daterange(start_date,end_date,\'[]\') && daterange($2::date,$3::date,\'[]\') LIMIT 1', [crewId, input.startDate, input.endDate, id ?? null])
      if (overlap.rowCount) fail(409, 'Dates overlap another period. End the ongoing record or edit the existing record')
      const values = [input.startDate, input.endDate, input.flow, input.pain, input.symptoms, input.note]
      const saved = id
        ? await client.query(`UPDATE menstrual_periods SET start_date=$1,end_date=$2,flow=$3,pain=$4,symptoms=$5,note=$6,version=version+1,updated_at=now() WHERE id=$7 AND crew_id=$8 RETURNING ${columns}`, [...values, id, crewId])
        : await client.query(`INSERT INTO menstrual_periods(start_date,end_date,flow,pain,symptoms,note,id,crew_id,client_id) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING ${columns}`, [...values, randomUUID(), crewId, clientId])
      await client.query('COMMIT'); return { record: output(saved.rows[0]), created: !id }
    } catch (error) { await client.query('ROLLBACK'); throw error } finally { client.release() }
  }
  api.post<{ Body: PeriodInput & { clientId: string } }>('/me/menstrual/periods', { schema: { body: {
    type: 'object', additionalProperties: false, required: [...Object.keys(properties), 'clientId'], properties: { ...properties, clientId: { type: 'string', format: 'uuid' } },
  } } }, async (req, reply) => {
    const result = await write(req, req.body, req.body.clientId)
    return reply.code(result.created ? 201 : 200).send(result.record)
  })
  api.post<{ Params: { id: string }; Body: PeriodInput & { version: number } }>('/me/menstrual/periods/:id', { schema: { params, body: {
    type: 'object', additionalProperties: false, required: [...Object.keys(properties), 'version'], properties: { ...properties, version: { type: 'integer', minimum: 1 } },
  } } }, async req => (await write(req, req.body, undefined, req.params.id, req.body.version)).record)
  api.post<{ Params: { id: string }; Body: { version: number } }>('/me/menstrual/periods/:id/delete', { schema: { params, body: {
    type: 'object', additionalProperties: false, required: ['version'], properties: { version: { type: 'integer', minimum: 1 } },
  } } }, async (req, reply) => {
    const crewId = await eligible(req), client = await db.connect()
    try {
      await client.query('BEGIN')
      await client.query('SELECT id FROM crew WHERE id=$1 FOR UPDATE', [crewId])
      const row = (await client.query('SELECT version FROM menstrual_periods WHERE id=$1 AND crew_id=$2', [req.params.id, crewId])).rows[0]
      if (!row) fail(404, 'Period not found')
      if (row.version !== req.body.version) fail(409, 'This record changed. Reload the calendar before deleting')
      await client.query('DELETE FROM menstrual_periods WHERE id=$1 AND crew_id=$2', [req.params.id, crewId])
      await client.query('COMMIT'); return reply.code(204).send()
    } catch (error) { await client.query('ROLLBACK'); throw error } finally { client.release() }
  })
}
