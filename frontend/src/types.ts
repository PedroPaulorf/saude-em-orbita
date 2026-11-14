/** Estado de uma medida em relação à linha de base da pessoa. Não crie um quarto estado. */
export type Status = 'baseline' | 'attention' | 'flagged'

/** De onde vem um dado ou uma regra. */
export type Source = 'simulated' | 'demo' | 'live'

/** Estado da comunicação com o solo. */
export type Connection = 'offline' | 'queued' | 'online'

export type VitalId = 'heartRate' | 'bloodPressure' | 'sleep' | 'temperature'

export interface Vital {
  observed?: boolean
  at?: string
  id: VitalId
  label: string
  unit: string
  /** Valor exibido, já formatado (ex.: "118/76"). */
  value: string
  /** Linha de base exibida (ex.: "116/74"). */
  baseline: string
  /** Diferença exibida, com sinal (ex.: "+9", "−2.1"). */
  delta: string
  status: Status
  /** Últimos 7 dias, para o VitalCard em linha de tendência. */
  history?: number[]
  /** Valor numérico da linha de base, para o tracejado do gráfico. */
  baselineValue?: number
  /** Regra que gerou o estado, mostrada no relatório. */
  rule?: string
}

export type BodyRegionId = 'head' | 'chest' | 'core' | 'leftArm' | 'rightArm' | 'leftLeg' | 'rightLeg'

export interface BodyRegion {
  observed?: boolean
  id: BodyRegionId
  /** Rótulo ao lado da figura (ex.: "Chest · cardiovascular"); a tela decide a caixa. */
  name?: string
  /** Frase do estado (ex.: "Attention · +9 bpm"). Só regiões com name ganham rótulo. */
  stateText?: string
  status: Status
}

export interface CrewMember {
  id: string
  displayName: string
  missionDay: number
}
