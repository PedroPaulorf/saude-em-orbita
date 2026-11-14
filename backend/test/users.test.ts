import { before, after, test } from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import pg from 'pg'
import { createApp } from '../src/app.js'
import { openDatabase } from '../src/database.js'
import { createDemoUser } from '../src/users.js'

const databaseUrl = process.env.TEST_DATABASE_URL
if (!databaseUrl) throw new Error('TEST_DATABASE_URL must point to a real PostgreSQL test database')
const schema = 'health7_users_' + randomUUID().replaceAll('-', '')
const admin = new pg.Pool({ connectionString: databaseUrl })
const scoped = new URL(databaseUrl)
scoped.searchParams.set('options', '-c search_path=' + schema)
const pool = openDatabase(scoped.toString())
let app: Awaited<ReturnType<typeof createApp>>
before(async () => { await admin.query('CREATE SCHEMA ' + schema); app = await createApp({ databaseUrl: scoped.toString() }) })
after(async () => { await app?.close(); await pool.end(); await admin.query('DROP SCHEMA IF EXISTS ' + schema + ' CASCADE'); await admin.end() })

test('an explicitly created test account authenticates, has a hashed password and starts with an empty personal history', async () => {
  const password = 'test-only-six-digit'
  const user = await createDemoUser(pool, 'test-account', password)
  const row = (await pool.query('SELECT password_hash,profile FROM crew WHERE id=$1', [user.id])).rows[0]
  assert.match(row.password_hash, /^scrypt-v1\$/); assert.notEqual(row.password_hash, password)
  assert.equal(row.profile.source, 'simulated')
  assert.equal((await pool.query('SELECT id FROM person WHERE id=$1', [user.id])).rowCount, 1)
  const login = await app.inject({ method: 'POST', url: '/api/v1/auth/login', headers: { 'x-requested-with': 'Health7' }, payload: { username: user.username, password } })
  assert.equal(login.statusCode, 200, login.body)
  const cookie = String(login.headers['set-cookie']).split(';')[0]
  const history = await app.inject({ url: '/api/v1/me/checkins', headers: { cookie } })
  assert.deepEqual(history.json().items, [])
})

test('creating an existing name does not reset its password or profile', async () => {
  const user = await createDemoUser(pool, 'already-exists', 'first-password')
  const original = (await pool.query('SELECT * FROM crew WHERE id=$1', [user.id])).rows[0]
  await assert.rejects(createDemoUser(pool, 'already-exists', 'different-password'), /not changed/)
  assert.deepEqual((await pool.query('SELECT * FROM crew WHERE id=$1', [user.id])).rows[0], original)
})

test('a six-character password is supported for an explicit test account and invalid usernames are rejected', async () => {
  await createDemoUser(pool, 'short-password-test', 'a1b2c3')
  await assert.rejects(createDemoUser(pool, '../bad', 'a1b2c3'), /Username/)
  await assert.rejects(createDemoUser(pool, 'valid-name', ''), /PASSWORD/)
})
