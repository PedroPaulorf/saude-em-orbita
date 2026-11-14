import simulated from '@/data/simulated.json'
import type { BodyRegion, BodyRegionId, CrewMember, Status, Vital, VitalId, VitalInput } from '@/types'
import type { Profile, Symptom } from './api'
import { loadCheckIns, type CheckInInput } from './storage'
import { getActiveProfile } from './active-profile'

export interface VitalConfig {
  id: VitalId; label: string; question: string; fieldLabel: string; unit: string; decimals: number
  baseline: number; baselineDiastolic?: number; todayDiastolic?: number; history: number[]
  rule: { direction: 'above' | 'below' | 'both'; attention: number; flagged: number }
  source: string; input: VitalInput
}
const definitions = simulated.vitals as VitalConfig[]
export const crew: CrewMember = {
  get id() { return getActiveProfile()?.id ?? '' },
  get displayName() { return getActiveProfile()?.displayName ?? '' },
  get missionDay() { return getActiveProfile()?.missionDay ?? 0 },
}
// Compatibility exports stay live when a different account signs in.
export const vitalConfigs = definitions.map(c => ({ ...c,
  get baseline() { return getActiveProfile()?.baseline[c.id] ?? Number.NaN },
  get baselineDiastolic() { return c.id === 'bloodPressure' ? getActiveProfile()?.baseline.bloodPressureDiastolic : undefined },
  history: [],
}))
export const manualVitalConfigs = vitalConfigs.filter(c => c.input === 'manual')
export const behavioralQuestions = simulated.behavioral
export const configForProfile = (profile: Profile) => definitions.map(c => ({ ...c,
  baseline: profile.baseline[c.id] ?? Number.NaN,
  baselineDiastolic: c.id === 'bloodPressure' ? profile.baseline.bloodPressureDiastolic : undefined,
  history: [],
}))
const fmt = (n: number, decimals: number) => Number.isFinite(n) ? n.toFixed(decimals).replace('-', '−') : '—'
export function evaluate(delta: number, rule: VitalConfig['rule']): Status {
  const relevant = rule.direction === 'above' ? Math.max(delta, 0) : rule.direction === 'below' ? Math.max(-delta, 0) : Math.abs(delta)
  return relevant >= rule.flagged ? 'flagged' : relevant >= rule.attention ? 'attention' : 'baseline'
}
export function ruleText(c: VitalConfig, status: Status) {
  const limit = status === 'flagged' ? c.rule.flagged : c.rule.attention
  const side = c.rule.direction === 'above' ? 'above' : c.rule.direction === 'below' ? 'below' : 'away from'
  return `Demonstration rule: ${fmt(limit, c.decimals)} ${c.unit} or more ${side} personal baseline. No clinical source.`
}
export function lastDayKeys(n = 7, today = new Date()) {
  return Array.from({ length: n }, (_, i) => new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - (n - 1 - i))).toISOString().slice(0, 10))
}
export function getTodayVitals(profile: Profile, records: CheckInInput[]): Vital[]
export function getTodayVitals(today?: Date): Vital[]
export function getTodayVitals(profileOrDate?: Profile | Date, records?: CheckInInput[]): Vital[] {
  const profile = profileOrDate instanceof Date || !profileOrDate ? getActiveProfile() : profileOrDate
  const today = profileOrDate instanceof Date ? profileOrDate : new Date()
  const days = lastDayKeys(7, today), todayKey = days.at(-1)!
  const currentRecords = records ?? (profile ? loadCheckIns(profile.id) : [])
  const configs = profile ? configForProfile(profile) : vitalConfigs
  return configs.map(c => {
    const byDay = new Map<string, CheckInInput>()
    currentRecords.filter(r => r.sync !== 'rejected' && (!r.crewId || r.crewId === profile?.id) && Number.isFinite(r.vitals?.[c.id]))
      .sort((a, b) => a.at.localeCompare(b.at)).forEach(r => byDay.set(r.at.slice(0, 10), r))
    const historyDays = days.filter(day => byDay.has(day))
    const history = historyDays.map(day => byDay.get(day)!.vitals![c.id]!)
    const latest = byDay.get(todayKey), value = latest?.vitals?.[c.id]
    const observed = value != null, hasBaseline = Number.isFinite(c.baseline)
    const delta = observed && hasBaseline ? value - c.baseline : Number.NaN
    const status = evaluate(delta, c.rule), isBP = c.id === 'bloodPressure'
    return { id: c.id, label: c.label, unit: c.unit, observed, comparable: hasBaseline, at: latest?.at,
      value: !observed ? '—' : isBP ? `${fmt(value, 0)}/${latest?.vitals?.bloodPressureDiastolic ?? '—'}` : fmt(value, c.decimals),
      baseline: isBP ? `${fmt(c.baseline, 0)}/${fmt(c.baselineDiastolic ?? Number.NaN, 0)}` : fmt(c.baseline, c.decimals),
      delta: Number.isFinite(delta) ? `${delta > 0 ? '+' : ''}${fmt(delta, c.decimals)}` : '—', status,
      history, historyDays, baselineValue: hasBaseline ? c.baseline : undefined,
      rule: observed && hasBaseline && status !== 'baseline' ? ruleText(c, status) : undefined,
      source: c.source, input: c.input }
  })
}
export const STATUS_TEXT: Record<Status, string> = { baseline: 'Within baseline', attention: 'Attention', flagged: 'Flagged for ground' }
export function getBodyRegions(vitals: Vital[]): BodyRegion[] {
  const groups: { id: BodyRegionId; name?: string; ids: VitalId[] }[] = [
    { id: 'head', name: 'Head · sleep', ids: ['sleep'] },
    { id: 'chest', name: 'Chest · heart and lungs', ids: ['heartRate', 'bloodPressure', 'spo2', 'respiratoryRate'] },
    { id: 'core', name: 'Core · temperature and mass', ids: ['temperature', 'bodyMass'] },
    ...(['leftArm', 'rightArm', 'leftLeg', 'rightLeg'] as BodyRegionId[]).map(id => ({ id, ids: [] })) ]
  const severity = { baseline: 0, attention: 1, flagged: 2 }
  return groups.map(g => {
    const observed = vitals.filter(v => g.ids.includes(v.id) && v.observed !== false)
    const worst = observed.filter(v => v.comparable !== false).sort((a, b) => severity[b.status] - severity[a.status])[0]
    return { id: g.id, name: g.name, observed: observed.length > 0, comparable: !!worst, status: worst?.status ?? 'baseline',
      stateText: worst ? `${STATUS_TEXT[worst.status]} · ${worst.delta} ${worst.unit}` : observed.length ? 'No personal baseline available' : 'No measurement recorded' }
  })
}
const SYMPTOM_REGIONS: Record<BodyRegionId, string[]> = { head: ['head', 'neck'], chest: ['chest'], core: ['abdomen', 'back'], leftArm: ['left-arm'], rightArm: ['right-arm'], leftLeg: ['left-leg'], rightLeg: ['right-leg'] }
export const symptomsForRegion = (symptoms: Symptom[], region: BodyRegionId) => symptoms.filter(s => SYMPTOM_REGIONS[region].includes(s.bodyPart))
export const normalizeRegion = (raw?: string | null): BodyRegionId => raw && Object.hasOwn(SYMPTOM_REGIONS, raw) ? raw as BodyRegionId : 'head'
