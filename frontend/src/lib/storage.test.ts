import { beforeEach, expect, test } from 'vitest'
import { loadCheckIns, saveCheckIn, replaceCheckIns, cacheCheckIns } from './storage'

beforeEach(() => {
  const data = new Map<string, string>()
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => data.set(key, value),
  } })
})
const record = { clientId: 'unique-record', at: '2026-11-14T14:00:00Z', source: 'simulated' as const, vitals: { sleep: 7 }, behavioral: {} }
test('keeps pending records isolated and ignores unowned legacy records', () => {
  localStorage.setItem('health7:checkins:v1', JSON.stringify([record]))
  saveCheckIn('crew-a', record)
  expect(loadCheckIns('crew-b')).toEqual([])
  expect(loadCheckIns('crew-a')).toEqual([{ ...record, kind: 'health', sync: 'pending', provenance: { sleep: { method: 'manual', quality: 'simulated' } } }])
})
test('merges idempotent server acknowledgments without discarding queued writes', () => {
  saveCheckIn('crew-a', record)
  saveCheckIn('crew-a', { ...record, clientId: 'second' })
  replaceCheckIns('crew-a', [{ ...record, id: 'server-id' }])
  expect(loadCheckIns('crew-a')).toHaveLength(2)
  expect(loadCheckIns('crew-a').find(x => x.clientId === record.clientId)?.sync).toBe('saved')
})
test('surfaces local storage failures', () => {
  localStorage.setItem = () => { throw new Error('Quota exceeded') }
  expect(() => saveCheckIn('crew-a', record)).toThrow(/save/i)
})

test('an authoritative empty server window drops stale saved cache but keeps unconfirmed records',()=>{
  saveCheckIn('a',record)
  replaceCheckIns('a',[record])
  saveCheckIn('a',{...record,clientId:'pending'})
  cacheCheckIns('a',[])
  expect(loadCheckIns('a').map(c=>c.clientId)).toEqual(['pending'])
})

test('persisted provenance is stable across retries and isolated from another account', () => {
  saveCheckIn('a', record)
  const first = loadCheckIns('a')[0]
  saveCheckIn('a', { ...record, provenance: { sleep: { method: 'unknown', quality: 'unknown' } } })
  expect(loadCheckIns('a')[0]).toEqual(first)
  expect(first.provenance?.sleep).toEqual({ method: 'manual', quality: 'simulated' })
  expect(loadCheckIns('b')).toEqual([])
})

test('a malformed stored history cannot be silently overwritten by a new record', () => {
  const key = 'health7:checkins:v2:a'
  localStorage.setItem(key, '{broken')
  expect(() => saveCheckIn('a', record)).toThrow(/save/i)
  expect(localStorage.getItem(key)).toBe('{broken')
})
