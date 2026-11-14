/** Leitura dos campos do check-up de saúde. Faixas só para pegar erro de digitação, não são limites clínicos. */

const RANGES: Record<string, [number, number]> = {
  heartRate: [20, 250],
  spo2: [50, 100],
  temperature: [30, 43],
  respiratoryRate: [4, 60],
  sleep: [0, 24],
}

/** Pressão no formato "118/76"; o resto, número com ponto ou vírgula dentro da faixa do campo. */
export function parseMeasure(id: string, raw: string): { value: number; diastolic?: number } | null {
  const text = raw.trim().replace(',', '.')
  if (id === 'bloodPressure') {
    const m = /^(\d{2,3})\s*\/\s*(\d{2,3})$/.exec(text)
    return m ? { value: Number(m[1]), diastolic: Number(m[2]) } : null
  }
  const n = Number(text)
  const [min, max] = RANGES[id] ?? [0, 1000]
  const validRange = id === 'sleep' ? n >= min && n <= max : n > 0 && n >= min && n <= max
  return text !== '' && Number.isFinite(n) && validRange ? { value: n } : null
}

export function measureError(id: string) {
  if (id === 'bloodPressure') return 'Type it as systolic/diastolic, for example 118/76.'
  const range = RANGES[id]
  return range ? `Type a number from ${range[0]} to ${range[1]}.` : 'Type a number greater than 0 and no more than 1000.'
}
