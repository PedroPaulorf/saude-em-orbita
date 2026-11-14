/*
  Frases da barra do companheiro (o botão fixo da IA). Puxam assunto a partir do dia da pessoa,
  sem avaliar a saúde: lembram, perguntam e convidam para o chat. Cada frase leva a expressão do rosto.
*/
import type { Vital } from '@/types'

export type Mood = 'happy' | 'curious' | 'thinking' | 'caring' | 'wink'

export interface Line {
  text: string
  mood: Mood
}

export function companionLines(args: {
  name: string
  vitals: Vital[]
  healthDone: boolean
  moodDone: boolean
  water: number
  waterGoal: number
}): Line[] {
  const { name, vitals, healthDone, moodDone, water, waterGoal } = args
  const off = (id: string) => vitals.find((v) => v.id === id && v.observed !== false && v.status !== 'baseline')
  const lines: Line[] = [
    { text: 'Need help, astronaut?', mood: 'curious' },
    { text: `How are you doing today, ${name}?`, mood: 'happy' },
  ]
  if (!healthDone) lines.push({ text: 'Ready for today’s check-up? About two minutes.', mood: 'curious' })
  if (!moodDone) lines.push({ text: 'Got a minute for a quick mood check?', mood: 'happy' })
  if (off('sleep')) lines.push({ text: 'Remember to focus on your sleep tonight.', mood: 'caring' })
  if (off('heartRate')) lines.push({ text: 'Take it easy between tasks today.', mood: 'caring' })
  if (vitals.some((v) => v.status === 'flagged' && v.observed !== false))
    lines.push({ text: 'Your flight surgeon can see today’s report.', mood: 'thinking' })
  if (water < waterGoal) lines.push({ text: `Had some water lately? ${water} of ${waterGoal} so far.`, mood: 'thinking' })
  lines.push({ text: 'Thinking about your roadmap…', mood: 'thinking' })
  lines.push({ text: 'I’m here if you want to talk.', mood: 'wink' })
  return lines
}
