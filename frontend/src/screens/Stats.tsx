import { Panel } from '@/components/app/Panel'
import { symptomsForRegion, configForProfile, normalizeRegion } from '@/lib/health'
import { REGION_NAMES } from '@/lib/present'
import { utcDateTime } from '@/lib/utils'
import type { Profile, Symptom } from '@/lib/api'
import type { CheckIn } from '@/lib/storage'
import type { BodyRegionId, VitalId } from '@/types'
const REGION_VITALS: Record<BodyRegionId,VitalId[]>={head:['sleep'],chest:['heartRate','bloodPressure','spo2','respiratoryRate'],core:['temperature','bodyMass'],leftArm:[],rightArm:[],leftLeg:[],rightLeg:[]}
export function PersonalRecords({profile,checkins,symptoms,region:rawRegion,truncated,historyLoaded}:{profile:Profile;checkins:CheckIn[];symptoms:Symptom[];region?:string|null;truncated:boolean;historyLoaded:boolean}) {
  const region=normalizeRegion(rawRegion)
  const configs=configForProfile(profile).filter(c=>REGION_VITALS[region].includes(c.id))
  const relevant=symptomsForRegion(symptoms,region)
  const general=symptoms.filter(s=>s.bodyPart==='general')
  return <div className="mt-5 grid content-start gap-5">
      <Panel><h2 className="font-display text-2xl font-semibold">{REGION_NAMES[region]} · Personal records</h2><p className="text-sm text-ink-soft">Personal records · {profile.displayName}. Last 30 days, up to 100 records. All times UTC.</p>
        {!historyLoaded&&<p role="status">Server history has not been loaded. Only this account’s cached records are available.</p>}
        {truncated&&<p role="status">History is truncated. Some records or symptom events are outside this view.</p>}
        {configs.length===0&&<p>No measurement is collected for this region. No clinical status can be inferred.</p>}
        {configs.map(c=>{ const history=checkins.filter(r=>r.vitals[c.id]!=null).slice().reverse(); return <section key={c.id} className="grid gap-2 border-t border-hairline pt-4"><h3 className="font-semibold">{c.label}</h3><p className="text-sm text-ink-soft">Personal baseline: {c.id==='bloodPressure'?`${c.baseline}/${c.baselineDiastolic}`:c.baseline} {c.unit} · Reference only, not a measurement.</p>{history.length===0?<p>No {c.label.toLowerCase()} measurements recorded.</p>:<ul className="grid gap-2">{history.map(r=><li key={r.clientId} className="rounded-md bg-surface-2 p-3 text-sm"><time dateTime={r.at}>{utcDateTime(r.at)}</time><span className="ml-3 font-mono">{r.vitals[c.id]}{c.id==='bloodPressure'?`/${r.vitals.bloodPressureDiastolic??'—'}`:''} {c.unit}</span><p className="mt-1 text-ink-soft">{r.sync==='saved'?'Saved to server':r.sync==='rejected'?r.syncError:'Queued on this device'} · {r.source} demonstration record</p></li>)}</ul>}</section> })}
        {region==='head'&&<section className="grid gap-2 border-t border-hairline pt-4"><h3 className="font-semibold">Rest, mood and stress · self-report</h3><p className="text-sm text-ink-soft">Scale 1–5. No diagnosis or combined score.</p>{checkins.some(r=>Object.keys(r.behavioral).length)?<ul className="grid gap-3">{checkins.filter(r=>Object.keys(r.behavioral).length).slice().reverse().map(r=><li key={r.clientId}><time dateTime={r.at}>{utcDateTime(r.at)}</time><p>Rest: {r.behavioral.rest??'—'}/5 · Mood: {r.behavioral.mood??'—'}/5 · Stress: {r.behavioral.stress??'—'}/5</p></li>)}</ul>:<p>No behavioral self-reports recorded.</p>}</section>}
      </Panel>
      <Panel><h2 className="font-display text-xl font-semibold">Regional symptom history</h2><p className="text-sm text-ink-soft">Reports and changes recorded by this account. No new report does not mean a symptom resolved.</p><SymptomList symptoms={relevant}/></Panel>
      {general.length>0&&<Panel><h2 className="font-display text-xl font-semibold">General reports · separate from this region</h2><SymptomList symptoms={general}/></Panel>}
  </div>

}
function SymptomList({symptoms}:{symptoms:Symptom[]}) {
  if(!symptoms.length)return <p>No symptom reports recorded for this region.</p>
  return <ul className="grid gap-4">{symptoms.map(s=><li key={s.id} className="grid gap-2 border-t border-hairline pt-3"><h3 className="font-semibold">{s.label} · {s.status}</h3><p className="text-sm">Region: {s.bodyPart} · Initial intensity {s.severity}/10</p><p className="text-sm">Recorded: {utcDateTime(s.at)}{s.onsetAt&&` · Onset: ${utcDateTime(s.onsetAt)}`}</p>{s.note&&<p className="whitespace-pre-wrap text-sm">{s.note}</p>}<ul className="grid gap-2 text-sm">{s.events.map(e=><li key={e.id}><time>{utcDateTime(e.at)}</time> · {e.type}{e.severity!=null&&` · Intensity ${e.severity}/10`}{e.note&&<p className="whitespace-pre-wrap text-ink-soft">{e.note}</p>}</li>)}</ul>{s.eventsTruncated&&<p>Some earlier symptom events are not shown.</p>}</li>)}</ul>
}
