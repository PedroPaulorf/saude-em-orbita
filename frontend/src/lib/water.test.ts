import { beforeEach, expect, test } from 'vitest'
import { addWater, loadWater } from './water'
beforeEach(()=>{
  const data=new Map<string,string>()
  Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{getItem:(k:string)=>data.get(k)??null,setItem:(k:string,v:string)=>data.set(k,v)}})
})
test('water cache never reuses another account or legacy shared values',()=>{
  localStorage.setItem('health7:water:v1',JSON.stringify({'2026-11-14':8}))
  addWater('a',1,'2026-11-14')
  expect(loadWater('a')).toEqual({'2026-11-14':1})
  expect(loadWater('b')).toEqual({})
})
test('a blocked storage read does not crash the profile screen',()=>{
  localStorage.getItem=()=>{throw new Error('Blocked')}
  expect(loadWater('new-crew')).toEqual({})
})
