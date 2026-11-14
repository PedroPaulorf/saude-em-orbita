/** Leitura dos campos do check-up de saúde. */

/** Pressão no formato "118/76"; o resto, número positivo com ponto ou vírgula. */
export function parseMeasure(id: string, raw: string): { value: number; diastolic?: number } | null {
  const text = raw.trim().replace(',', '.')
  if (id === 'bloodPressure') {
    const m = /^(\d{2,3})\s*\/\s*(\d{2,3})$/.exec(text)
    return m ? { value: Number(m[1]), diastolic: Number(m[2]) } : null
  }
  const n = Number(text)
  return text !== '' && Number.isFinite(n) && n > 0 ? { value: n } : null
}

export function measureError(id: string) {
  return id === 'bloodPressure' ? 'Type it as systolic/diastolic, for example 118/76.' : 'Type a number.'
}
