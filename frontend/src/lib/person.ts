/*
  Ficha da pessoa (GET/POST /me/person): nome, idade, sexo, altura e peso. Fica no servidor, separada
  do perfil da sessão (que traz linha de base e dia da missão). Dados simulados nesta demo.
*/
import { useCallback, useEffect, useState } from 'react'
import { apiRequest, ApiError } from './api'
import { session } from './session'

export type Sex = 'female' | 'male' | 'intersex' | 'unspecified'
export interface Person {
  id: string
  name: string
  age: number | null
  weightKg: number | null
  heightCm: number | null
  sex: Sex | null
  medicalHistory: string | null
  weightMeasuredAt: string | null
  updatedAt: string | null
}
export type PersonPatch = Partial<Pick<Person, 'name' | 'age' | 'weightKg' | 'heightCm' | 'sex'>>

/** IMC com uma casa; null sem peso ou altura. */
export function bmi(p: Pick<Person, 'weightKg' | 'heightCm'>): number | null {
  if (!p.weightKg || !p.heightCm) return null
  const m = p.heightCm / 100
  return Math.round((p.weightKg / (m * m)) * 10) / 10
}

/** "Crew member 02" → "C2"; "Ana Souza" → "AS". */
export function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean)
  if (!words.length) return '?'
  const last = words[words.length - 1]
  const tail = /^\d+$/.test(last) ? String(Number(last)) : last[0]
  return (words.length > 1 ? words[0][0] + tail : words[0].slice(0, 2)).toUpperCase()
}

export function usePerson(crewId: string) {
  const [person, setPerson] = useState<Person | null>(null)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    apiRequest<Person>('/me/person', undefined, controller.signal, crewId)
      .then(setPerson)
      .catch((e) => {
        if (controller.signal.aborted) return
        if (e instanceof ApiError && e.status === 401) session.invalidate()
        else setError(e instanceof Error ? e.message : 'Could not load the profile.')
      })
    return () => controller.abort()
  }, [crewId])

  const save = useCallback(
    async (patch: PersonPatch) => {
      setSaving(true)
      setError('')
      try {
        const next = await apiRequest<Person>('/me/person', patch, undefined, crewId)
        setPerson(next)
        // O nome também vive no perfil da sessão (cabeçalho, companheiro).
        if (patch.name) session.renamed(next.name)
        return true
      } catch (e) {
        if (e instanceof ApiError && e.status === 401) session.invalidate()
        else setError(e instanceof Error ? e.message : 'Could not save.')
        return false
      } finally {
        setSaving(false)
      }
    },
    [crewId],
  )

  return { person, error, saving, save }
}
