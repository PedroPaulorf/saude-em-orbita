/*
  Tripulação (passo 4): os colegas da mesma tripulação vêm de GET /crew, e o estado de cada um sai do
  mesmo motor de monitoramento (monitor.ts) que o app usa para a própria pessoa. A barra mostra só o
  estado e o "baseline match" (100 − score). Nenhuma medida dos colegas aparece na tela.

  Quem está logado usa os dados da própria sessão (useMonitor), para a barra mudar na hora do check-up.
*/
import { useEffect, useMemo, useState } from 'react'
import { apiRequest, ApiError, type Profile, type Symptom } from './api'
import { monitor, type MonitorResult, type MonitorState } from './monitor'
import { initials } from './person'
import { session } from './session'
import type { CheckInInput } from './storage'

interface CrewRecord {
  profile: Profile
  self: boolean
  checkins: CheckInInput[]
  symptoms: Symptom[]
}

export interface CrewMate {
  id: string
  /** "NX-04" ou o nome de exibição. */
  label: string
  initials: string
  role?: string
  self: boolean
  day: number
  state: MonitorState
  /** 0 a 100: quanto hoje está perto da linha de base da pessoa (100 − score do motor). */
  match: number
  /** Fez check-up hoje? Sem check-up, o estado é o padrão e a barra fica marcada como sem dado. */
  observed: boolean
}

/** 100 − score: o score do motor é intensidade de mudança, nunca probabilidade. */
export const baselineMatch = (score: number) => Math.max(0, Math.min(100, 100 - Math.round(score)))

export function toMate(profile: Profile, result: Pick<MonitorResult, 'state' | 'score' | 'day' | 'observed'>, self: boolean): CrewMate {
  const label = profile.nexus?.crewId ?? profile.displayName
  return {
    id: profile.id,
    label,
    // NEXUS: o número do tripulante ("04"); demo: as iniciais do nome.
    initials: profile.nexus?.crewId.replace(/\D/g, '') || initials(label),
    role: profile.nexus?.role,
    self,
    day: result.day,
    state: result.state,
    match: baselineMatch(result.score),
    observed: result.observed,
  }
}

/** Colegas de tripulação com o estado de hoje. `me` é o resultado do motor da própria sessão. */
export function useCrew(profile: Profile, me: MonitorResult | null): CrewMate[] {
  const [records, setRecords] = useState<CrewRecord[] | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    const load = () =>
      apiRequest<{ items: CrewRecord[] }>('/crew', undefined, controller.signal, profile.id)
        .then((r) => setRecords(r.items))
        .catch((e) => {
          if (controller.signal.aborted) return
          if (e instanceof ApiError && e.status === 401) session.invalidate()
          // Sem conexão: a barra mostra só a própria pessoa.
        })
    void load()
    // Os colegas fazem check-up em outros aparelhos: atualiza a cada 2 minutos.
    const timer = window.setInterval(load, 120000)
    return () => {
      controller.abort()
      window.clearInterval(timer)
    }
  }, [profile.id])

  return useMemo(() => {
    const mates = (records ?? []).filter((r) => !r.self).map((r) => toMate(r.profile, monitor({ profile: r.profile, checkins: r.checkins, symptoms: r.symptoms }), false))
    const self = me ? [toMate(profile, me, true)] : []
    // Ordem da tripulação (NX-01, NX-02...), com a própria pessoa no lugar dela.
    return [...self, ...mates].sort((a, b) => a.label.localeCompare(b.label, 'en', { numeric: true }))
  }, [records, me, profile])
}
