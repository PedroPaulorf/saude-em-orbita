import { afterEach, expect, test, vi } from 'vitest'
import { apiBase, apiRequest, createClientId } from './api'
afterEach(()=>vi.unstubAllGlobals())
test('default API follows the frontend hostname including IPv6',()=>{
  expect(apiBase(undefined,{protocol:'http:',hostname:'192.168.1.10'} as Location)).toBe('http://192.168.1.10:3001/api/v1')
  expect(apiBase(undefined,{protocol:'http:',hostname:'[::1]'} as Location)).toBe('http://[::1]:3001/api/v1')
})
test('sends cookies CSRF and captured identity with mutations',async()=>{
  let sent:RequestInit|undefined
  vi.stubGlobal('window',{location:{protocol:'http:',hostname:'localhost'}})
  vi.stubGlobal('fetch',async (_url:string,init:RequestInit)=>{sent=init;return new Response('{}',{status:201})})
  await apiRequest('/me/checkins',{clientId:'a'},undefined,'crew-a')
  expect(sent?.credentials).toBe('include')
  expect(sent?.headers).toEqual({'Content-Type':'application/json','X-Requested-With':'Health7','X-Health7-Crew':'crew-a'})
})

test('creates UUIDs on a LAN origin without randomUUID support',()=>{
  const id=createClientId({getRandomValues:(bytes:Uint8Array)=>{bytes.fill(5);return bytes}} as unknown as Crypto)
  expect(id).toMatch(/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/)
})
