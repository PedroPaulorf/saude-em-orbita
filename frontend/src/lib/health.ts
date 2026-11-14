import simulated from '@/data/simulated.json'
import type { BodyRegion, BodyRegionId, Status, Vital, VitalId } from '@/types'
import type { Profile, Symptom } from './api'
import type { CheckIn } from './storage'
import { isTodayUtc } from './utils'
export interface VitalConfig {
  id: VitalId; label: string; question: string; fieldLabel: string; unit: string; decimals: number
  baseline: number; baselineDiastolic?: number; todayDiastolic?: number; history: number[]
  rule: { direction: 'above' | 'below' | 'both'; attention: number; flagged: number }
}
export const vitalConfigs = simulated.vitals as VitalConfig[]
export const behavioralQuestions = simulated.behavioral
export const configForProfile = (profile: Profile) => vitalConfigs.map(c => ({ ...c, baseline: profile.baseline[c.id], baselineDiastolic: c.id === 'bloodPressure' ? profile.baseline.bloodPressureDiastolic : undefined }))
const fmt = (n: number, decimals: number) => n.toFixed(decimals).replace('-', '−')
export function evaluate(delta: number, rule: VitalConfig['rule']): Status {
  const relevant = rule.direction === 'above' ? Math.max(delta, 0) : rule.direction === 'below' ? Math.max(-delta, 0) : Math.abs(delta)
  return relevant >= rule.flagged ? 'flagged' : relevant >= rule.attention ? 'attention' : 'baseline'
}
export function ruleText(c: VitalConfig, status: Status) {
  const limit = status === 'flagged' ? c.rule.flagged : c.rule.attention
  const side = c.rule.direction === 'above' ? 'above' : c.rule.direction === 'below' ? 'below' : 'away from'
  return `Demonstration rule: ${fmt(limit, c.decimals)} ${c.unit} or more ${side} personal baseline. No clinical source.`
}
export function getTodayVitals(profile: Profile, records: CheckIn[]): Vital[] {
  return configForProfile(profile).map(c => {
    const measured = records.filter(r => r.sync !== 'rejected' && r.vitals[c.id] != null).sort((a,b) => a.at.localeCompare(b.at))
    const latest = measured.at(-1)
    const today = latest && isTodayUtc(latest.at) ? latest : undefined
    const value = today?.vitals[c.id]
    const observed = value != null
    const delta = observed ? value - c.baseline : 0
    const status = evaluate(delta, c.rule)
    const isBP = c.id === 'bloodPressure'
    return { id: c.id, label: c.label, unit: c.unit, observed, at: today?.at,
      value: !observed ? '—' : isBP ? `${fmt(value, 0)}/${today?.vitals.bloodPressureDiastolic ?? '—'}` : fmt(value, c.decimals),
      baseline: isBP ? `${c.baseline}/${c.baselineDiastolic}` : fmt(c.baseline, c.decimals),
      delta: observed ? `${delta > 0 ? '+' : ''}${fmt(delta, c.decimals)}` : '—', status,
      history: measured.map(r => r.vitals[c.id]!), baselineValue: c.baseline,
      rule: observed && status !== 'baseline' ? ruleText(c, status) : undefined }
  })
}
export const STATUS_TEXT: Record<Status, string> = { baseline: 'Within baseline', attention: 'Attention', flagged: 'Flagged for ground' }
export function getBodyRegions(vitals: Vital[]): BodyRegion[] {
  const groups: { id: BodyRegionId; name?: string; ids: VitalId[] }[] = [
    { id:'head', name:'Head · sleep', ids:['sleep'] }, { id:'chest', name:'Chest · cardiovascular', ids:['heartRate','bloodPressure'] },
    { id:'core', name:'Core · temperature', ids:['temperature'] }, ...(['leftArm','rightArm','leftLeg','rightLeg'] as BodyRegionId[]).map(id => ({id, ids:[]})) ]
  const severity = { baseline: 0, attention: 1, flagged: 2 }
  return groups.map(g => {
    const observed = vitals.filter(v => g.ids.includes(v.id) && v.observed)
    const worst = observed.sort((a,b) => severity[b.status]-severity[a.status])[0]
    return { id:g.id, name:g.name, observed: observed.length > 0, status:worst?.status ?? 'baseline', stateText: worst ? `${STATUS_TEXT[worst.status]} · ${worst.delta} ${worst.unit}` : 'No measurement recorded' }
  })
}
const SYMPTOM_REGIONS: Record<BodyRegionId, string[]> = { head:['head','neck'], chest:['chest'], core:['abdomen','back'], leftArm:['left-arm'], rightArm:['right-arm'], leftLeg:['left-leg'], rightLeg:['right-leg'] }
export const symptomsForRegion = (symptoms: Symptom[], region: BodyRegionId) => symptoms.filter(s => SYMPTOM_REGIONS[region].includes(s.bodyPart))

export const normalizeRegion = (raw?:string|null):BodyRegionId => raw && Object.hasOwn(SYMPTOM_REGIONS,raw) ? raw as BodyRegionId : 'head'
