/*
  Ícone e cor de cada um dos sete parâmetros. Cada um leva uma cor da marca, para a tela não ficar
  só azul; o ESTADO continua no selo com ícone e palavra (StatusBadge), nunca só na cor.
*/
import { Droplet, Gauge, HeartPulse, Moon, Thermometer, Toilet, Wind, type LucideIcon } from 'lucide-react'
import type { ParamId } from '@/lib/baselines'
import type { BodyRegionId } from '@/types'

export interface ParamMeta {
  label: string
  short: string
  Icon: LucideIcon
  /** Classes do quadrado do ícone: fundo a ~15% e ícone na cor cheia. */
  tint: string
  region: BodyRegionId
}

export const PARAM_META: Record<ParamId, ParamMeta> = {
  bloodPressure: { label: 'Blood pressure', short: 'BP', Icon: Gauge, tint: 'bg-sa-rocket/15 text-sa-rocket-300', region: 'chest' },
  heartRate: { label: 'Heart rate', short: 'HR', Icon: HeartPulse, tint: 'bg-sa-rocket/20 text-sa-rocket-300', region: 'chest' },
  spo2: { label: 'Oxygen saturation', short: 'SpO₂', Icon: Droplet, tint: 'bg-sa-yonder/15 text-sa-yonder', region: 'chest' },
  temperature: { label: 'Temperature', short: 'Temp', Icon: Thermometer, tint: 'bg-sa-yellow/15 text-sa-yellow', region: 'core' },
  respiratoryRate: { label: 'Respiratory rate', short: 'RR', Icon: Wind, tint: 'bg-sa-yonder/15 text-sa-yonder-200', region: 'chest' },
  sleep: { label: 'Sleep', short: 'Sleep', Icon: Moon, tint: 'bg-sa-neon-blue/25 text-sa-yonder-200', region: 'head' },
  bodyMass: { label: 'Body mass', short: 'Mass', Icon: Gauge, tint: 'bg-sa-yonder/15 text-sa-yonder', region: 'core' },
  elimination: { label: 'Urine & stool', short: 'Urine/stool', Icon: Toilet, tint: 'bg-sa-yellow/15 text-sa-yellow', region: 'core' },
}
