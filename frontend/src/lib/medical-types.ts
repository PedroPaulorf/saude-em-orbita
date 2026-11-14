export interface Provenance { method: 'manual' | 'simulated-device' | 'unknown'; quality: 'simulated' | 'unknown' }
export interface MedicalObservation {
  metric: string; value: number; unit: string; observedAt: string; evaluatedAt: string
  method: string; quality: string; ruleVersion: string | null; baselineVersion: string | null
  baseline: number | null; delta: number | null; status: string; explanation: string
  retrospective: boolean; clinicalSource: null
}
