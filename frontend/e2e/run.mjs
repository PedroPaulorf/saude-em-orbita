// Each spec gets an isolated database schema and fresh API processes.
import { createRequire } from 'node:module'
import { randomUUID } from 'node:crypto'
import { spawn, spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { readdir } from 'node:fs/promises'

if (!process.env.TEST_DATABASE_URL) throw new Error('Set TEST_DATABASE_URL to a separate PostgreSQL test database')
const backendRequire = createRequire(new URL('../../backend/package.json', import.meta.url))
const frontendRequire = createRequire(new URL('../package.json', import.meta.url))
const pg = backendRequire('pg')
const compiled = spawnSync(process.execPath, [backendRequire.resolve('typescript/bin/tsc'), '-p', fileURLToPath(new URL('../../backend/tsconfig.json', import.meta.url))], { stdio: 'inherit', windowsHide: true })
if (compiled.status !== 0) process.exit(compiled.status ?? 1)
const admin = new pg.Pool({ connectionString: process.env.TEST_DATABASE_URL })
const { openDatabase, migrate } = await import('../../backend/dist/database.js')
const { seedDemo } = await import('../../backend/dist/seed.js')
try {
  const available = (await readdir(new URL('./', import.meta.url))).filter(name => name.endsWith('.spec.ts')).sort()
  const requested = process.argv.slice(2)
  if (requested.some(name => !available.includes(name))) throw new Error('Unknown spec; pass an exact filename from e2e/')
  const specs = requested.length ? available.filter(name => requested.includes(name)) : available
  for (const spec of specs) {
    const schema = 'health7_browser_' + randomUUID().replaceAll('-', '')
    const scoped = new URL(process.env.TEST_DATABASE_URL)
    scoped.searchParams.set('options', '-c search_path=' + schema)
    let db
    try {
      await admin.query('CREATE SCHEMA ' + schema)
      db = openDatabase(scoped.toString())
      await migrate(db)
      await seedDemo(db, 'browser-fixture-password-29')
      // Preserve production login-rate limits and prevent records/rank events leaking between specs.
      const child = spawn(process.execPath, [frontendRequire.resolve('@playwright/test/cli'), 'test', spec], {
        cwd: fileURLToPath(new URL('../', import.meta.url)), stdio: 'inherit', windowsHide: true,
        env: { ...process.env, HEALTH7_E2E_DATABASE_URL: scoped.toString() },
      })
      const code = await new Promise((resolve, reject) => {
        child.on('error', reject)
        child.on('exit', code => resolve(code ?? 1))
      })
      if (code !== 0) { process.exitCode = code; break }
    } finally {
      await db?.end()
      await admin.query('DROP SCHEMA IF EXISTS ' + schema + ' CASCADE')
    }
  }
} finally { await admin.end() }
