export interface CheckInInput {
  clientId: string
  at: string
  source: 'simulated'
  vitals: { heartRate?: number; bloodPressure?: number; bloodPressureDiastolic?: number; sleep?: number; temperature?: number; spo2?: number; respiratoryRate?: number; bodyMass?: number }
  behavioral: { mood?: number; stress?: number; rest?: number }
  provenance?: Record<string, { method: 'manual' | 'simulated-device' | 'unknown'; quality: 'simulated' | 'unknown' }>
}

const positive = { type: 'number', exclusiveMinimum: 0 }
const scale = { type: 'integer', minimum: 1, maximum: 5 }
export const checkInSchema = {
  type: 'object', additionalProperties: false,
  required: ['clientId', 'at', 'source', 'vitals', 'behavioral'],
  properties: {
    clientId: { type: 'string', minLength: 1, maxLength: 128, pattern: '^[A-Za-z0-9_-]+$' },
    at: { type: 'string', format: 'date-time' },
    source: { type: 'string', const: 'simulated' },
    vitals: {
      type: 'object', additionalProperties: false,
      dependencies: { bloodPressure: ['bloodPressureDiastolic'], bloodPressureDiastolic: ['bloodPressure'] },
      properties: { heartRate: positive, bloodPressure: positive, bloodPressureDiastolic: positive,
        sleep: { type: 'number', minimum: 0, maximum: 24 }, temperature: positive,
        spo2: { type: 'number', exclusiveMinimum: 0, maximum: 100 }, respiratoryRate: positive, bodyMass: positive },
    },
    behavioral: { type: 'object', additionalProperties: false, properties: { mood: scale, stress: scale, rest: scale } },
    provenance: {
      type: 'object', additionalProperties: false,
      properties: Object.fromEntries(['heartRate', 'bloodPressure', 'bloodPressureDiastolic', 'sleep', 'temperature', 'spo2', 'respiratoryRate', 'bodyMass'].map((id) => [id, {
        type: 'object', additionalProperties: false, required: ['method', 'quality'],
        properties: { method: { enum: ['manual', 'simulated-device', 'unknown'] }, quality: { enum: ['simulated', 'unknown'] } },
      }])),
    },
  },
}

export const historySchema = {
  type: 'object', additionalProperties: false,
  properties: {
    from: { type: 'string', format: 'date-time' }, to: { type: 'string', format: 'date-time' },
    limit: { type: 'integer', minimum: 1, maximum: 100, default: 50 },
  },
}

/** Stable property ordering also makes retries independent of JSON key order. */
export function canonical(input: CheckInInput) {
  const sorted = (data: object) => Object.fromEntries(Object.entries(data).sort(([a], [b]) => a.localeCompare(b)))
  return JSON.stringify({ clientId: input.clientId, at: new Date(input.at).toISOString(), source: input.source,
    vitals: sorted(input.vitals), behavioral: sorted(input.behavioral),
    ...(input.provenance ? { provenance: Object.fromEntries(Object.entries(input.provenance).sort(([a], [b]) => a.localeCompare(b)).map(([id, meta]) => [id, sorted(meta)])) } : {}) })
}
