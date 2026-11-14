import type { CheckInInput } from './storage'
import type { MedicalObservation, Provenance } from './medical-types'
import type { Status } from '@/types'

export const isAssessmentStatus = (value: string): value is Status => value === 'baseline' || value === 'attention' || value === 'flagged'

/** Match the snapshot to this exact observation; never borrow one from another measurement. */
export function assessmentFor(record: CheckInInput | undefined, metric: string): MedicalObservation | undefined {
  if (!record || record.sync === 'rejected') return undefined
  return record.observations?.find(o => o.metric === metric && o.value === record.vitals?.[metric as keyof NonNullable<CheckInInput['vitals']>]
    && Number.isFinite(Date.parse(o.observedAt)) && Date.parse(o.observedAt) === Date.parse(record.at))
}

export function provenanceFor(record: CheckInInput | undefined, metric: string): Provenance | undefined {
  const saved = assessmentFor(record, metric)
  if (saved) return {
    method: saved.method === 'manual' || saved.method === 'simulated-device' ? saved.method : 'unknown',
    quality: saved.quality === 'simulated' ? 'simulated' : 'unknown',
  }
  return record?.provenance?.[metric]
}

export const methodLabel = (provenance?: Provenance) => provenance?.method === 'manual' ? 'Manual entry'
  : provenance?.method === 'simulated-device' ? 'Simulated device' : 'Collection method unknown'

export function describeAssessment(o: MedicalObservation) {
  if (o.baseline === null || o.delta === null || !isAssessmentStatus(o.status))
    return 'This value was retained without a comparison: no personal baseline or demonstration rule was available.'
  const amount = Number(Math.abs(o.delta).toFixed(3))
  const relation = o.delta === 0 ? 'matches' : `${amount} ${o.unit} ${o.delta < 0 ? 'below' : 'above'}`
  return o.delta === 0 ? `The measurement matches the baseline used for this record (${o.baseline} ${o.unit}).`
    : `The measurement is ${relation} the baseline used for this record (${o.baseline} ${o.unit}).`
}
