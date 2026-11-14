import type { MedicalObservation, Provenance } from '@/lib/medical-types'
import { describeAssessment, isAssessmentStatus, methodLabel } from '@/lib/measurement'
import { utcDateTime } from '@/lib/utils'
import { StatusBadge } from './StatusBadge'

export function MeasurementProvenance({ provenance, at, sync }: { provenance?: Provenance; at?: string; sync?: 'pending' | 'saved' | 'rejected' }) {
  return <div className="grid gap-0.5 text-xs text-ink-soft">
    <p>{methodLabel(provenance)} · {provenance?.quality === 'simulated' ? 'Simulated data' : 'Quality unrecorded'}</p>
    {at && <p><time dateTime={at}>{utcDateTime(at)}</time>{sync === 'pending' ? ' · Queued on this device' : sync === 'saved' ? ' · Saved to server' : sync === 'rejected' ? ' · Rejected record' : ''}</p>}
  </div>
}

export function AssessmentDetails({ assessment, localRule, recordId, clientId, title = 'Why this state?' }: {
  assessment?: MedicalObservation; localRule?: string; recordId?: string; clientId?: string; title?: string
}) {
  return <details className="mt-1 text-sm">
    <summary className="min-h-9 cursor-pointer py-2 font-semibold text-interactive">{title}</summary>
    <div className="grid gap-2 border-l-2 border-hairline-strong pl-3 pb-2 text-ink-soft">
      {assessment ? <>
        <p className="font-semibold text-ink">{assessment.retrospective ? 'Retrospective assessment' : 'Saved assessment'}</p>
        {isAssessmentStatus(assessment.status) ? <StatusBadge status={assessment.status} className="justify-self-start" /> : <p>No saved comparison</p>}
        <p>{describeAssessment(assessment)}</p>
        {assessment.rule && <p>Demonstration thresholds: attention at {assessment.rule.attention} {assessment.unit}, flagged at {assessment.rule.flagged} {assessment.unit} {assessment.rule.direction === 'both' ? 'away from' : assessment.rule.direction} baseline.</p>}
        {assessment.metric === 'bloodPressure' && <p>Blood pressure status compares systolic only. The diastolic value is retained without a comparison.</p>}
        {assessment.retrospective && <p>This assessment was added later using the baseline available at migration time. It does not establish the baseline at the original measurement time.</p>}
        <p>Preserved with this record; later changes to your baseline do not recalculate it.</p>
        <details className="text-xs">
          <summary className="cursor-pointer py-2 font-semibold">Assessment record</summary>
          <dl className="grid gap-1 break-all">
            <dt>Rule version</dt><dd>{assessment.ruleVersion ?? 'Not evaluated'}</dd>
            <dt>Baseline version</dt><dd>{assessment.baselineVersion ?? 'Unavailable'}</dd>
            <dt>Evaluated</dt><dd>{utcDateTime(assessment.evaluatedAt)}</dd>
            {recordId && <><dt>Server record</dt><dd>{recordId}</dd></>}
            {clientId && <><dt>Client record</dt><dd>{clientId}</dd></>}
          </dl>
        </details>
      </> : <>
        <p className="font-semibold text-ink">No archived assessment for this record.</p>
        {localRule ? <><p>Local preview using your current personal baseline. It is not a saved server assessment.</p><p>{localRule}</p></>
          : <p>The original status and baseline are not reconstructed from your current profile.</p>}
      </>}
      <p className="text-xs">Demonstration rules without clinical validation. NASA architecture references do not validate these thresholds.</p>
    </div>
  </details>
}
