/*
  Prints das telas com a API simulada: não precisa de banco nem do backend.

  Sobe o Vite numa porta livre, responde /api/v1 com os tripulantes fictícios de dados/derivados
  (as mesmas contas de `npm run import:nexus`) e grava um PNG por tela, perfil e largura.
  O relógio do navegador fica parado ao meio-dia UTC do "hoje" dos dados, então o resultado não
  depende da hora em que o comando roda.

  Uso (na pasta frontend):
    npm run shots                      # tudo, em ./.shots
    npm run shots -- --only nx04-home  # só os arquivos cujo nome contém o texto
    npm run shots -- --out /tmp/prints

  Perfis: nx02 (Stable), nx04 (Persistent change), nx06 (Escalate), empty (conta sem registros).
  Larguras: desk 1440, tab 820, mob 390. Nome do arquivo: <perfil>-<tela>-<largura>[-fold].png
  ("-fold" é só a primeira dobra; sem ele, a página inteira).
  Chromium: usa o do Playwright; se a versão instalada for outra, defina PLAYWRIGHT_EXECUTABLE_PATH.
*/
import { existsSync, mkdirSync, readdirSync, readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from '@playwright/test'
import { createServer } from 'vite'

const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`)
  return i > 0 ? process.argv[i + 1] : fallback
}
const FRONT = fileURLToPath(new URL('..', import.meta.url))
const DATA = new URL('../../dados/derivados/', import.meta.url)
const out = arg('out', join(FRONT, '.shots'))
const only = arg('only')
const DAY = 86400000
const utc = (ms) => new Date(ms).toISOString().slice(0, 10)
const items = (file) => JSON.parse(readFileSync(new URL(file, DATA), 'utf8')).items
const crew = items('tripulantes.json')
const diary = items('diario.json')
// Mesmo "dia âncora" da importação: o dia UTC de 6 horas atrás.
const ANCHOR = utc(Date.now() - 6 * 3600000)

/** Perfil, check-ups, sintomas e ambiente de um tripulante, como a API devolve. */
function account(crewId, todayDay) {
  if (crewId === 'EMPTY') {
    return { checkins: [], symptoms: [], environment: [], profile: { id: 'crew-crew02', displayName: 'Alex Rivera', missionDay: 12, bodyModel: 'male', source: 'simulated',
      baseline: { heartRate: 62, bloodPressure: 116, bloodPressureDiastolic: 74, sleep: 7.5, temperature: 36.6 } } }
  }
  const c = crew.find((x) => x.crewId === crewId)
  const id = 'crew-' + crewId.replace('-', '').toLowerCase()
  const { heightCm: _height, ...baseline } = c.baseline
  const profile = { id, displayName: `${c.crewId} · ${c.role}`, bodyModel: c.sex === 'F' ? 'female' : 'male', missionDay: todayDay, source: 'synthetic-nexus', scenario: c.scenario, baseline,
    nexus: { crewId: c.crewId, role: c.role, anchorDate: ANCHOR, todayDay, dataset: 'NEXUS-Med', notice: 'Synthetic crew profile.' } }
  const days = diary.filter((d) => d.crewId === crewId && d.day <= todayDay).sort((a, b) => a.day - b.day)
  const dateOf = (day) => utc(Date.parse(ANCHOR) - (todayDay - day) * DAY)
  const checkins = days.map((d) => ({ id: `srv-${d.day}`, crewId: id, clientId: `nexus-${crewId}-d${d.day}`, at: `${dateOf(d.day)}T06:00:00.000Z`, receivedAt: `${dateOf(d.day)}T06:00:01.000Z`,
    source: 'simulated', vitals: d.vitals, behavioral: {}, provenance: Object.fromEntries(Object.keys(d.vitals).map((k) => [k, { method: 'simulated-device', quality: 'simulated' }])),
    healthDetails: { urinations24h: d.urinations24h, stools24h: d.stools24h, ...(d.redFlag ? { redFlag: true } : {}) } }))
  const symptoms = []
  const open = new Map()
  for (const d of days) {
    const at = `${dateOf(d.day)}T06:05:00.000Z`
    for (const [label, s] of [...open]) if (!d.symptoms.some((x) => x.label === label)) { s.events.push({ id: `${s.id}-r`, at, receivedAt: at, type: 'resolution' }); s.status = 'resolved'; open.delete(label) }
    for (const x of d.symptoms) {
      const current = open.get(x.label)
      if (current) current.events.push({ id: `${current.id}-${d.day}`, at, receivedAt: at, type: 'evolution', severity: x.severity })
      else {
        const s = { id: `${crewId}-${x.label}-${d.day}`, at, label: x.label, bodyPart: x.bodyPart, severity: x.severity, status: 'active', events: [{ id: `${crewId}-${x.label}-${d.day}-s`, at, receivedAt: at, type: 'start', severity: x.severity }] }
        symptoms.push(s); open.set(x.label, s)
      }
    }
  }
  const environment = days.map((d) => ({ at: `${dateOf(d.day)}T06:00:00.000Z`, temperatureC: d.environment.temperatureC, relativeHumidityPct: d.environment.relativeHumidityPct, co2Ppm: d.environment.co2Ppm, radiationDoseMgyDay: d.environment.radiationDoseMgyDay }))
  return { profile, checkins, symptoms, environment }
}

async function launch() {
  try { return await chromium.launch({ executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH || undefined }) } catch (error) {
    // Versão do Playwright diferente da do Chromium baixado: usa qualquer headless shell já instalado.
    const cache = join(homedir(), '.cache', 'ms-playwright')
    const dir = existsSync(cache) ? readdirSync(cache).filter((d) => d.startsWith('chromium_headless_shell-')).sort().at(-1) : undefined
    const exe = dir && join(cache, dir, 'chrome-headless-shell-linux64', 'chrome-headless-shell')
    if (!exe || !existsSync(exe)) throw error
    return chromium.launch({ executablePath: exe })
  }
}

// O endereço da API não existe: toda chamada é respondida aqui. Sem n8n: chat e roteiro no modo de demonstração.
Object.assign(process.env, { VITE_API_URL: 'http://127.0.0.1:3999', VITE_N8N_CHAT_WEBHOOK_URL: '', VITE_N8N_ROADMAP_WEBHOOK_URL: '', VITE_N8N_ALERT_WEBHOOK_URL: '' })
const server = await createServer({ root: FRONT, logLevel: 'error', server: { host: '127.0.0.1', port: 5199 } })
await server.listen()
const BASE = server.resolvedUrls.local[0].replace(/\/$/, '')
const browser = await launch()
mkdirSync(out, { recursive: true })

async function open(acc, viewport) {
  const ctx = await browser.newContext({ viewport })
  const page = await ctx.newPage()
  await page.clock.setFixedTime(new Date(`${ANCHOR}T12:00:00Z`))
  const cors = { 'access-control-allow-origin': BASE, 'access-control-allow-credentials': 'true', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' }
  const history = (list) => ({ items: list, from: utc(Date.now() - 30 * DAY), to: utc(Date.now()), truncated: false })
  await page.route('**/api/v1/**', (route) => {
    const path = new URL(route.request().url()).pathname.replace('/api/v1', '')
    const method = route.request().method()
    const json = (body, status = 200) => route.fulfill({ status, contentType: 'application/json', headers: cors, body: JSON.stringify(body) })
    if (method === 'OPTIONS') return route.fulfill({ status: 204, headers: cors })
    if (!acc) return json({ message: 'Unauthorized' }, 401)
    if (path === '/me') return json(acc.profile)
    if (path === '/me/checkins' && method === 'POST') return json({ ...route.request().postDataJSON(), id: `srv-${Date.now()}`, crewId: acc.profile.id, receivedAt: new Date().toISOString() }, 201)
    if (path === '/me/checkins') return json(history(acc.checkins))
    if (path === '/me/symptoms') return json(history(acc.symptoms))
    if (path === '/me/environment') return json(history(acc.environment))
    if (path === '/me/simulations') return json(history([]))
    return json({ message: `not mocked: ${path}` }, 404)
  })
  page.on('pageerror', (error) => console.log('  page error:', error.message))
  return { ctx, page }
}

const VIEWPORTS = { desk: { width: 1440, height: 900 }, tab: { width: 820, height: 1180 }, mob: { width: 390, height: 844 } }
const SCENES = [['nx02', 'NX-02', 30], ['nx04', 'NX-04', 19], ['nx06', 'NX-06', 14], ['empty', 'EMPTY', 0]]
const ROUTES = [['home', '/'], ['prevention', '/prevention'], ['progress', '/progress'], ['stats', '/stats'], ['stats-chest', '/stats?region=chest'],
  ['check-health', '/check/health'], ['check-behavioral', '/check/behavioral'], ['data', '/data']]
const wanted = (name) => !only || name.includes(only)
async function shot(page, name, fullPage) {
  await page.waitForTimeout(600)
  await page.screenshot({ path: join(out, `${name}.png`), fullPage })
  console.log(name)
}
async function go(page, hash) {
  await page.goto(`${BASE}/#${hash}`)
  await page.waitForLoadState('networkidle').catch(() => {})
}
/** Um passo que pode falhar (rótulo mudou) sem derrubar o resto. */
async function attempt(name, run) {
  if (!wanted(name)) return
  try { await run() } catch (error) { console.log(`  skipped ${name}: ${String(error.message).split('\n')[0]}`) }
}

try {
  for (const view of ['desk', 'mob']) {
    if (!wanted(`login-${view}`)) continue
    const { ctx, page } = await open(null, VIEWPORTS[view])
    await go(page, '/'); await shot(page, `login-${view}`, false); await ctx.close()
  }
  for (const [tag, id, day] of SCENES) {
    const acc = account(id, day)
    for (const view of Object.keys(VIEWPORTS)) {
      if (view === 'tab' && tag !== 'nx04') continue
      const names = ROUTES.flatMap(([r]) => [`${tag}-${r}-${view}`, `${tag}-${r}-${view}-fold`])
      const extra = view === 'desk' ? ['dialog-demo', 'dialog-weather', 'dialog-report'].map((n) => `${tag}-${n}-${view}`) : []
      if (![...names, ...extra, `${tag}-chat-${view}`].some(wanted)) continue
      const { ctx, page } = await open(acc, VIEWPORTS[view])
      for (const [r, hash] of ROUTES) {
        const name = `${tag}-${r}-${view}`
        if (!wanted(name) && !wanted(`${name}-fold`)) continue
        await go(page, hash)
        await shot(page, `${name}-fold`, false)
        await shot(page, name, true)
      }
      if ([...extra, `${tag}-chat-${view}`].some(wanted)) await go(page, '/')
      if (view === 'desk') {
        await attempt(`${tag}-dialog-demo-${view}`, async () => { await page.getByRole('button', { name: 'Simulated data', exact: true }).click(); await shot(page, `${tag}-dialog-demo-${view}`, false); await page.keyboard.press('Escape') })
        await attempt(`${tag}-dialog-weather-${view}`, async () => { await page.getByRole('button', { name: 'Details' }).first().click(); await shot(page, `${tag}-dialog-weather-${view}`, false); await page.keyboard.press('Escape') })
        await attempt(`${tag}-dialog-report-${view}`, async () => { await page.getByRole('button', { name: 'Open report' }).first().click(); await shot(page, `${tag}-dialog-report-${view}`, false); await page.keyboard.press('Escape') })
      }
      await attempt(`${tag}-chat-${view}`, async () => { await page.getByRole('button', { name: 'Open companion chat', exact: true }).click(); await shot(page, `${tag}-chat-${view}`, false) })
      await ctx.close()
    }
  }
} finally {
  await browser.close()
  await server.close()
}
console.log(`\nSaved in ${out}`)
