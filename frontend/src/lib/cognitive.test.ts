import { expect, test } from 'vitest'
import { compareReaction, median, shuffle, type CognitiveResult } from './cognitive'

const session = (ms: number): CognitiveResult => ({ at: new Date().toISOString(), reaction: { trials: [ms], median: ms, jumpStarts: 0 } })

test('median of reaction trials', () => {
  expect(median([300, 250, 280])).toBe(280)
  expect(median([300, 250])).toBe(275)
  expect(median([])).toBeNaN()
})

test('reaction is compared with the person only after 3 earlier sessions', () => {
  expect(compareReaction([session(280), session(300)], 320).baseline).toBeUndefined()
  const c = compareReaction([session(280), session(300), session(290)], 320)
  expect(c.baseline).toBe(290)
  expect(c.sessions).toBe(3)
})

test('shuffle keeps every item once', () => {
  const xs = Array.from({ length: 16 }, (_, i) => i)
  const out = shuffle(xs)
  expect([...out].sort((a, b) => a - b)).toEqual(xs)
  expect(xs).toEqual(Array.from({ length: 16 }, (_, i) => i)) // não mexe no original
})
