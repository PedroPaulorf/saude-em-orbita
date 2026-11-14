/*
  Clima espacial no app: consulta ao vivo ao DONKI com cópia local para funcionar sem conexão.

  Ordem do que aparece na tela:
  1. Ao abrir: a cópia mais recente entre o localStorage e o JSON do repositório
     (src/data/donki-snapshot.json, gerado por `npm run data:donki`).
  2. Em seguida, a consulta ao vivo dos últimos 7 dias. Se der certo, substitui a cópia e é salva.
  3. Se falhar, a cópia continua na tela com a data dela.

  Modo histórico: mostra o SEP de 05/09/2026 do JSON do repositório (funciona sem conexão).
  A janela de 7 dias é uma regra de demonstração, não um critério da NASA.
*/
import { useCallback, useEffect, useState } from 'react'
import bundled from '@/data/donki-snapshot.json'
import { lastDays } from './api.ts'
import { fetchSnapshot, type DonkiSnapshot } from './snapshot.ts'

export * from './api.ts'
export * from './snapshot.ts'

export const LIVE_WINDOW_DAYS = 7
const CACHE_KEY = 'health7:donki:v2'

const BUNDLED_LIVE = bundled.live as DonkiSnapshot
export const HISTORY_SNAPSHOT = bundled.history as DonkiSnapshot

export type SpaceWeatherMode = 'live' | 'history'
/** live: consulta de agora · cache: cópia do navegador · bundled: cópia do repositório · history: evento passado. */
export type SpaceWeatherSource = 'live' | 'cache' | 'bundled' | 'history'

export interface SpaceWeatherState {
  source: SpaceWeatherSource
  snapshot: DonkiSnapshot
  /** Consulta ao vivo em andamento. */
  checking: boolean
  /** Motivo da última falha ao vivo, se houve. */
  error?: string
}

function readCache(): DonkiSnapshot | null {
  try {
    const c = JSON.parse(localStorage.getItem(CACHE_KEY) ?? 'null') as DonkiSnapshot | null
    return c?.fetchedAt && Array.isArray(c.sep) ? c : null
  } catch {
    return null
  }
}

function writeCache(s: DonkiSnapshot) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(s))
  } catch {
    // sem cache; segue
  }
}

/** A cópia mais nova disponível sem rede. */
function bestCopy(): Pick<SpaceWeatherState, 'source' | 'snapshot'> {
  const cache = readCache()
  return cache && Date.parse(cache.fetchedAt) > Date.parse(BUNDLED_LIVE.fetchedAt)
    ? { source: 'cache', snapshot: cache }
    : { source: 'bundled', snapshot: BUNDLED_LIVE }
}

export function useSpaceWeather() {
  const [mode, setMode] = useState<SpaceWeatherMode>('live')
  const [live, setLive] = useState<SpaceWeatherState>(() => ({ ...bestCopy(), checking: true }))

  const load = useCallback(async (signal: AbortSignal) => {
    // Desiste depois de 15 s e fica com a cópia.
    const request = AbortSignal.any([signal, AbortSignal.timeout(15_000)])
    try {
      const snapshot = await fetchSnapshot(lastDays(LIVE_WINDOW_DAYS), request)
      writeCache(snapshot)
      setLive({ source: 'live', snapshot, checking: false })
    } catch (err) {
      if (signal.aborted) return // componente desmontado
      setLive({ ...bestCopy(), checking: false, error: err instanceof Error ? err.message : String(err) })
    }
  }, [])

  useEffect(() => {
    const ctrl = new AbortController()
    // load só chama setState depois do await da rede, não de forma síncrona.
    // oxlint-disable-next-line react/set-state-in-effect
    void load(ctrl.signal)
    return () => ctrl.abort()
  }, [load])

  /** Nova consulta a pedido da pessoa. */
  const refresh = useCallback(() => {
    setLive((s) => ({ ...s, checking: true, error: undefined }))
    void load(new AbortController().signal)
  }, [load])

  const state: SpaceWeatherState =
    mode === 'history' ? { source: 'history', snapshot: HISTORY_SNAPSHOT, checking: false } : live

  return { state, mode, setMode, refresh }
}
