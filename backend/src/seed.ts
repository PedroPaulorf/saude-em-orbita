import type pg from 'pg'
import { hashPassword } from './auth.js'
export async function seedDemo(pool: pg.Pool, password: string) {
  if (!password || (password !== 'senha123' && password.length < 12) || password.length > 256) throw new Error('DEMO_PASSWORD must be senha123 for demonstrations or contain 12 to 256 characters')
  for (const [id, username, bodyModel, displayName] of [
    ['crew-02', 'crew02', 'male', 'Tripulante fictício 02'],
    ['crew-03', 'crew03', 'female', 'Tripulante fictício 03'],
  ]) {
    const profile = { id, displayName, bodyModel, missionDay: 47, source: 'simulated',
      baseline: { heartRate: 62, bloodPressure: 116, bloodPressureDiastolic: 74, sleep: 7.2, temperature: 36.6, spo2: 97, respiratoryRate: 14 } }
    await pool.query('INSERT INTO crew(id, username, password_hash, profile) VALUES($1,$2,$3,$4) ON CONFLICT(id) DO NOTHING',
      [id, username, await hashPassword(password), profile])
  }
}
