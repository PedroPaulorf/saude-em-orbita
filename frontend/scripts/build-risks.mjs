// Gera src/data/hrp-risks.json a partir das notas de cofre/03 Pesquisa/Riscos NASA HRP.
// Usa o texto ORIGINAL em inglês da NASA (bloco "Texto original" de cada nota).
// Rode com: npm run data:risks
import { readdir, readFile, writeFile } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const notesDir = join(here, '../../cofre/03 Pesquisa/Riscos NASA HRP')
const out = join(here, '../src/data/hrp-risks.json')

const field = (fm, key) => fm.match(new RegExp(`^${key}:\\s*"?(.*?)"?\\s*$`, 'm'))?.[1] ?? ''

function section(quote, heading) {
  // Texto entre "**heading**" e o próximo "**...**" ou "Fonte:".
  const re = new RegExp(`\\*\\*${heading}\\*\\*\\s*([\\s\\S]*?)(?=\\*\\*[A-Z]|Fonte:|$)`, 'i')
  return (quote.match(re)?.[1] ?? '').replace(/\s+/g, ' ').trim()
}

const slug = (s) =>
  s
    .toLowerCase()
    .replace(/^risks? (of|from) /, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

const files = (await readdir(notesDir)).filter((f) => f.endsWith('.md') && f !== 'Riscos NASA HRP.md')
const risks = []

for (const file of files.sort()) {
  const text = await readFile(join(notesDir, file), 'utf8')
  const fm = text.match(/^---\n([\s\S]*?)\n---/)?.[1] ?? ''
  const title = field(fm, 'titulo_original')
  if (!title) continue
  const quote = (text.split(/> \[!quote\]-? Texto original/)[1] ?? '')
    .split('\n')
    .map((l) => l.replace(/^>\s?/, ''))
    .join('\n')
  risks.push({
    id: slug(title),
    title,
    group: field(fm, 'grupo'),
    url: field(fm, 'url'),
    topRisks: section(quote, 'What are the (?:top|main) risks\\?'),
    whatCanBeDone: section(quote, 'What can be done(?: about it)?\\?'),
    note: file.replace(/\.md$/, ''),
  })
}

await writeFile(
  out,
  JSON.stringify({ _source: 'NASA Human Research Program, original English text, via cofre notes', risks }, null, 2) + '\n',
)
console.log(`${risks.length} riscos -> ${out}`)
for (const r of risks) if (!r.topRisks || !r.whatCanBeDone) console.warn(`  aviso: texto incompleto em "${r.note}"`)
