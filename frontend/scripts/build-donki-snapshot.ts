// Gera src/data/donki-snapshot.json: a cópia local do DONKI que vai junto com o app.
// Usada quando a API ou a internet falham, e no modo histórico do demo.
// Rode com: npm run data:donki   (Node 24 executa TypeScript direto)
import { writeFile } from 'node:fs/promises'
import { lastDays } from '../src/lib/donki/api.ts'
import { fetchSnapshot } from '../src/lib/donki/snapshot.ts'

const LIVE_WINDOW_DAYS = 7
// Contém o SEP de 05/09/2026, ligado a uma erupção (FLR) e a uma CME do mesmo dia.
const HISTORY = { startDate: '2026-09-01', endDate: '2026-09-10' }

const out = new URL('../src/data/donki-snapshot.json', import.meta.url)
const [live, history] = await Promise.all([fetchSnapshot(lastDays(LIVE_WINDOW_DAYS)), fetchSnapshot(HISTORY)])

await writeFile(
  out,
  JSON.stringify({ _source: 'NASA CCMC DONKI API, https://ccmc.gsfc.nasa.gov/DONKI-API', live, history }, null, 2) + '\n',
)
const show = (name: string, s: typeof live) =>
  console.log(`${name}: ${s.window.startDate}..${s.window.endDate} · SEP ${s.sep.length} · FLR ${s.flr.length} · GST ${s.gst.length}`)
show('live', live)
show('history', history)
console.log(`-> ${out.pathname}`)
