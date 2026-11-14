import { useSyncExternalStore } from 'react'
export const WATER_GOAL = 8
export const WATER_SERVING_ML = 250
export const WATER_MAX = WATER_GOAL * 2
export type WaterLog = Record<string, number>
export const utcDayKey = (d = new Date()) => d.toISOString().slice(0, 10)
const listeners = new Set<()=>void>()
const cache = new Map<string,{raw:string|null;log:WaterLog}>()
const key = (crewId:string)=>`health7:water:v2:${encodeURIComponent(crewId)}`
export function loadWater(crewId:string):WaterLog {
  let raw:string|null=null
  try { raw=localStorage.getItem(key(crewId)) } catch {
    const existing=cache.get(crewId)
    if(existing) return existing.log
    cache.set(crewId,{raw:null,log:{}})
    return cache.get(crewId)!.log
  }
  const old=cache.get(crewId)
  if(old && raw===old.raw) return old.log
  let log:WaterLog={}
  try { const parsed=JSON.parse(raw??'{}'); if(parsed && typeof parsed==='object'&&!Array.isArray(parsed)) log=parsed } catch { /* Corrupt data is not a measurement. */ }
  cache.set(crewId,{raw,log}); return log
}
export function addWater(crewId:string,delta:number,day=utcDayKey()) {
  const log=loadWater(crewId), next=Math.max(0,Math.min(WATER_MAX,(log[day]??0)+delta))
  try { localStorage.setItem(key(crewId),JSON.stringify({...log,[day]:next})) }
  catch { throw new Error('Water was not saved. Allow browser storage or free space and try again.') }
  listeners.forEach(l=>l()); return next
}
function subscribe(cb:()=>void) { listeners.add(cb); window.addEventListener('storage',cb); return()=>{listeners.delete(cb);window.removeEventListener('storage',cb)} }
export function useWaterLog(crewId:string) { return useSyncExternalStore(subscribe,()=>loadWater(crewId)) }
