import { expect, test } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { AssessmentDetails } from './MeasurementDetails'
import type { MedicalObservation } from '@/lib/medical-types'

test('unarchived history does not claim a saved rule or reconstruct the old baseline', () => {
  const html = renderToStaticMarkup(<AssessmentDetails title="Measurement details" />)
  expect(html).toContain('No archived assessment for this record.')
  expect(html).toContain('not reconstructed')
  expect(html).not.toContain('Rule version')
})

test('retrospective assessments disclose that their baseline comes from migration time', () => {
  const assessment: MedicalObservation = { metric: 'sleep', value: 5, unit: 'h', observedAt: '2026-11-14T12:00:00Z', evaluatedAt: '2026-11-14T13:00:00Z',
    method: 'unknown', quality: 'unknown', ruleVersion: 'demo-v1', baselineVersion: 'legacy', baseline: 7, delta: -2, status: 'flagged', explanation: '', retrospective: true, clinicalSource: null }
  const html = renderToStaticMarkup(<AssessmentDetails assessment={assessment} />)
  expect(html).toContain('Retrospective assessment')
  expect(html).toContain('migration time')
  expect(html).toContain('does not establish the baseline at the original measurement time')
  expect(html).toContain('without clinical validation')
})
