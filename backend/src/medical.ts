import { createHash } from 'node:crypto'
import type pg from 'pg'
import { canonical, type CheckInInput } from './contracts.js'

export const RULE_VERSION = 'health7-demo-2026-11-14-v1'
export const references = [
  { id: '20220017869', title: 'ExMC Clinical Decision Support System Architecture Recommendation', topic: 'MDA', role: 'architecture', summary: 'Integrated medical data as a foundation for decision support.' },
  { id: '20250000009', title: 'Earth-Independent Medical Operations Concept of Operations', topic: 'EIMO', role: 'operations', summary: 'Progressive autonomy with communication delays and limited resources.' },
  { id: '20180002541', title: 'Autonomous Medical Operations', topic: 'AMO', role: 'research', summary: 'Research on medical decision support, including ultrasound interpretation.' },
  { id: '20180006877', title: 'Validation of the NASA Integrated Medical Model', topic: 'IMM', role: 'methodology', summary: 'Monte Carlo mission modeling and comparison with observed medical events.' },
].map(r => ({ ...r, url: `https://ntrs.nasa.gov/citations/${r.id}`, clinicalThresholdEvidence: false }))

export const rules: Record<string, { unit: string; attention: number; flagged: number; direction: 'both' | 'below' }> = {
  heartRate: { unit: 'bpm', attention: 5, flagged: 15, direction: 'both' },
  bloodPressure: { unit: 'mmHg', attention: 10, flagged: 20, direction: 'both' },
  sleep: { unit: 'h', attention: 1, flagged: 2, direction: 'below' },
  temperature: { unit: '°C', attention: 0.5, flagged: 1, direction: 'both' },
  spo2: { unit: '%', attention: 2, flagged: 4, direction: 'below' },
  respiratoryRate: { unit: 'breaths/min', attention: 3, flagged: 6, direction: 'both' },
  bodyMass: { unit: 'kg', attention: 1, flagged: 2, direction: 'below' },
}

export async function initializeMedical(db: pg.Pool) {
  const client = await db.connect()
  try {
    await client.query('BEGIN')
    await client.query("SELECT pg_advisory_xact_lock(hashtextextended(current_database() || ':' || current_schema() || ':health7-medical', 0))")
    for (const ref of references) await client.query('INSERT INTO medical_references VALUES($1,$2) ON CONFLICT(id) DO NOTHING', [ref.id, ref])
    await client.query('INSERT INTO medical_rules VALUES($1,$2) ON CONFLICT(version) DO NOTHING', [RULE_VERSION, {
      version: RULE_VERSION, simulated: true, clinicalSource: null, referenceIds: references.map(r => r.id), rules,
      notice: 'Demonstration thresholds without clinical validation. Blood pressure comparison uses systolic only.',
    }])
    // Payloads remain unchanged. Backfilled evaluations use today's baseline, explicitly retrospectively.
    const legacy = await client.query(`SELECT c.id,c.crew_id,c.payload FROM checkins c
      WHERE c.payload->'vitals' <> '{}'::jsonb
      AND NOT EXISTS(SELECT 1 FROM medical_observations o WHERE o.checkin_id=c.id)`)
    for (const row of legacy.rows) await storeObservations(client, row.id, row.crew_id, row.payload, true)
    await client.query('COMMIT')
  } catch (error) { await client.query('ROLLBACK'); throw error } finally { client.release() }
}

export async function storeObservations(db: pg.PoolClient, checkinId: string, crewId: string, input: CheckInInput, retrospective = false) {
  if (!Object.keys(input.vitals).length) return
  const ruleSet = (await db.query('SELECT document FROM medical_rules WHERE version=$1', [RULE_VERSION])).rows[0].document
  const profile = (await db.query('SELECT profile FROM crew WHERE id=$1', [crewId])).rows[0].profile
  const baselines = profile.baseline ?? {}
  const baselineVersion = createHash('sha256').update(canonical(baselines)).digest('hex').slice(0, 16)
  for (const [metric, value] of Object.entries(input.vitals)) {
    const definition = ruleSet.rules[metric] as typeof rules[string] | undefined
    const baseline = typeof baselines[metric] === 'number' && Number.isFinite(baselines[metric]) ? baselines[metric] as number : null
    const rule = baseline === null ? undefined : definition
    const delta = rule && baseline !== null ? value - baseline : null
    const distance = delta === null ? 0 : rule?.direction === 'below' ? Math.max(-delta, 0) : Math.abs(delta)
    const status = !rule ? 'not-evaluated' : distance >= rule.flagged ? 'flagged' : distance >= rule.attention ? 'attention' : 'baseline'
    const meta = input.provenance?.[metric]
    const document = { metric, value, unit: definition?.unit ?? 'mmHg', observedAt: input.at, evaluatedAt: new Date().toISOString(),
      source: 'simulated', method: meta?.method ?? 'unknown', quality: meta?.quality ?? 'unknown',
      ruleVersion: rule ? RULE_VERSION : null, baselineVersion: rule ? `${crewId}:${baselineVersion}` : null,
      baseline: rule ? baseline : null, delta, status, rule: rule ? { ...rule, baseline } : null,
      clinicalSource: null, referenceIds: ruleSet.referenceIds, retrospective,
      explanation: rule ? `Demo rule: ${rule.direction}, attention ${rule.attention}, flagged ${rule.flagged} ${rule.unit} from personal baseline ${baseline}.`
        : 'Value retained without evaluation: no personal baseline or demo rule for this metric.' }
    await db.query(`INSERT INTO medical_observations(checkin_id,crew_id,metric,rule_version,document)
      VALUES($1,$2,$3,$4,$5) ON CONFLICT(checkin_id,metric) DO NOTHING`, [checkinId, crewId, metric, RULE_VERSION, document])
  }
}

export async function observations(db: pg.Pool | pg.PoolClient, crewId: string, checkinId: string) {
  return (await db.query('SELECT document FROM medical_observations WHERE crew_id=$1 AND checkin_id=$2 ORDER BY metric', [crewId, checkinId])).rows.map(r => r.document)
}
