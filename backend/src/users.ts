import { randomUUID } from 'node:crypto'
import type pg from 'pg'
import { hashPassword } from './auth.js'

/** Explicit operator action; never run automatically at application startup. */
export async function createDemoUser(pool: pg.Pool, username: string, password: string) {
  if (!/^[A-Za-z0-9][A-Za-z0-9_-]{2,79}$/.test(username)) throw new Error('Username must contain 3 to 80 letters, digits, underscores or hyphens')
  if (!password || password.length > 256) throw new Error('NEW_USER_PASSWORD must contain 1 to 256 characters')
  const id = 'crew-' + randomUUID()
  const profile = { id, displayName: `Test profile ${username}`, bodyModel: 'male', missionDay: 1, source: 'simulated',
    baseline: { heartRate: 62, bloodPressure: 116, bloodPressureDiastolic: 74, sleep: 7.2, temperature: 36.6 } }
  const result = await pool.query(`INSERT INTO crew(id,username,password_hash,profile) VALUES($1,$2,$3,$4)
    ON CONFLICT(username) DO NOTHING RETURNING id,username`, [id, username, await hashPassword(password), profile])
  if (!result.rowCount) throw new Error('Username already exists; account and password were not changed')
  return result.rows[0] as { id: string; username: string }
}
