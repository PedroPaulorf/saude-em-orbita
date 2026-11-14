// A fresh schema protects the demo accounts from browser-test records.
import { createRequire } from 'node:module'
import { randomUUID } from 'node:crypto'
import { spawn, spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

if (!process.env.TEST_DATABASE_URL) throw new Error('Set TEST_DATABASE_URL to a separate PostgreSQL test database')
const backendRequire = createRequire(new URL('../../backend/package.json', import.meta.url))
const frontendRequire = createRequire(new URL('../package.json', import.meta.url))
const pg = backendRequire('pg')
const compiled = spawnSync(process.execPath, [backendRequire.resolve('typescript/bin/tsc'), '-p', fileURLToPath(new URL('../../backend/tsconfig.json', import.meta.url))], { stdio: 'inherit' })
if (compiled.status !== 0) process.exit(compiled.status ?? 1)
const admin = new pg.Pool({ connectionString: process.env.TEST_DATABASE_URL })
const schema = 'health7_browser_' + randomUUID().replaceAll('-', '')
const scoped = new URL(process.env.TEST_DATABASE_URL)
scoped.searchParams.set('options', '-c search_path=' + schema)
let db
try {
  await admin.query('CREATE SCHEMA ' + schema)
  const { openDatabase, migrate } = await import('../../backend/dist/database.js')
  const { seedDemo } = await import('../../backend/dist/seed.js')
  db = openDatabase(scoped.toString())
  await migrate(db)
  await seedDemo(db, 'browser-fixture-password-29')
  const child = spawn(process.execPath, [frontendRequire.resolve('@playwright/test/cli'), 'test'], {
    cwd: fileURLToPath(new URL('../', import.meta.url)), stdio: 'inherit',
    env: { ...process.env, HEALTH7_E2E_DATABASE_URL: scoped.toString() },
  })
  process.exitCode = await new Promise((resolve, reject) => {
    child.on('error', reject)
    child.on('exit', (code) => resolve(code ?? 1))
  })
} finally {
  await db?.end()
  await admin.query('DROP SCHEMA IF EXISTS ' + schema + ' CASCADE')
  await admin.end()
}
