import type { DatabaseSync } from 'node:sqlite'
import type { CheckInInput } from './contracts.js'

export const RULE_VERSION = 'health7-demo-2026-11-14-v1'
export const references = [
  { id: '20220017869', title: 'ExMC Clinical Decision Support System Architecture Recommendation', topic: 'MDA', role: 'architecture', summary: 'Integrated medical data as a foundation for decision support.' },
  { id: '20250000009', title: 'Earth-Independent Medical Operations Concept of Operations', topic: 'EIMO', role: 'operations', summary: 'Progressive autonomy with communication delays and limited resources.' },
  { id: '20180002541', title: 'Autonomous Medical Operations', topic: 'AMO', role: 'research', summary: 'Research on medical decision support, including ultrasound interpretation.' },
  { id: '20180006877', title: 'Validation of the NASA Integrated Medical Model', topic: 'IMM', role: 'methodology', summary: 'Monte Carlo mission modeling and comparison with observed medical events.' },
].map((r) => ({ ...r, url: `https://ntrs.nasa.gov/citations/${r.id}`, clinicalThresholdEvidence: false }))

type Direction = 'both' | 'below'
export const rules: Record<string, { unit: string; baseline: number; attention: number; flagged: number; direction: Direction }> = {
  heartRate: { unit: 'bpm', baseline: 62, attention: 5, flagged: 15, direction: 'both' },
  bloodPressure: { unit: 'mmHg', baseline: 116, attention: 10, flagged: 20, direction: 'both' },
  sleep: { unit: 'h', baseline: 7.2, attention: 1, flagged: 2, direction: 'below' },
  temperature: { unit: '°C', baseline: 36.6, attention: 0.5, flagged: 1, direction: 'both' },
  spo2: { unit: '%', baseline: 97, attention: 2, flagged: 4, direction: 'below' },
  respiratoryRate: { unit: 'breaths/min', baseline: 14, attention: 3, flagged: 6, direction: 'both' },
  bodyMass: { unit: 'kg', baseline: 74, attention: 1, flagged: 2, direction: 'below' },
}

export function initializeMedical(db: DatabaseSync) {
  db.exec(`CREATE TABLE IF NOT EXISTS medical_references (id TEXT PRIMARY KEY, document TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS medical_rules (version TEXT PRIMARY KEY, document TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS observations (
      checkin_id TEXT NOT NULL REFERENCES checkins(id), metric TEXT NOT NULL,
      rule_version TEXT NOT NULL REFERENCES medical_rules(version), document TEXT NOT NULL,
      PRIMARY KEY(checkin_id, metric));
    CREATE TABLE IF NOT EXISTS mission_simulations (
      id TEXT PRIMARY KEY, created_at TEXT NOT NULL, input TEXT NOT NULL, result TEXT NOT NULL);`)
  for (const ref of references) db.prepare('INSERT OR IGNORE INTO medical_references VALUES (?, ?)').run(ref.id, JSON.stringify(ref))
  db.prepare('INSERT OR IGNORE INTO medical_rules VALUES (?, ?)').run(RULE_VERSION, JSON.stringify({
    version: RULE_VERSION, baselineVersion: 'crew-02-demo-v1', simulated: true,
    clinicalSource: null, referenceIds: references.map((r) => r.id),
    notice: 'Architecture and methodology references only. No clinical validation. Blood pressure status uses systolic only.', rules,
  }))
}

/** Snapshot of the rule, baseline, provenance and result at ingestion. Never recompute old results. */
export function storeObservations(db: DatabaseSync, checkinId: string, input: CheckInInput, legacy = false) {
  const ruleSet = JSON.parse(db.prepare('SELECT document FROM medical_rules WHERE version = ?').get(RULE_VERSION)!.document as string)
  const crew = db.prepare('SELECT crew.id, crew.profile FROM crew JOIN checkins ON crew.id = checkins.crew_id WHERE checkins.id = ?').get(checkinId)!
  const profile = JSON.parse(crew.profile as string)
  for (const [metric, value] of Object.entries(input.vitals)) {
    const baseline = profile.baseline?.[metric] as number | undefined
    const rule = baseline === undefined ? undefined : ruleSet.rules[metric] as typeof rules[string] | undefined
    const meta = input.provenance?.[metric]
    const delta = baseline === undefined ? null : value - baseline
    const distance = delta === null ? 0 : rule?.direction === 'below' ? Math.max(-delta, 0) : Math.abs(delta)
    const status = !rule ? 'not-evaluated' : distance >= rule.flagged ? 'flagged' : distance >= rule.attention ? 'attention' : 'baseline'
    const document = { metric, value, unit: rules[metric]?.unit ?? 'mmHg', observedAt: new Date(input.at).toISOString(),
      source: 'simulated', method: meta?.method ?? 'unknown', quality: meta?.quality ?? 'unknown',
      ruleVersion: rule ? RULE_VERSION : null, baselineVersion: rule ? profile.baselineVersion ?? `${crew.id}-legacy-baseline` : null,
      baseline: rule ? baseline : null, delta: rule ? delta : null, status, rule: rule ? { ...rule, baseline } : null,
      clinicalSource: null, referenceIds: ruleSet.referenceIds,
      explanation: rule ? `Demo rule: ${rule.direction}, attention ${rule.attention}, flagged ${rule.flagged} ${rule.unit} from baseline ${baseline}.`
        : 'Value retained without evaluation: no baseline or demo rule for this metric.',
      ingestedFromLegacy: legacy }
    db.prepare('INSERT OR IGNORE INTO observations VALUES (?, ?, ?, ?)').run(checkinId, metric, RULE_VERSION, JSON.stringify(document))
  }
}

export function observations(db: DatabaseSync, checkinId: string) {
  return db.prepare('SELECT document FROM observations WHERE checkin_id = ? ORDER BY metric').all(checkinId)
    .map((r) => JSON.parse(r.document as string))
}
