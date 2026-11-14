/*
  Entradas de teste a partir da pesquisa NEXUS-Med (dados/derivados): as mesmas que `npm run import:nexus`
  grava, um check-up por dia e um episódio da API de sintomas por rótulo. Só para testes.
*/
import tripulantes from '../../../dados/derivados/tripulantes.json'
import diario from '../../../dados/derivados/diario.json'
import type { Symptom } from '@/lib/api'
import type { MonitorInput } from '@/lib/monitor'
import type { CheckInInput } from '@/lib/storage'

export const crew: { crewId: string; baseline: Record<string, number> }[] = tripulantes.items
const diary: { crewId: string; day: number; vitals: Record<string, number>; urinations24h: number; stools24h: number; redFlag: boolean; symptoms: { label: string; bodyPart: string; severity: number }[] }[] = diario.items

const START = Date.parse('2026-10-01T00:00:00Z')
const dateOf = (day: number) => new Date(START + (day - 1) * 86400000).toISOString().slice(0, 10)

export function fixture(crewId: string, todayDay = 30): MonitorInput {
  const c = crew.find((x) => x.crewId === crewId)!
  const days = diary.filter((d) => d.crewId === crewId && d.day <= todayDay).sort((a, b) => a.day - b.day)
  const checkins: CheckInInput[] = days.map((d) => ({
    clientId: `nexus-${crewId}-d${d.day}`, at: `${dateOf(d.day)}T06:00:00.000Z`, vitals: d.vitals, behavioral: {},
    healthDetails: { urinations24h: d.urinations24h, stools24h: d.stools24h, ...(d.redFlag ? { redFlag: true } : {}) },
    sync: 'saved',
  }))
  const symptoms: Symptom[] = []
  const active = new Map<string, Symptom>()
  for (const d of days) {
    const at = `${dateOf(d.day)}T06:05:00.000Z`
    for (const [label, s] of [...active]) if (!d.symptoms.some((x) => x.label === label)) {
      s.events.push({ id: `${s.id}-r`, at, receivedAt: at, type: 'resolution' }); s.status = 'resolved'; active.delete(label)
    }
    for (const x of d.symptoms) {
      const open = active.get(x.label)
      if (open) open.events.push({ id: `${open.id}-${d.day}`, at, receivedAt: at, type: 'evolution', severity: x.severity })
      else {
        const s: Symptom = { id: `${crewId}-${x.label}-${d.day}`, at, label: x.label, bodyPart: x.bodyPart, severity: x.severity, status: 'active',
          events: [{ id: `${crewId}-${x.label}-${d.day}-s`, at, receivedAt: at, type: 'start', severity: x.severity }] }
        symptoms.push(s); active.set(x.label, s)
      }
    }
  }
  const { heightCm: _h, ...baseline } = c.baseline
  return { profile: { missionDay: todayDay, baseline }, checkins, symptoms, today: new Date(`${dateOf(todayDay)}T12:00:00Z`) }
}

