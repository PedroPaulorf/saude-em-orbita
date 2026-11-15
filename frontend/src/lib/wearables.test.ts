import { describe, it, expect } from 'vitest'
import { appleRecord, csvRows, exampleCsv, exampleFile, metricInfo, parseNormalized, validateWearableFile, type WearableSource } from './wearables'

describe('wearable import contracts', () => {
  it.each<WearableSource>(['apple', 'samsung', 'garmin', 'actlumus'])('round-trips labeled examples for %s in JSON and CSV', source => {
    const json = parseNormalized(JSON.stringify(exampleFile(source)), source, false)
    const csv = parseNormalized(exampleCsv(source), source, true)
    expect(csv.samples).toEqual(json.samples); expect(csv.quality).toBe('example')
    expect(() => validateWearableFile({ ...exampleFile(source), crewId: 'other' }, source)).toThrow()
  })
  it('preserves quoted CSV text and rejects malformed values without silently replacing them', () => {
    expect(csvRows('a,b\r\n"watch, one","say ""hi"""\r\n')).toEqual([['a', 'b'], ['watch, one', 'say "hi"']])
    for (const raw of ['"unterminated', 'a"b,c', '"a"oops,b']) expect(() => csvRows(raw)).toThrow()
    expect(() => parseNormalized(exampleCsv('garmin').replace(',62,', ',, '), 'garmin', true)).toThrow()
    expect(() => parseNormalized(exampleCsv('garmin'), 'samsung', true)).toThrow()
    const rows = exampleCsv('garmin').trim().split('\n')
    expect(() => parseNormalized(`${rows[0]}\n${rows[1].replace(',example,', ',,')}\n${rows[1]}\n`, 'garmin', true)).toThrow()
  })
  it('requires exact dates, units and bounded asleep intervals without confusing skin/core temperatures', () => {
    const input = exampleFile('apple'), sample = input.samples[0]
    for (const change of [{ at: '2026-02-30T00:00:00Z' }, { at: '2026-11-14T12:00:00' }, { value: NaN }, { unit: 'count/min' }, { metric: '__proto__' }, { metric: 'temperature', unit: 'degC', value: 36 }]) {
      expect(() => validateWearableFile({ ...input, samples: [{ ...sample, ...change }] }, 'apple')).toThrow()
    }
    const sleep = { ...sample, metric: 'sleepDuration', unit: 'h', value: 8, at: '2026-11-14T00:00:00Z', endAt: '2026-11-14T08:00:00Z' }
    expect(validateWearableFile({ ...input, samples: [sleep] }, 'apple').samples[0].value).toBe(8)
    expect(() => validateWearableFile({ ...input, samples: [{ ...sleep, value: 7 }] }, 'apple')).toThrow()
  })
  it('maps known Apple Health units, fraction oxygen and timezone while preserving the distinction between resting and general heart rate', () => {
    const attributes = { type: 'HKQuantityTypeIdentifierOxygenSaturation', unit: '%', value: '0.97', sourceName: 'Declared Watch', startDate: '2026-11-14 09:00:00 -0300', endDate: '2026-11-14 09:00:01 -0300' }
    const s = appleRecord(attributes)!
    expect(s.value).toBe(97); expect(s.unit).toBe('%')
    expect(validateWearableFile({ version: 1, source: 'apple', quality: 'unverified', samples: [s] }, 'apple').samples[0].at).toBe('2026-11-14T12:00:00.000Z')
    expect(appleRecord({ ...attributes, type: 'HKQuantityTypeIdentifierRestingHeartRate', unit: 'count/min', value: '62' })!.metric).toBe('restingHeartRate')
    expect(appleRecord({ ...attributes, type: 'HKQuantityTypeIdentifierHeartRate', unit: 'count/min', value: '90' })!.metric).toBe('heartRate')
    expect(appleRecord({ ...attributes, type: 'HKCategoryTypeIdentifierSleepAnalysis' })).toBeNull()
    expect(() => appleRecord({ ...attributes, unit: 'fraction' })).toThrow()
    expect(() => appleRecord({ ...attributes, value: '0x61' })).toThrow()
    // Normalized percentages already use 0–100; they are not multiplied a second time.
    expect(validateWearableFile({ version: 1, source: 'apple', quality: 'unverified', samples: [{ ...s, value: 97 }] }, 'apple').samples[0].value).toBe(97)
  })
  it('keeps ActLumus light channels separate and does not accept invented vital signs', () => {
    expect(metricInfo.skinTemperature[0]).toBe('Skin temperature')
    const input = exampleFile('actlumus')
    expect(() => validateWearableFile({ ...input, samples: [{ ...input.samples[0], metric: 'heartRate', unit: 'bpm' }] }, 'actlumus')).toThrow()
    expect(() => validateWearableFile({ ...input, source: 'garmin' }, 'garmin')).toThrow()
  })
})
