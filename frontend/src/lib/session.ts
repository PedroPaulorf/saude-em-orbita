import { apiRequest, ApiError, createClientId, checkInPayload, type Profile, type History, type Symptom } from './api'
import { cacheCheckIns, loadCheckIns, normalizeCheckIn, replaceCheckIns, saveCheckIn, rejectCheckIn, type CheckIn, type CheckInInput } from './storage'
import { setActiveProfile } from './active-profile'
export interface SessionState {
  profile: Profile | null; phase:'restoring'|'signed-out'|'ready'; busy:boolean; syncing:boolean
  checkins: CheckIn[]; symptoms: Symptom[]; error:string|null; truncated:boolean; historyLoaded:boolean
}
const initial = (): SessionState => ({profile:null,phase:'restoring',busy:false,syncing:false,checkins:[],symptoms:[],error:null,truncated:false,historyLoaded:false})
export class SessionController {
  private state = initial()
  private listeners = new Set<()=>void>()
  private epoch = 0
  private abort = new AbortController()
  private request: typeof apiRequest
  constructor(request: typeof apiRequest = apiRequest) { this.request = request }
  getSnapshot = () => this.state
  subscribe = (listener:()=>void) => { this.listeners.add(listener); return () => {this.listeners.delete(listener)} }
  private update(patch: Partial<SessionState>) { this.state={...this.state,...patch}; if ('profile' in patch) setActiveProfile(this.state.profile); this.listeners.forEach(l=>l()) }
  private reset() { this.abort.abort(); this.abort=new AbortController(); this.epoch++; this.state={...initial(),phase:'signed-out'}; setActiveProfile(null); this.update({}) }
  private valid(epoch:number, crewId?:string) { return epoch === this.epoch && (!crewId || this.state.profile?.id===crewId) }
  private failure(error:unknown, epoch:number) {
    if(!this.valid(epoch)) return
    if(error instanceof ApiError && error.status===401) { this.reset(); this.update({error:error.message}); return }
    this.update({error:error instanceof Error ? error.message : 'The request failed.'})
  }
  async restore() {
    try { if(localStorage.getItem('health7:signed-out')) { this.reset(); return } } catch { /* No stored session shortcut. */ }
    const epoch=this.epoch
    try {
      const profile=await this.request<Profile>('/me',undefined,this.abort.signal)
      if(!this.valid(epoch)) return
      this.update({profile,phase:'ready',checkins:loadCheckIns(profile.id)})
      await this.sync()
    } catch(error) {
      if(this.valid(epoch)) { this.reset(); this.update({error:error instanceof ApiError && error.status===401 ? null : 'Cannot verify your session. Connect to the server and sign in.'}) }
    }
  }
  async login(username:string,password:string) {
    if(this.state.busy) return
    this.broadcast()
    this.reset()
    const epoch=this.epoch
    this.update({busy:true,error:null})
    try {
      const result=await this.request<{profile:Profile}>('/auth/login',{username,password},this.abort.signal)
      if(!this.valid(epoch)) return
      try { localStorage.setItem('health7:signed-out','') } catch { /* Cookie remains authoritative. */ }
      this.update({profile:result.profile,phase:'ready',checkins:loadCheckIns(result.profile.id),busy:false})
      await this.sync()
    } catch(error) {
      if(this.valid(epoch)) this.update({busy:false,error:error instanceof ApiError && error.status===401 ? 'Incorrect username or password.' : error instanceof Error ? error.message : 'Sign in failed.'})
    }
  }
  invalidate = () => { this.reset(); this.update({error:'Your session changed in another tab. Sign in again.'}) }
  private broadcast() { try { localStorage.setItem('health7:auth-change',createClientId()) } catch { /* Ownership is also enforced by request headers. */ } }
  async logout() {
    const owner=this.state.profile?.id
    this.broadcast()
    try { localStorage.setItem('health7:signed-out','1') } catch { /* Server logout is attempted below. */ }
    this.reset()
    const epoch=this.epoch
    this.update({busy:true})
    try { await this.request('/auth/logout',{},this.abort.signal,owner) }
    catch(error) { if(this.valid(epoch) && !(error instanceof ApiError && error.status===401)) this.update({error:'Signed out on this device. The server could not confirm logout; reconnect before using a shared device.'}) }
    finally { if(this.valid(epoch)) this.update({busy:false}) }
  }
  async save(record:CheckInInput) {
    const profile=this.state.profile, epoch=this.epoch
    if(!profile) throw new Error('Sign in before saving a check-in.')
    const normalized=normalizeCheckIn(record)
    saveCheckIn(profile.id,normalized)
    this.update({checkins:loadCheckIns(profile.id),error:null})
    await this.sync()
    if(!this.valid(epoch,profile.id)) throw new Error('Your session changed. Sign in again before saving.')
    const result=loadCheckIns(profile.id).find(c=>c.clientId===normalized.clientId)
    if(result?.sync==='rejected') throw new Error(result.syncError ?? 'The server rejected this record. Review your answers and try again.')
    return result
  }
  async sync() {
    const profile=this.state.profile, epoch=this.epoch, signal=this.abort.signal
    if(!profile || this.state.syncing) return
    this.update({syncing:true,error:null})
    try {
      const current=await this.request<Profile>('/me',undefined,signal)
      if(!this.valid(epoch,profile.id)) return
      if(current.id!==profile.id) { this.invalidate(); return }
      for(const c of loadCheckIns(profile.id).filter(c=>c.sync==='pending')) {
        if(!this.valid(epoch,profile.id)) return
        try {
          const saved=await this.request<CheckIn>('/me/checkins',checkInPayload(c),signal,profile.id)
          if(!this.valid(epoch,profile.id)) return
          if(saved.clientId!==c.clientId || (saved.crewId && saved.crewId!==profile.id)) throw new ApiError('Invalid server acknowledgment. Record retained for retry.')
          replaceCheckIns(profile.id,[saved])
          this.update({checkins:loadCheckIns(profile.id)})
        } catch(error) {
          if(!this.valid(epoch,profile.id)) return
          if(error instanceof ApiError && error.status!==401 && !error.retryable) {
            rejectCheckIn(profile.id,c.clientId,`Record rejected (${error.status}). ${error.message}`)
            this.update({checkins:loadCheckIns(profile.id)})
            continue
          }
          throw error
        }
      }
      if(!this.valid(epoch,profile.id)) return
      const [checks,symptoms]=await Promise.all([
        this.request<History<CheckIn>>('/me/checkins?limit=100',undefined,signal,profile.id),
        this.request<History<Symptom>>('/me/symptoms?limit=100',undefined,signal,profile.id),
      ])
      if(!this.valid(epoch,profile.id)) return
      // Only unconfirmed records are merged with the authoritative current window.
      const pending=loadCheckIns(profile.id).filter(c=>c.sync!=='saved')
      const byId=new Map([...pending,...checks.items.map(c=>({...normalizeCheckIn(c),sync:'saved' as const}))].map(c=>[c.clientId,c]))
      this.update({checkins:[...byId.values()].sort((a,b)=>a.at.localeCompare(b.at)),symptoms:symptoms.items,
        truncated:checks.truncated||symptoms.truncated||!!symptoms.eventsTruncated,historyLoaded:true})
      cacheCheckIns(profile.id,checks.items)
    } catch(error) { this.failure(error,epoch) }
    finally { if(this.valid(epoch,profile.id)) this.update({syncing:false,checkins:this.state.historyLoaded ? this.state.checkins : loadCheckIns(profile.id)}) }
  }
}
export const session = new SessionController()
