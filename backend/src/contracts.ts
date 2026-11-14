export interface CheckInInput {
  clientId: string; at: string; source: 'simulated'
  vitals: { heartRate?: number; bloodPressure?: number; bloodPressureDiastolic?: number; sleep?: number; temperature?: number; spo2?: number; respiratoryRate?: number; bodyMass?: number }
  behavioral: { mood?: number; stress?: number; rest?: number }
  healthDetails?: { urine?: string; stool?: string; urinations24h?: number; stools24h?: number; redFlag?: boolean }
  provenance?: Record<string, { method: 'manual' | 'simulated-device' | 'unknown'; quality: 'simulated' | 'unknown' }>
}
const positive = { type: 'number', exclusiveMinimum: 0, maximum: 1000 }
const scale = { type: 'integer', minimum: 1, maximum: 5 }
const clientId = { type: 'string', minLength: 1, maxLength: 128, pattern: '^[A-Za-z0-9_-]+$' }
const timestamp = { type: 'string', format: 'date-time', maxLength: 40 }
export const bodyParts = ['head', 'neck', 'chest', 'abdomen', 'back', 'left-arm', 'right-arm', 'left-leg', 'right-leg', 'general']
export const checkInSchema = {
  type: 'object', additionalProperties: false, required: ['clientId', 'at', 'source', 'vitals', 'behavioral'],
  properties: { clientId, at: timestamp, source: { type: 'string', const: 'simulated' },
    vitals: { type: 'object', additionalProperties: false,
      dependencies: { bloodPressure: ['bloodPressureDiastolic'], bloodPressureDiastolic: ['bloodPressure'] },
      properties: { heartRate: positive, bloodPressure: positive, bloodPressureDiastolic: positive,
        sleep: { type: 'number', minimum: 0, maximum: 24 }, temperature: positive,
        spo2: { type: 'number', minimum: 0, maximum: 100 }, respiratoryRate: positive, bodyMass: positive } },
    behavioral: { type: 'object', additionalProperties: false, properties: { mood: scale, stress: scale, rest: scale } },
    provenance: { type: 'object', additionalProperties: false,
      properties: Object.fromEntries(['heartRate', 'bloodPressure', 'bloodPressureDiastolic', 'sleep', 'temperature', 'spo2', 'respiratoryRate', 'bodyMass'].map(id => [id, {
        type: 'object', additionalProperties: false, required: ['method', 'quality'],
        properties: { method: { enum: ['manual', 'simulated-device', 'unknown'] }, quality: { enum: ['simulated', 'unknown'] } },
      }])) },
    healthDetails: { type: 'object', additionalProperties: false, properties: {
      urine: { type: 'string', minLength: 1, maxLength: 2000, pattern: '\\S' },
      stool: { type: 'string', minLength: 1, maxLength: 2000, pattern: '\\S' },
      // Daily counts (NEXUS-Med import) and a "yes" to a check-up alert question.
      urinations24h: { type: 'integer', minimum: 0, maximum: 100 },
      stools24h: { type: 'integer', minimum: 0, maximum: 100 },
      redFlag: { type: 'boolean' } } } },
}
export const historySchema = {
  type: 'object', additionalProperties: false,
  properties: { from: timestamp, to: timestamp, limit: { type: 'string', pattern: '^(?:[1-9]|[1-9][0-9]|100)$' } },
}
export const symptomSchema = {
  type: 'object', additionalProperties: false, required: ['clientId', 'at', 'label', 'bodyPart', 'severity'],
  properties: { clientId, at: timestamp, onsetAt: timestamp,
    label: { type: 'string', minLength: 1, maxLength: 120 }, bodyPart: { type: 'string', enum: bodyParts },
    severity: { type: 'integer', minimum: 0, maximum: 10 }, note: { type: 'string', maxLength: 2000 } },
}
export const eventSchema = {
  type: 'object', additionalProperties: false, required: ['clientId', 'at', 'type'],
  properties: { clientId, at: timestamp, type: { type: 'string', enum: ['evolution', 'resolution'] },
    severity: { type: 'integer', minimum: 0, maximum: 10 }, note: { type: 'string', maxLength: 2000 } },
}
export const analysisSchema = {
  type: 'object', additionalProperties: false, required: ['from', 'to', 'method'],
  properties: { from: timestamp, to: timestamp, method: { type: 'string', enum: ['deterministic', 'ai'] } },
}
/** Reject rollover dates accepted by Date.parse (e.g. February 30), leap seconds and timezone-free timestamps. */
export function strictDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(\.\d{1,3})?(Z|[+-]\d{2}:\d{2})$/.exec(value)
  if (!match || !Number.isFinite(Date.parse(value))) throw new Error('Invalid timestamp')
  const [, year, month, day, hour, minute, second] = match
  const y = Number(year), m = Number(month), d = Number(day)
  if (y < 1900 || y > 9999 || m < 1 || m > 12 || d < 1 || d > new Date(Date.UTC(y, m, 0)).getUTCDate()
    || Number(hour) > 23 || Number(minute) > 59 || Number(second) > 59) throw new Error('Invalid timestamp')
  return new Date(value).toISOString()
}
export function canonical(input: unknown): string {
  if (Array.isArray(input)) return '[' + input.map(canonical).join(',') + ']'
  if (input && typeof input === 'object') return '{' + Object.entries(input).sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => JSON.stringify(key) + ':' + canonical(value)).join(',') + '}'
  return JSON.stringify(input)
}
