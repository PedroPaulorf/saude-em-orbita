/*
  Health notes: até três frases curtas, geradas por REGRA DE DEMONSTRAÇÃO (plano v2, seção 7.5).
  A nota diz o fato e leva para onde a pessoa age. Não dá conselho: a orientação vem do texto da
  NASA ("What can be done"), mostrado no Detailed stats.
*/
import type { BodyRegionId, Status, Vital, VitalId } from '@/types'

export type NoteKind = 'pending' | 'measure' | 'space' | 'water' | 'calm'

export type NoteAction =
  | { kind: 'href'; href: string; label: string }
  | { kind: 'weather'; label: string }
  | { kind: 'routine'; label: string }

export interface Note {
  id: string
  kind: NoteKind
  /** Estado, quando a nota vem de uma medida (para ícone e cor). */
  status?: Status
  text: string
  action?: NoteAction
}

export const VITAL_REGION: Record<VitalId, BodyRegionId> = {
  sleep: 'head',
  heartRate: 'chest',
  bloodPressure: 'chest',
  temperature: 'core',
  spo2: 'chest',
  respiratoryRate: 'chest',
  bodyMass: 'core',
}

/** "Sleep is 2.1 h below your baseline." A partir do delta já formatado ("−2.1", "+9"). */
export function measureSentence(v: Vital) {
  const negative = /^[−-]/.test(v.delta)
  const amount = v.delta.replace(/^[+−-]/, '')
  return `${v.label} is ${amount} ${v.unit} ${negative ? 'below' : 'above'} your baseline.`
}

export interface NotesInput {
  vitals: Vital[]
  healthDoneToday: boolean
  /** Data ISO do evento de partículas solares na janela, se houver. */
  sepTime?: string
  /** "05 Sep" já formatado. */
  sepDay?: string
  water: { servings: number; goal: number }
}

const SEVERITY: Record<Status, number> = { baseline: 0, attention: 1, flagged: 2 }

export function buildNotes({ vitals, healthDoneToday, sepTime, sepDay, water }: NotesInput, max = 3): Note[] {
  const notes: Note[] = []

  if (!healthDoneToday) {
    notes.push({
      id: 'pending',
      kind: 'pending',
      text: "Today's health check-up is pending.",
      action: { kind: 'href', href: '#/check/health', label: 'Start check-up' },
    })
  }

  const off = vitals.filter((v) => v.status !== 'baseline').sort((a, b) => SEVERITY[b.status] - SEVERITY[a.status])
  const measureNote = (v: Vital): Note => ({
    id: `measure-${v.id}`,
    kind: 'measure',
    status: v.status,
    text: measureSentence(v),
    action: { kind: 'href', href: `#/stats?region=${VITAL_REGION[v.id]}`, label: `See ${v.label.toLowerCase()}` },
  })

  // Nada fora da linha de base: diz isso logo, para não sumir no corte de três.
  if (off.length === 0) {
    notes.push({ id: 'calm', kind: 'calm', status: 'baseline', text: 'All measures within your baseline.' })
  }

  // Sinalizadas primeiro, depois o clima espacial, depois as em atenção, depois a água.
  off.filter((v) => v.status === 'flagged').forEach((v) => notes.push(measureNote(v)))
  if (sepTime) {
    notes.push({
      id: 'sep',
      kind: 'space',
      text: `Solar particle event detected on ${sepDay}.`,
      action: { kind: 'weather', label: 'Space weather details' },
    })
  }
  off.filter((v) => v.status === 'attention').forEach((v) => notes.push(measureNote(v)))

  if (water.servings < water.goal) {
    notes.push({
      id: 'water',
      kind: 'water',
      text: `${water.servings} of ${water.goal} water servings logged today.`,
      action: { kind: 'routine', label: 'Log water' },
    })
  }

  return notes.slice(0, max)
}
