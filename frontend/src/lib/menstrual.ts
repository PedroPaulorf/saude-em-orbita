export interface MenstrualInput {
  startDate: string; endDate: string | null
  flow: 'unspecified' | 'spotting' | 'light' | 'moderate' | 'heavy'
  pain: number | null; symptoms: string[]; note: string
}
export interface MenstrualPeriod extends MenstrualInput {
  id: string; clientId: string; version: number; source: 'self-reported'; createdAt: string; updatedAt: string
}
export interface MenstrualHistory { crewId: string; from: string; to: string; today: string; items: MenstrualPeriod[]; truncated: boolean }
export const cycleSymptoms = ['cramps', 'headache', 'fatigue', 'bloating', 'breast-tenderness', 'mood-change'] as const
export function shiftMonth(month: string, delta: number) {
  const date = new Date(month + '-01T00:00:00Z'); date.setUTCMonth(date.getUTCMonth() + delta)
  return date.toISOString().slice(0, 7)
}
export function monthBounds(month: string) {
  const next = new Date(shiftMonth(month, 1) + '-01T00:00:00Z'); next.setUTCDate(0)
  return { from: month + '-01', to: next.toISOString().slice(0, 10) }
}
export function monthCells(month: string): (string | null)[] {
  const { from, to } = monthBounds(month), offset = new Date(from + 'T00:00:00Z').getUTCDay()
  const cells: (string | null)[] = [...Array(offset).fill(null), ...Array.from({ length: Number(to.slice(-2)) }, (_, i) => month + '-' + String(i + 1).padStart(2, '0'))]
  while (cells.length % 7) cells.push(null)
  return cells
}
export function periodOnDate(items: MenstrualPeriod[], date: string, today: string) {
  return items.find(item => date >= item.startDate && date <= (item.endDate ?? today))
}
export function duration(period: MenstrualInput, today: string) {
  return Math.round((Date.parse((period.endDate ?? today) + 'T00:00:00Z') - Date.parse(period.startDate + 'T00:00:00Z')) / 86400000) + 1
}
export function displayDate(date: string) {
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(date + 'T00:00:00Z'))
}
