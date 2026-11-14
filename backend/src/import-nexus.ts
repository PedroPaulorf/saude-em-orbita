/*
  Importação explícita dos tripulantes fictícios NEXUS-Med (NX-01 a NX-06): `npm run import:nexus`.
  Nunca roda na subida da API (mesma regra de users.ts).

  Lê dados/derivados/ (gerado por dados/scripts/exportar.py) e grava pelas rotas da própria API,
  em processo (app.inject): Pessoa, um check-up por dia de voo (procedência simulated-device),
  sintomas pela API de sintomas (início, evolução e resolução de cada episódio) e um registro de
  ambiente RR-1 por dia. As avaliações por medida saem do servidor, como em qualquer check-up.

  Datas: cada conta tem um "dia que cai em hoje" (NX-06 = 14, NX-04 = 19, ...). O dia N vira
  hoje - (diaHoje - N), às 06:00 UTC, e só entram os dias até o de hoje. A data âncora fica no
  perfil: rodar de novo reaproveita a âncora e não duplica nada (clientId estável, nexus-NX-04-d17).
  Para mover "hoje" para outra data, use --reset (apaga só os registros destas contas fictícias).

  Uso:
    DEMO_PASSWORD=... npm run import:nexus
    npm run import:nexus -- --only NX-04,NX-06
    npm run import:nexus -- --today-day NX-04=21 --reset
*/
import { randomBytes } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
import { createApp } from './app.js'
import { hashPassword, tokenHash } from './auth.js'
import { openDatabase } from './database.js'

export const DEFAULT_TODAY_DAY: Record<string, number> = { 'NX-06': 14, 'NX-04': 19, 'NX-03': 14, 'NX-01': 2, 'NX-02': 30, 'NX-05': 30 }
export const NEXUS_SOURCE = 'synthetic-nexus'
const DATA = new URL('../../dados/derivados/', import.meta.url)
const DAY_MS = 86400000
const VITALS = ['heartRate', 'bloodPressure', 'bloodPressureDiastolic', 'sleep', 'temperature', 'spo2', 'respiratoryRate', 'bodyMass'] as const

interface Crew { crewId: string; sex: 'F' | 'M'; age: number; role: string; medicalHistory: string; scenario: string; baseline: Record<string, number> }
interface SymptomLabel { label: string; bodyPart: string; severity: number }
interface Day {
  crewId: string; day: number; vitals: Record<string, number>; urinations24h: number; stools24h: number
  symptomsText: string; symptoms: SymptomLabel[]; redFlag: boolean
  environment: { temperatureC: number; relativeHumidityPct: number; co2Ppm: number; radiationDoseMgyDay: number; radiationAccumMgy: number; sourceDate: string; origin: string }
}
interface Source { id: string; variable: string; finding: string; evidenceType: string; file: string; location: string; simulationUse: string; limitation: string; language: string }
export interface ImportOptions {
  databaseUrl: string
  /** Senha das contas novas (contas existentes mantêm a senha). */
  password?: string
  /** Dia de voo que cai em hoje, por tripulante; o resto usa DEFAULT_TODAY_DAY. */
  todayDay?: Record<string, number>
  only?: string[]
  reset?: boolean
  now?: Date
  log?: (line: string) => void
}
export interface ImportSummary { crewId: string; username: string; todayDay: number; anchorDate: string; checkins: number; created: number; symptoms: number; environment: number }

const readJson = async <T>(name: string) => JSON.parse(await readFile(new URL(name, DATA), 'utf8')).items as T
export const usernameFor = (crewId: string) => crewId.replace('-', '').toLowerCase()
const utcDate = (ms: number) => new Date(ms).toISOString().slice(0, 10)
const fail = (message: string): never => { throw new Error(message) }

export async function importNexus(options: ImportOptions): Promise<ImportSummary[]> {
  const log = options.log ?? (() => {})
  const [crew, days, sources] = await Promise.all([readJson<Crew[]>('tripulantes.json'), readJson<Day[]>('diario.json'), readJson<Source[]>('fontes.json')])
  const selected = crew.filter(c => !options.only?.length || options.only.includes(c.crewId))
  for (const id of [...options.only ?? [], ...Object.keys(options.todayDay ?? {})]) if (!crew.some(c => c.crewId === id)) fail(`Unknown crew ${id}`)
  const now = options.now ?? new Date()
  // Dia âncora: o dia UTC de 6 horas atrás, para o registro de hoje (06:00 UTC) nunca ficar no futuro.
  const freshAnchor = utcDate(now.getTime() - 6 * 3600000)
  const app = await createApp({ databaseUrl: options.databaseUrl })
  const db = openDatabase(options.databaseUrl)
  const summaries: ImportSummary[] = []
  try {
    // Fontes da planilha: papel "data-anchor", nunca evidência de limiar clínico.
    for (const s of sources) await db.query('INSERT INTO medical_references VALUES($1,$2) ON CONFLICT(id) DO NOTHING', [s.id, {
      id: s.id, title: `${s.variable}: ${s.file}`, topic: s.variable, role: 'data-anchor', summary: s.finding,
      location: s.location, evidenceType: s.evidenceType, simulationUse: s.simulationUse, limitation: s.limitation,
      language: s.language, dataset: 'NEXUS-Med', url: null, clinicalThresholdEvidence: false }])

    for (const c of selected) {
      const username = usernameFor(c.crewId), id = 'crew-' + username
      const existing = (await db.query('SELECT id,profile FROM crew WHERE username=$1', [username])).rows[0]
      if (existing && (existing.id !== id || existing.profile?.source !== NEXUS_SOURCE)) fail(`Account ${username} exists and is not a NEXUS synthetic account; nothing changed`)
      if (existing && options.reset) await purge(db, id)
      const stored = existing && !options.reset ? existing.profile.nexus : undefined
      const wanted = options.todayDay?.[c.crewId]
      if (stored && wanted != null && wanted !== stored.todayDay)
        fail(`${c.crewId} was imported with today = day ${stored.todayDay}; run with --reset to change it`)
      const todayDay = stored?.todayDay ?? wanted ?? DEFAULT_TODAY_DAY[c.crewId] ?? 30
      if (!Number.isInteger(todayDay) || todayDay < 1 || todayDay > 30) fail(`Today day for ${c.crewId} must be 1 to 30`)
      const anchorDate: string = stored?.anchorDate ?? freshAnchor
      const displayName = `${c.crewId} · ${c.role}`
      const { heightCm: _height, ...baseline } = c.baseline
      const profile = { id, displayName, bodyModel: c.sex === 'F' ? 'female' : 'male', missionDay: todayDay, source: NEXUS_SOURCE,
        scenario: c.scenario, baseline,
        nexus: { crewId: c.crewId, role: c.role, anchorDate, todayDay, dataset: 'NEXUS-Med',
          notice: 'Synthetic crew profile. Values anchored in published spaceflight data; environment is real NASA RR-1, re-indexed.' } }
      if (existing) await db.query('UPDATE crew SET profile=$2 WHERE id=$1', [id, profile])
      else {
        const password = options.password ?? ''
        if (password.length < 12 || password.length > 256) fail('DEMO_PASSWORD must contain 12 to 256 characters to create the NX accounts')
        await db.query('INSERT INTO crew(id,username,password_hash,profile) VALUES($1,$2,$3,$4)', [id, username, await hashPassword(password), profile])
      }

      // Sessão curta só para esta importação; o dono vem da sessão, como em qualquer requisição.
      const token = randomBytes(32).toString('hex')
      await db.query("INSERT INTO sessions(token_hash,crew_id,expires_at) VALUES($1,$2,now()+interval '10 minutes')", [tokenHash(token), id])
      const headers = { cookie: `health7_session=${token}`, 'x-requested-with': 'Health7', 'x-health7-crew': id }
      const post = async (url: string, payload: unknown) => {
        const response = await app.inject({ method: 'POST', url: '/api/v1' + url, headers, payload: payload as object })
        if (response.statusCode === 409) fail(`${c.crewId}: ${url} already holds different data for the same clientId; run with --reset`)
        if (response.statusCode >= 300) fail(`${c.crewId}: ${url} answered ${response.statusCode} ${response.body}`)
        return { created: response.statusCode === 201, body: response.json() }
      }
      const summary: ImportSummary = { crewId: c.crewId, username, todayDay, anchorDate, checkins: 0, created: 0, symptoms: 0, environment: 0 }
      try {
        await post('/me/person', { name: displayName, age: c.age, sex: c.sex === 'F' ? 'female' : 'male', heightCm: c.baseline.heightCm, medicalHistory: c.medicalHistory })
        const active = new Map<string, string>()
        for (const d of days.filter(x => x.crewId === c.crewId && x.day <= todayDay).sort((a, b) => a.day - b.day)) {
          const date = utcDate(Date.parse(anchorDate) - (todayDay - d.day) * DAY_MS)
          const at = `${date}T06:00:00.000Z`, symptomAt = `${date}T06:05:00.000Z`
          const vitals = Object.fromEntries(VITALS.map(k => [k, d.vitals[k]]))
          const checkin = await post('/me/checkins', {
            clientId: `nexus-${c.crewId}-d${d.day}`, at, source: 'simulated', vitals, behavioral: {},
            healthDetails: { urinations24h: d.urinations24h, stools24h: d.stools24h, ...(d.redFlag ? { redFlag: true } : {}) },
            provenance: Object.fromEntries(VITALS.map(k => [k, { method: 'simulated-device', quality: 'simulated' }])) })
          summary.checkins++
          if (checkin.created) summary.created++
          const e = d.environment
          await post('/me/environment', { clientId: `nexus-${c.crewId}-env-d${d.day}`, at, source: 'simulated', temperatureC: e.temperatureC,
            relativeHumidityPct: e.relativeHumidityPct, co2Ppm: e.co2Ppm, radiationDoseMgyDay: e.radiationDoseMgyDay, radiationAccumMgy: e.radiationAccumMgy })
          summary.environment++
          // Um episódio por rótulo: início no primeiro dia, evolução nos seguintes, resolução no primeiro dia sem ele.
          const today = new Set(d.symptoms.map(s => s.label))
          for (const [label, symptomId] of [...active]) {
            if (today.has(label)) continue
            await post(`/me/symptoms/${symptomId}/events`, { clientId: `nexus-${c.crewId}-${label}-d${d.day}-resolution`, at: symptomAt, type: 'resolution', note: d.symptomsText })
            active.delete(label)
          }
          for (const s of d.symptoms) {
            const symptomId = active.get(s.label)
            if (symptomId) {
              await post(`/me/symptoms/${symptomId}/events`, { clientId: `nexus-${c.crewId}-${s.label}-d${d.day}-evolution`, at: symptomAt, type: 'evolution', severity: s.severity, note: d.symptomsText })
            } else {
              const started = await post('/me/symptoms', { clientId: `nexus-${c.crewId}-${s.label}-d${d.day}`, at: symptomAt, onsetAt: symptomAt,
                label: s.label, bodyPart: s.bodyPart, severity: s.severity, note: d.symptomsText })
              active.set(s.label, started.body.id)
              summary.symptoms++
            }
          }
        }
      } finally { await db.query('DELETE FROM sessions WHERE token_hash=$1', [tokenHash(token)]) }
      summaries.push(summary)
      log(`${c.crewId} -> ${username}: days 1-${todayDay} (today = ${anchorDate}), ${summary.checkins} check-ups (${summary.created} new), ${summary.symptoms} symptom episodes, ${summary.environment} environment records`)
    }
  } finally { await app.close(); await db.end() }
  return summaries
}

/**
 * --reset: apaga os registros de uma conta NEXUS fictícia (a conta e a senha ficam).
 * Os eventos de sintoma são só de acréscimo; a trava é desligada dentro da transação, só para estas linhas.
 */
async function purge(db: ReturnType<typeof openDatabase>, crewId: string) {
  const client = await db.connect()
  try {
    await client.query('BEGIN')
    await client.query('ALTER TABLE symptom_events DISABLE TRIGGER symptom_events_append_only')
    for (const table of ['medical_observations', 'health', 'checkins', 'symptom_events', 'symptoms', 'environment', 'analyses', 'mission_simulations', 'sessions'])
      await client.query(`DELETE FROM ${table} WHERE crew_id=$1`, [crewId])
    await client.query('ALTER TABLE symptom_events ENABLE TRIGGER symptom_events_append_only')
    await client.query('UPDATE person SET weight_kg=NULL,weight_measured_at=NULL,weight_updated_at=NULL,updated_at=now() WHERE id=$1', [crewId])
    await client.query('COMMIT')
  } catch (error) { await client.query('ROLLBACK'); throw error } finally { client.release() }
}

function parseArgs(argv: string[]) {
  const options: Pick<ImportOptions, 'todayDay' | 'only' | 'reset'> = { todayDay: {} }
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--reset') options.reset = true
    else if (arg === '--only') options.only = (argv[++i] ?? fail('--only needs a list, e.g. NX-04,NX-06')).split(',').map(s => s.trim().toUpperCase())
    else if (arg === '--today-day') for (const pair of (argv[++i] ?? fail('--today-day needs NX-04=19')).split(',')) {
      const [crewId, day] = pair.split('=')
      if (!crewId || !day) fail('--today-day needs NX-04=19')
      options.todayDay![crewId.trim().toUpperCase()] = Number(day)
    } else fail(`Unknown option ${arg}`)
  }
  return options
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const args = parseArgs(process.argv.slice(2))
  await importNexus({ databaseUrl: process.env.DATABASE_URL ?? fail('DATABASE_URL is required'), password: process.env.DEMO_PASSWORD, ...args, log: console.log })
  console.log('NEXUS-Med synthetic crew imported. Sign in as nx01 to nx06 with the demo password.')
}
