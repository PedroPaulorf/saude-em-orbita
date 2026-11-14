import { beforeEach, expect, test } from 'vitest'
import { SessionController } from './session'
import { ApiError, type Profile } from './api'
import { loadCheckIns, saveCheckIn } from './storage'
const profile = (id: string): Profile => ({id,displayName:id,missionDay:1,bodyModel:'male',source:'simulated',baseline:{heartRate:60,bloodPressure:110,bloodPressureDiastolic:70,sleep:8,temperature:36.5}})
const record = { clientId:'stable-id', at:new Date().toISOString(),source:'simulated' as const,vitals:{sleep:7},behavioral:{} }
beforeEach(() => {
  const data = new Map<string,string>()
  Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{getItem:(k:string)=>data.get(k)??null,setItem:(k:string,v:string)=>data.set(k,v)}})
})
test('late history from a prior account never appears after logout', async () => {
  let release!: (value: unknown) => void
  const wait = new Promise(resolve => { release=resolve })
  const controller = new SessionController((async (path: string) => {
    if(path === '/me') return profile('a')
    if(path === '/me/checkins?limit=100') return wait
    if(path === '/me/symptoms?limit=100') return {items:[],truncated:false}
  }) as never)
  const restoring=controller.restore()
  await new Promise(resolve=>setTimeout(resolve,0))
  await controller.logout()
  release({items:[record],truncated:false})
  await restoring
  expect(controller.getSnapshot().profile).toBeNull()
  expect(controller.getSnapshot().checkins).toEqual([])
  expect(loadCheckIns('a')).toEqual([])
})
test('a network failure preserves the clientId for retry; conflict is not retried', async () => {
  let fail = true
  const posted: unknown[]=[]
  const controller = new SessionController((async (path: string, body: unknown) => {
    if(path === '/me') return profile('a')
    if(path.startsWith('/me/checkins?')) return {items:[],truncated:false}
    if(path.startsWith('/me/symptoms?')) return {items:[],truncated:false}
    if(path === '/me/checkins') { posted.push(body); throw new ApiError('failure',fail?0:409) }
  }) as never)
  await controller.restore()
  saveCheckIn('a',record)
  await controller.sync()
  expect(loadCheckIns('a')[0].sync).toBe('pending')
  fail=false
  await controller.sync()
  expect(loadCheckIns('a')[0].sync).toBe('rejected')
  await controller.sync()
  expect(posted).toHaveLength(2)
  expect(posted[0]).toEqual(posted[1])
})

test('a confirmed save stays marked saved if the history refresh fails', async () => {
  let historyFails=false
  const controller=new SessionController((async(path:string)=>{
    if(path==='/me')return profile('a')
    if(path.startsWith('/me/checkins?')){if(historyFails)throw new ApiError('Offline');return {items:[],truncated:false}}
    if(path.startsWith('/me/symptoms?'))return {items:[],truncated:false}
    if(path==='/me/checkins')return {...record,id:'server-id'}
  }) as never)
  await controller.restore()
  historyFails=true
  await controller.save(record)
  expect(controller.getSnapshot().checkins[0].sync).toBe('saved')
  expect(controller.getSnapshot().error).toBe('Offline')
})
test('signed-out marker stops a failed logout from restoring the cookie session',async()=>{
  const controller=new SessionController((async(path:string)=>{
    if(path==='/me')return profile('a')
    if(path==='/auth/logout')throw new ApiError('Offline')
    return {items:[],truncated:false}
  }) as never)
  await controller.restore()
  await controller.logout()
  await controller.restore()
  expect(controller.getSnapshot().profile).toBeNull()
})

test('save reports a permanent rejection so the form can retain and correct its answers', async () => {
  const controller = new SessionController((async (path: string) => {
    if (path === '/me') return profile('a')
    if (path === '/me/checkins') throw new ApiError('Invalid measurement', 400)
    return { items: [], truncated: false }
  }) as never)
  await controller.restore()
  await expect(controller.save(record)).rejects.toThrow(/rejected/i)
  expect(loadCheckIns('a')[0].sync).toBe('rejected')
})

test('rate limiting and invalid acknowledgment keep a stable pending payload for its owner', async () => {
  let limited = true
  const posted: unknown[] = []
  const controller = new SessionController((async (path: string, body: unknown) => {
    if (path === '/me') return profile('a')
    if (path === '/me/checkins') {
      posted.push(body)
      if (limited) throw new ApiError('Try later', 429)
      return { ...record, crewId: 'b' }
    }
    return { items: [], truncated: false }
  }) as never)
  await controller.restore()
  saveCheckIn('a', record)
  await controller.sync()
  expect(loadCheckIns('a')[0].sync).toBe('pending')
  limited = false
  await controller.sync()
  expect(loadCheckIns('a')[0].sync).toBe('pending')
  expect(posted[0]).toEqual(posted[1])
  expect(loadCheckIns('b')).toEqual([])
  expect(controller.getSnapshot().error).toMatch(/acknowledgment/i)
})
