import { expect, test } from 'vitest'
import { aiFailureMessage } from './ai-error'

test('connection failures explain that check-ups continue and a retry is available', () => {
  for (const error of [new TypeError('Failed to fetch'), new Error('HTTP 503'), new Error('Empty reply')]) {
    expect(aiFailureMessage(error)).toContain('AI is temporarily unavailable')
    expect(aiFailureMessage(error)).toContain('check-ups remain available')
    expect(aiFailureMessage(error)).toContain('Try again')
  }
})

test('timeout is distinguished from other failures without exposing internal details', () => {
  expect(aiFailureMessage(new DOMException('private details', 'TimeoutError'))).toContain('too long')
  expect(aiFailureMessage(new Error('private details'))).not.toContain('private details')
})
