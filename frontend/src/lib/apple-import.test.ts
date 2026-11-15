import { expect, test } from 'vitest'
import { appleRecord, parseAppleXml } from './wearables'
import { createAppleXmlReader } from './wearables'
import { nextImportBatch } from './wearable-batches'

const record = (type = 'StepCount', value = '12', unit = 'count') => `<Record type="HKQuantityTypeIdentifier${type}" sourceName="iPhone &amp; Test" value="${value}" unit="${unit}" startDate="2026-11-14 12:00:00 -0300" endDate="2026-11-14 12:01:00 -0300"/>`

test('imports more than 500 Apple activity measurements and keeps bounded request batches', () => {
  const data = parseAppleXml(`<HealthData>${record().repeat(1201)}</HealthData>`)
  expect(data.samples).toHaveLength(1201)
  const batches = []; let offset = 0
  while (offset < data.samples.length) { const batch = nextImportBatch(data, 'file-id', offset); batches.push(batch); offset += batch.samples.length }
  expect(batches.map(b => b.samples.length)).toEqual([500, 500, 201])
  expect(batches[1].clientId).toBe('file-id-500')
  expect(nextImportBatch(data, 'file-id', 500)).toEqual(batches[1])
})

test('streaming parser handles split tags, Apple DTD, escapes and nested metadata', () => {
  const xml = `<?xml version="1.0"?><!DOCTYPE HealthData [<!ELEMENT HealthData ANY>]><HealthData>${record().replace('/>', '><MetadataEntry key="note" value="hello"/></Record>')}</HealthData>`
  const reader = createAppleXmlReader()
  for (let n = 0; n < xml.length; n += 7) reader.write(xml.slice(n, n + 7))
  const sample = reader.finish().samples[0]
  expect(sample.device).toBe('iPhone & Test')
  expect(sample.at).toBe('2026-11-14T15:00:00.000Z')
})

test('activity units are converted explicitly and never become heart rate or clinical scores', () => {
  const a = { type: 'HKQuantityTypeIdentifierDistanceWalkingRunning', sourceName: 'Phone', value: '2', unit: 'km', startDate: '2026-11-14T12:00:00Z', endDate: '2026-11-14T12:00:01Z' }
  expect(appleRecord(a)).toMatchObject({ metric: 'walkingRunningDistance', unit: 'm', value: 2000 })
  expect(appleRecord({ ...a, type: 'HKQuantityTypeIdentifierWalkingSpeed', unit: 'km/hr', value: '3.6' })).toMatchObject({ metric: 'walkingSpeed', unit: 'm/s', value: 1 })
  expect(appleRecord({ ...a, type: 'HKQuantityTypeIdentifierActiveEnergyBurned', unit: 'kJ', value: '4.184' })?.value).toBeCloseTo(1)
  expect(() => parseAppleXml(`<HealthData>${record('StepCount', '-1')}</HealthData>`)).toThrow()
})

test('malformed or unsafe XML fails before any upload, and unsupported types stay explicit', () => {
  for (const xml of ['<HealthData><Record></HealthData>', '<wrong/>', '<!DOCTYPE HealthData SYSTEM "file:///secret"><HealthData/>', '<!DOCTYPE HealthData [<!ENTITY x "secret">]><HealthData/>']) expect(() => parseAppleXml(xml)).toThrow()
  expect(() => parseAppleXml('<HealthData><Record type="UnknownType"/></HealthData>')).toThrow('UnknownType')
})
