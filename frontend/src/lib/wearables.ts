import { SaxesParser } from 'saxes'
export type WearableSource = 'apple' | 'samsung' | 'garmin' | 'actlumus'
export const metricInfo = {
  heartRate: ['Heart rate', 'bpm', 1, 350], restingHeartRate: ['Resting heart rate', 'bpm', 1, 350],
  spo2: ['Oxygen saturation', '%', 0, 100], respiratoryRate: ['Respiratory rate', 'breaths/min', 1, 150],
  bodyMass: ['Body mass', 'kg', 1, 500], sleepDuration: ['Asleep interval', 'h', 0, 24],
  skinTemperature: ['Skin temperature', 'degC', -20, 60], photopicLight: ['Photopic light', 'lux', 0, 200000],
  melanopicLight: ['Melanopic light', 'melanopic-lux', 0, 200000],
  stepCount: ['Steps (recorded interval)', 'count', 0, 1000000],
  walkingRunningDistance: ['Walking / running distance', 'm', 0, 10000000],
  walkingSpeed: ['Walking speed', 'm/s', 0, 100],
  activeEnergy: ['Active energy', 'kcal', 0, 100000],
  basalEnergy: ['Basal energy', 'kcal', 0, 100000],
} as const
export interface WearableSample { device: string; metric: keyof typeof metricInfo; value: number; unit: string; at: string; endAt?: string }
export interface WearableFile { version: 1; source: WearableSource; quality: 'unverified' | 'example'; samples: WearableSample[] }
export interface ParsedWearables extends WearableFile { format: 'health7-json-v1' | 'health7-csv-v1' | 'apple-health-xml'; skipped: number }
export interface WearableHistory { crewId: string; total: number; truncated: boolean; nextCursor: string | null; items: (WearableSample & { id: string; source: WearableSource | 'bluetooth'; quality: string; receivedAt: string; transport?: 'bluetooth-le' | 'android-health-connect'; protocol?: string })[] }
export const sources: { id: WearableSource; name: string; route: string; url: string; help: string }[] = [
  { id: 'apple', name: 'Apple Watch / Apple Health', route: 'Apple Health XML + Health7 JSON / CSV', url: 'https://developer.apple.com/documentation/healthkit',
    help: 'Import supported measurements from an extracted Apple Health XML file. Health can contain data from several devices. Automatic reading needs a native iOS app, HealthKit and your permission.' },
  { id: 'samsung', name: 'Samsung Health / Galaxy Watch / Fit3', route: 'Android phone bridge + Health7 JSON / CSV', url: 'https://developer.samsung.com/health/health-connect-faq.html',
    help: 'For Fit3, use the Android phone bridge above to read heart rate shared by Samsung Health through Health Connect. File exports can also be mapped to the Health7 template. Availability depends on phone permissions and shared data.' },
  { id: 'garmin', name: 'Garmin', route: 'Health7 JSON / CSV', url: 'https://developer.garmin.com/gc-developer-program/overview/',
    help: 'Map exported data to the template. Automatic sync needs the appropriate Garmin Connect developer access, credentials and user authorization. Personal and business access have different terms.' },
  { id: 'actlumus', name: 'ActLumus · Condor / USP research', route: 'Health7 JSON / CSV', url: 'https://auspin.usp.br/tecnologia-brasileira-e-lancada-no-espaco-com-os-tripulantes-da-artemis/',
    help: 'A research actigraph used on Artemis II. Map ActStudio exports to named light channels or skin temperature. Raw movement is not converted to sleep, and skin temperature is not core body temperature.' },
]
export const arowUrl = 'https://www.nasa.gov/missions/artemis/artemis-2/track-nasas-artemis-ii-mission-in-real-time/'

function exactKeys(value: object, allowed: string[]) {
  if (Object.keys(value).some(k => !allowed.includes(k))) throw new Error('Unexpected field in file. Use the Health7 template.')
}
function timestamp(value: unknown): string {
  if (typeof value !== 'string') throw new Error('Timestamp must include a timezone.')
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(\.\d{1,3})?(Z|[+-]\d{2}:\d{2})$/.exec(value)
  if (!match || !Number.isFinite(Date.parse(value))) throw new Error('Invalid timestamp. Use ISO 8601 with timezone.')
  const [, y, m, d, h, min, s] = match.map(Number)
  if (y < 1900 || y > 9999 || m < 1 || m > 12 || d < 1 || d > new Date(Date.UTC(y, m, 0)).getUTCDate() || h > 23 || min > 59 || s > 59)
    throw new Error('Invalid calendar date.')
  return new Date(value).toISOString()
}
export function validateWearableFile(value: unknown, selected: WearableSource): WearableFile {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Expected a Health7 file object.')
  exactKeys(value, ['version', 'source', 'quality', 'samples'])
  const data = value as WearableFile
  if (data.version !== 1 || data.source !== selected || !['unverified', 'example'].includes(data.quality))
    throw new Error('Version, source or quality does not match the selected adapter.')
  if (!Array.isArray(data.samples) || data.samples.length < 1 || data.samples.length > 500) throw new Error('Import 1–500 samples per file.')
  const samples = data.samples.map((raw, i) => {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error(`Invalid sample ${i + 1}.`)
    exactKeys(raw, ['device', 'metric', 'value', 'unit', 'at', 'endAt'])
    const info = Object.hasOwn(metricInfo, raw.metric) ? metricInfo[raw.metric] : undefined
    if (!info || typeof raw.value !== 'number' || !Number.isFinite(raw.value) || raw.unit !== info[1] || raw.value < info[2] || raw.value > info[3])
      throw new Error(`Sample ${i + 1}: invalid metric, unit or value.`)
    if (typeof raw.device !== 'string' || !raw.device.trim() || raw.device.length > 160) throw new Error(`Sample ${i + 1}: device/source name is required (max 160 characters).`)
    if (selected === 'actlumus' && !['skinTemperature', 'photopicLight', 'melanopicLight'].includes(raw.metric)) throw new Error('ActLumus accepts skin temperature and named light channels only.')
    if (selected !== 'actlumus' && ['photopicLight', 'melanopicLight'].includes(raw.metric)) throw new Error('Light channels require ActLumus.')
    const at = timestamp(raw.at), endAt = raw.endAt === undefined ? undefined : timestamp(raw.endAt)
    if (endAt && (endAt < at || Date.parse(endAt) - Date.parse(at) > 86400000)) throw new Error('Intervals must be ordered and at most 24 hours.')
    if (raw.metric === 'sleepDuration' && (!endAt || Math.abs((Date.parse(endAt) - Date.parse(at)) / 3600000 - raw.value) > 0.000001)) throw new Error('Sleep requires exact start/end times for each asleep interval.')
    return { ...raw, device: raw.device.trim(), at, ...(endAt ? { endAt } : {}) }
  })
  return { version: 1, source: selected, quality: data.quality, samples }
}

// Small RFC 4180 parser: preserves quoted commas and rejects malformed columns/quotes.
export function csvRows(text: string): string[][] {
  const rows: string[][] = [], row: string[] = []
  let field = '', quoted = false, closed = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++ }
      else if (c === '"') { quoted = false; closed = true }
      else field += c
    } else if (c === '"') {
      if (field || closed) throw new Error('Invalid CSV quote.')
      quoted = true
    } else if (c === ',' || c === '\n' || c === '\r') {
      row.push(field); field = ''; closed = false
      if (c !== ',') {
        if (row.some(v => v !== '')) rows.push([...row])
        row.length = 0
        if (c === '\r' && text[i + 1] === '\n') i++
      }
    } else { if (closed) throw new Error('Invalid text after CSV quote.'); field += c }
  }
  if (quoted) throw new Error('Unclosed CSV quote.')
  row.push(field)
  if (row.some(v => v !== '')) rows.push(row)
  return rows
}
export function parseNormalized(text: string, selected: WearableSource, csv: boolean): ParsedWearables {
  text = text.replace(/^\uFEFF/, '')
  if (!csv) return { ...validateWearableFile(JSON.parse(text), selected), format: 'health7-json-v1', skipped: 0 }
  const [header, ...rows] = csvRows(text)
  if (header?.length !== 8 || header.join(',') !== 'source,quality,device,metric,value,unit,at,endAt') throw new Error('Use the exact CSV header from the template.')
  if (!rows.length || rows.length > 500) throw new Error('Import 1–500 samples per file.')
  let quality = ''
  const samples = rows.map(row => {
    if (row.length !== 8 || row[0] !== selected || !['unverified', 'example'].includes(row[1]) || (quality && quality !== row[1])) throw new Error('CSV rows must have eight columns and the same valid source and quality.')
    quality = row[1]
    if (!row[4].trim() || !/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(row[4])) throw new Error('Use decimal point numbers in CSV.')
    return { device: row[2], metric: row[3], value: Number(row[4]), unit: row[5], at: row[6], ...(row[7] ? { endAt: row[7] } : {}) }
  })
  return { ...validateWearableFile({ version: 1, source: selected, quality, samples }, selected), format: 'health7-csv-v1', skipped: 0 }
}

const appleTypes: Record<string, { metric: WearableSample['metric']; unit: string; convert: (n: number) => number }> = {
  HKQuantityTypeIdentifierHeartRate: { metric: 'heartRate', unit: 'count/min', convert: n => n },
  HKQuantityTypeIdentifierRestingHeartRate: { metric: 'restingHeartRate', unit: 'count/min', convert: n => n },
  HKQuantityTypeIdentifierOxygenSaturation: { metric: 'spo2', unit: '%', convert: n => n * 100 },
  HKQuantityTypeIdentifierRespiratoryRate: { metric: 'respiratoryRate', unit: 'count/min', convert: n => n },
  HKQuantityTypeIdentifierBodyMass: { metric: 'bodyMass', unit: 'kg', convert: n => n },
  HKQuantityTypeIdentifierAppleSleepingWristTemperature: { metric: 'skinTemperature', unit: 'degC', convert: n => n },
  HKQuantityTypeIdentifierStepCount: { metric: 'stepCount', unit: 'count', convert: n => n },
  HKQuantityTypeIdentifierDistanceWalkingRunning: { metric: 'walkingRunningDistance', unit: 'm', convert: n => n },
  HKQuantityTypeIdentifierWalkingSpeed: { metric: 'walkingSpeed', unit: 'm/s', convert: n => n },
  HKQuantityTypeIdentifierActiveEnergyBurned: { metric: 'activeEnergy', unit: 'kcal', convert: n => n },
  HKQuantityTypeIdentifierBasalEnergyBurned: { metric: 'basalEnergy', unit: 'kcal', convert: n => n },
}
export function appleRecord(attributes: Record<string, string>): WearableSample | null {
  const adapter = Object.hasOwn(appleTypes, attributes.type) ? appleTypes[attributes.type] : undefined
  if (!adapter) return null
  const conversions: Record<string, Record<string, number>> = {
    walkingRunningDistance: { m: 1, km: 1000, mi: 1609.344 },
    walkingSpeed: { 'm/s': 1, 'km/hr': 1 / 3.6, 'mi/hr': 0.44704 },
    activeEnergy: { kcal: 1, Cal: 1, kJ: 1 / 4.184, J: 1 / 4184, cal: 0.001 },
    basalEnergy: { kcal: 1, Cal: 1, kJ: 1 / 4.184, J: 1 / 4184, cal: 0.001 },
    bodyMass: { kg: 1, lb: 0.45359237 },
  }
  const factor = conversions[adapter.metric]?.[attributes.unit] ?? (attributes.unit === adapter.unit ? 1 : undefined)
  if (factor === undefined) throw new Error(`Unsupported Apple unit "${attributes.unit ?? '(missing)'}" for ${attributes.type}. Nothing was sent or saved. Report this unit so its conversion can be verified.`)
  if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(attributes.value ?? '') || !Number.isFinite(Number(attributes.value))) throw new Error(`Invalid numeric value for ${attributes.type} (unit "${attributes.unit}"). Nothing was sent or saved.`)
  const appleDate = (s: string) => s?.replace(/^(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}:\d{2}) ([+-]\d{2})(\d{2})$/, '$1T$2$3:$4')
  return { device: attributes.sourceName, metric: adapter.metric, value: adapter.convert(Number(attributes.value) * factor), unit: metricInfo[adapter.metric][1], at: appleDate(attributes.startDate), endAt: appleDate(attributes.endDate) }
}
/** SAX reader: no DOM tree, accepts chunk boundaries inside attributes and UTF-8 text. */
export function createAppleXmlReader() {
  const parser = new SaxesParser({ xmlns: false })
  const samples: WearableSample[] = []; let skipped = 0, depth = 0, root = false
  const unsupported = new Map<string, number>()
  parser.on('error', error => { throw new Error('Invalid Apple XML: ' + error.message) })
  parser.on('doctype', value => { if (/<!ENTITY|\b(?:SYSTEM|PUBLIC)\s+["']/i.test(value)) throw new Error('XML entities and external document types are not accepted.') })
  parser.on('opentag', tag => {
    depth++
    if (depth === 1) { if (tag.name !== 'HealthData') throw new Error('Expected an extracted Apple Health XML file, not ZIP.'); root = true }
    if (depth !== 2 || tag.name !== 'Record') return
    const attrs = tag.attributes as Record<string, string>
    const sample = appleRecord(attrs)
    if (sample) {
      if (samples.length >= 1000000) throw new Error('Export exceeds one million supported measurements. Export a smaller period.')
      samples.push(validateWearableFile({ version: 1, source: 'apple', quality: 'unverified', samples: [sample] }, 'apple').samples[0])
    } else { skipped++; const type = attrs.type ?? 'Unknown'; unsupported.set(type, (unsupported.get(type) ?? 0) + 1) }
  })
  parser.on('closetag', () => { depth-- })
  return {
    write: (chunk: string) => { parser.write(chunk) },
    finish: (): ParsedWearables => {
      parser.close()
      if (!root) throw new Error('Expected an extracted Apple Health XML file.')
      if (!samples.length) {
        const found = [...unsupported.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([type, n]) => type.replace(/^HK(?:Quantity|Category)TypeIdentifier/, '') + ' (' + n + ')').join(', ')
        throw new Error('No supported measurements found. ' + (found ? 'Other records found: ' + found : 'No Record entries found; choose export.xml.') + '. Nothing was sent or saved.')
      }
      return { version: 1, source: 'apple', quality: 'unverified', format: 'apple-health-xml', samples, skipped }
    },
  }
}
export function parseAppleXml(text: string): ParsedWearables {
  const reader = createAppleXmlReader(); reader.write(text); return reader.finish()
}
export function exampleFile(source: WearableSource): WearableFile {
  const light = source === 'actlumus'
  return { version: 1, source, quality: 'example', samples: [{ device: `${source} example (fictional)`, metric: light ? 'photopicLight' : 'restingHeartRate', value: light ? 120 : 62, unit: light ? 'lux' : 'bpm', at: '2026-11-14T12:00:00Z' }] }
}
export function exampleCsv(source: WearableSource) {
  const s = exampleFile(source).samples[0]
  return `source,quality,device,metric,value,unit,at,endAt\n${source},example,${s.device},${s.metric},${s.value},${s.unit},${s.at},\n`
}
