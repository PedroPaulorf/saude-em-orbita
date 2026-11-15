import { expect, test } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { IPhoneConnection } from './IPhoneConnection'

test('setup never claims a connected phone without evidence and links to real file import', () => {
  const html = renderToStaticMarkup(<IPhoneConnection apiOrigin="http://192.168.20.213:3001" />)
  expect(html).toContain('Connect iPhone')
  expect(html).toContain('http://192.168.20.213:3001')
  expect(html).toContain('iOS companion app required')
  expect(html).toContain('No Apple measurements received')
  expect(html).toContain('Import Apple Health file instead')
  expect(html).not.toContain('iPhone connected')
})

test('only Apple records count toward the received status; receipt is not a live connection', () => {
  const history = { crewId: 'crew-nx04', total: 2, truncated: false, items: [
    { id: 'a', source: 'apple' as const, quality: 'unverified', receivedAt: '2026-11-15T10:00:00Z', device: 'HealthKit', metric: 'heartRate' as const, value: 65, unit: 'bpm', at: '2026-11-15T09:00:00Z' },
    { id: 'b', source: 'garmin' as const, quality: 'unverified', receivedAt: '2026-11-15T11:00:00Z', device: 'Watch', metric: 'heartRate' as const, value: 65, unit: 'bpm', at: '2026-11-15T09:00:00Z' },
  ] }
  const html = renderToStaticMarkup(<IPhoneConnection apiOrigin="http://localhost:3001" history={history} />)
  expect(html).toContain('1 Apple measurement')
  expect(html).toContain('not a live device connection')
  expect(html).not.toContain('2 Apple measurements')
})
