import Fastify from 'fastify'
import cors from '@fastify/cors'
import { createHash, randomUUID, timingSafeEqual } from 'node:crypto'
import { openDatabase } from './database.js'
import { canonical, checkInSchema, historySchema, type CheckInInput } from './contracts.js'
import { observations, storeObservations } from './medical.js'
import { scenarioSchema, simulate, type Scenario } from './simulation.js'

interface Options { databasePath: string; apiKey: string; origins?: string[]; logger?: boolean }
interface Row { id: string; crew_id: string; received_at: string; payload: string }
const digest = (value: string) => createHash('sha256').update(value).digest()
const output = (row: Row) => ({ ...JSON.parse(row.payload), id: row.id, crewId: row.crew_id, receivedAt: row.received_at })

export function createApp(options: Options) {
  if (!options.apiKey) throw new Error('API_KEY must be configured')
  const app = Fastify({ logger: options.logger ?? false, bodyLimit: 16_384,
    ajv: { customOptions: { removeAdditional: false, coerceTypes: false } } })
  const db = openDatabase(options.databasePath)
  app.addHook('onClose', async () => { db.close() })
  app.register(cors, { origin: options.origins ?? ['http://localhost:5173'], methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'X-API-Key'] })
  app.get('/health', async () => ({ status: 'ok', service: 'Health 7 API' }))

  app.register(async (api) => {
    api.addHook('onRequest', async (request, reply) => {
      const key = request.headers['x-api-key']
      if (typeof key !== 'string' || !timingSafeEqual(digest(key), digest(options.apiKey)))
        return reply.code(401).send({ error: 'Unauthorized' })
    })
    api.addHook('preHandler', async (request, reply) => {
      const { id } = request.params as { id: string }
      if (id && !db.prepare('SELECT id FROM crew WHERE id = ?').get(id))
        return reply.code(404).send({ error: 'Crew member not found' })
    })
    api.get<{ Params: { id: string } }>('/crew/:id', async (request) => {
      const row = db.prepare('SELECT profile FROM crew WHERE id = ?').get(request.params.id)!
      return JSON.parse(row.profile as string)
    })
    api.post<{ Params: { id: string }; Body: CheckInInput }>('/crew/:id/checkins', {
      schema: { body: checkInSchema },
    }, async (request, reply) => {
      const input = request.body
      if (!Number.isFinite(Date.parse(input.at)))
        return reply.code(400).send({ error: 'Invalid timestamp' })
      if (!Object.keys(input.vitals).length && !Object.keys(input.behavioral).length)
        return reply.code(400).send({ error: 'Provide at least one measurement or behavioral answer' })
      const payload = canonical(input)
      const crewId = request.params.id
      const existing = db.prepare('SELECT * FROM checkins WHERE crew_id = ? AND client_id = ?')
        .get(crewId, input.clientId) as Row | undefined
      if (existing) {
        if (existing.payload !== payload) return reply.code(409).send({ error: 'clientId already used with different data' })
        return { ...output(existing), observations: observations(db, existing.id) }
      }
      const id = randomUUID(), receivedAt = new Date().toISOString()
      if (Object.keys(input.provenance ?? {}).some((metric) => !(metric in input.vitals)))
        return reply.code(400).send({ error: 'Provenance must refer to a submitted measurement' })
      db.exec('BEGIN')
      try {
        db.prepare('INSERT INTO checkins(id, crew_id, client_id, at, received_at, payload) VALUES (?, ?, ?, ?, ?, ?)')
          .run(id, crewId, input.clientId, new Date(input.at).toISOString(), receivedAt, payload)
        storeObservations(db, id, input)
        db.exec('COMMIT')
      } catch (error) { db.exec('ROLLBACK'); throw error }
      return reply.code(201).send({ ...output({ id, crew_id: crewId, received_at: receivedAt, payload }), observations: observations(db, id) })
    })
    api.get<{ Params: { id: string }; Querystring: { from?: string; to?: string; limit?: string } }>('/crew/:id/checkins', {
      schema: { querystring: { ...historySchema, properties: { ...historySchema.properties,
        limit: { type: 'string', pattern: '^(?:[1-9]|[1-9][0-9]|100)$', default: '50' } } } },
    }, async (request, reply) => {
      const { from, to, limit } = request.query
      if ((from && !Number.isFinite(Date.parse(from))) || (to && !Number.isFinite(Date.parse(to))))
        return reply.code(400).send({ error: 'Invalid timestamp' })
      const start = from ? new Date(from).toISOString() : '0000', end = to ? new Date(to).toISOString() : '9999'
      if (start > end) return reply.code(400).send({ error: 'from must not be later than to' })
      const rows = db.prepare('SELECT * FROM checkins WHERE crew_id = ? AND at >= ? AND at <= ? ORDER BY at DESC, id DESC LIMIT ?')
        .all(request.params.id, start, end, Number(limit ?? 50)) as unknown as Row[]
      return { items: rows.map((row) => ({ ...output(row), observations: observations(db, row.id) })), limit: Number(limit ?? 50) }
    })
    api.get('/references', async () => ({ items: db.prepare('SELECT document FROM medical_references ORDER BY id').all().map((r) => JSON.parse(r.document as string)) }))
    api.get('/rules', async () => ({ items: db.prepare('SELECT document FROM medical_rules ORDER BY version').all().map((r) => JSON.parse(r.document as string)) }))
    api.post<{ Body: Scenario }>('/simulations', { schema: { body: scenarioSchema } }, async (request, reply) => {
      if (new Set(request.body.conditions.map((c) => c.id)).size !== request.body.conditions.length)
        return reply.code(400).send({ error: 'Condition ids must be unique' })
      const id = randomUUID(), createdAt = new Date().toISOString(), result = simulate(request.body)
      db.prepare('INSERT INTO mission_simulations VALUES (?, ?, ?, ?)').run(id, createdAt, JSON.stringify(request.body), JSON.stringify(result))
      return reply.code(201).send({ id, createdAt, input: request.body, result })
    })
    api.get<{ Params: { simulationId: string } }>('/simulations/:simulationId', async (request, reply) => {
      const row = db.prepare('SELECT * FROM mission_simulations WHERE id = ?').get(request.params.simulationId)
      if (!row) return reply.code(404).send({ error: 'Simulation not found' })
      return { id: row.id, createdAt: row.created_at, input: JSON.parse(row.input as string), result: JSON.parse(row.result as string) }
    })
  }, { prefix: '/api/v1' })
  return app
}
