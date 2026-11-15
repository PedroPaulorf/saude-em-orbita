import { describe, expect, it } from 'vitest'
import { duration, monthBounds, monthCells, periodOnDate, shiftMonth, type MenstrualPeriod } from './menstrual'
const period: MenstrualPeriod = { id: 'fixture', clientId: 'fixture', version: 1, source: 'self-reported', createdAt: '', updatedAt: '', startDate: '2024-02-28', endDate: '2024-03-02', flow: 'light', pain: null, symptoms: [], note: '' }
describe('calendar date calculations', () => {
  it('handles leap years, padded weeks and year boundaries without local timezone conversion', () => {
    expect(monthBounds('2024-02')).toEqual({ from: '2024-02-01', to: '2024-02-29' })
    expect(monthBounds('2023-02').to).toBe('2023-02-28')
    expect(shiftMonth('2024-01', -1)).toBe('2023-12')
    expect(shiftMonth('2024-12', 1)).toBe('2025-01')
    const cells = monthCells('2024-02')
    expect(cells.slice(0, 4)).toEqual([null, null, null, null])
    expect(cells.filter(Boolean)).toHaveLength(29)
    expect(cells.length % 7).toBe(0)
  })
  it('marks recorded dates inclusively across months and counts elapsed days', () => {
    expect(duration(period, '2024-03-31')).toBe(4)
    expect(periodOnDate([period], '2024-02-29', '2024-03-31')).toBe(period)
    expect(periodOnDate([period], '2024-03-02', '2024-03-31')).toBe(period)
    expect(periodOnDate([period], '2024-03-03', '2024-03-31')).toBeUndefined()
  })
  it('ongoing records end visually at today and never paint future days', () => {
    const ongoing = { ...period, endDate: null }
    expect(duration(ongoing, '2024-03-01')).toBe(3)
    expect(periodOnDate([ongoing], '2024-03-01', '2024-03-01')).toBe(ongoing)
    expect(periodOnDate([ongoing], '2024-03-02', '2024-03-01')).toBeUndefined()
  })
})
