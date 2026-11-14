import type { BodyRegionId } from '@/types'

export interface RiskGroup {
  title: string
  risks: string[]
}

/**
 * Riscos do NASA HRP ligados a cada região da figura do corpo (ids de hrp-risks.json).
 * O primeiro é o principal. Ligação feita pela equipe: revisar com quem cuida da pesquisa.
 */
export const REGION_RISKS: Record<BodyRegionId, RiskGroup> = {
  head: {
    title: 'Head · sleep and behavior',
    risks: [
      'inadequate-sleep-and-irregular-schedules',
      'behavioral-changes-and-psychiatric-disorders',
      'altered-sensorimotor-and-vestibular-function',
      'spaceflight-associated-neuro-ocular-syndrome-sans',
    ],
  },
  chest: { title: 'Chest · cardiovascular', risks: ['cardiovascular-adaptations', 'hypoxia'] },
  core: {
    title: 'Core · immune system',
    risks: ['altered-immune-system-responses', 'host-microorganism-interactions', 'inadequate-food-and-nutrition'],
  },
  leftArm: { title: 'Arms · fitness', risks: ['reduced-cardiorespiratory-and-musculoskeletal-fitness'] },
  rightArm: { title: 'Arms · fitness', risks: ['reduced-cardiorespiratory-and-musculoskeletal-fitness'] },
  leftLeg: { title: 'Legs · bones and muscles', risks: ['spaceflight-induced-bone-changes', 'reduced-cardiorespiratory-and-musculoskeletal-fitness'] },
  rightLeg: { title: 'Legs · bones and muscles', risks: ['spaceflight-induced-bone-changes', 'reduced-cardiorespiratory-and-musculoskeletal-fitness'] },
}

/** Aberto pelo cartão de clima espacial: o DONKI se liga ao risco de radiação. */
export const RADIATION_RISKS: RiskGroup = { title: 'Space radiation', risks: ['radiation-induced-cancers'] }
