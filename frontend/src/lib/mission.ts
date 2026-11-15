/*
  Missão escolhida pelo tripulante depois do perfil (passo 2). Contrato compartilhado com o timelapse
  (passo 3, lê durationDays) e com a escolha de perfil (passo 1, que só precisa levar a #/mission).

  As três missões abaixo são PROVISÓRIAS: a lista real vem dos dados da Valéria. Quando chegar, troque
  só MISSIONS (ou carregue do servidor com o mesmo formato) e tire `placeholder`.

  A escolha fica no aparelho, por conta (health7:mission:<crewId>), como o resto dos dados locais.
*/
import { useSyncExternalStore } from 'react'
import { scopedStorageKey } from './active-profile'

export type Destination = 'leo' | 'moon' | 'mars'

export interface Mission {
  id: string
  /** Nome curto para o cabeçalho: "ISS". */
  short: string
  name: string
  destination: Destination
  /** Duração simulada da missão em dias (o timelapse anda de 1 até aqui). */
  durationDays: number
  /** Atraso de comunicação com o solo, em texto: "Up to 20 min each way". */
  commsDelay: string
  /** Uma frase sobre o que muda para a saúde nessa missão. */
  summary: string
  /** Dado provisório, ainda sem a fonte real. */
  placeholder?: boolean
}

export const MISSIONS: Mission[] = [
  {
    id: 'iss',
    short: 'ISS',
    name: 'Low Earth orbit station',
    destination: 'leo',
    durationDays: 30,
    commsDelay: 'Near real time',
    summary: 'Ground support is one call away. The app helps you spot changes early.',
    placeholder: true,
  },
  {
    id: 'moon',
    short: 'Moon',
    name: 'Lunar surface stay',
    destination: 'moon',
    durationDays: 30,
    commsDelay: 'About 1.3 s each way',
    summary: 'Higher radiation outside the magnetosphere. Ground is close, but not on hand.',
    placeholder: true,
  },
  {
    id: 'mars',
    short: 'Mars',
    name: 'Mars transit',
    destination: 'mars',
    durationDays: 30,
    commsDelay: 'Up to 20 min each way',
    summary: 'No live help from Earth. The crew decides first, the report goes down later.',
    placeholder: true,
  },
]

export const missionById = (id: string | null | undefined) => MISSIONS.find((m) => m.id === id) ?? null

const KEY = 'health7:mission'
const listeners = new Set<() => void>()

function read(crewId: string): string | null {
  try {
    const key = scopedStorageKey(KEY, crewId)
    return key ? localStorage.getItem(key) : null
  } catch {
    return null
  }
}

/** Grava (ou apaga, com null) a missão desta conta neste aparelho. */
export function setMission(crewId: string, id: string | null) {
  try {
    const key = scopedStorageKey(KEY, crewId)
    if (!key) return
    if (id) localStorage.setItem(key, id)
    else localStorage.removeItem(key)
  } catch {
    /* sem armazenamento: vale só nesta visita */
  }
  memory.set(crewId, id)
  listeners.forEach((l) => l())
}

// Cópia em memória: com o armazenamento bloqueado, a escolha ainda vale até recarregar.
const memory = new Map<string, string | null>()

/** Missão escolhida por esta conta neste aparelho; null enquanto não escolheu. */
export function getMission(crewId: string): Mission | null {
  return missionById(read(crewId) ?? memory.get(crewId))
}

/** Missão escolhida por esta conta; null enquanto não escolheu. */
export function useMission(crewId: string): Mission | null {
  const id = useSyncExternalStore(
    (cb) => {
      listeners.add(cb)
      const onStorage = (e: StorageEvent) => e.key?.startsWith(KEY) && cb()
      window.addEventListener('storage', onStorage)
      return () => {
        listeners.delete(cb)
        window.removeEventListener('storage', onStorage)
      }
    },
    () => getMission(crewId)?.id ?? null,
    () => null,
  )
  return missionById(id)
}
