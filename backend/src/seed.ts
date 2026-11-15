import type pg from 'pg'
import { hashPassword, verifyPassword } from './auth.js'
export async function seedDemo(pool: pg.Pool, password: string) {
  if (!password || (password !== 'senha123' && password.length < 12) || password.length > 256) throw new Error('DEMO_PASSWORD must be senha123 for demonstrations or contain 12 to 256 characters')
  for (const [id, username, bodyModel, displayName, age, heightCm, weightKg] of [
    ['crew-02', 'crew02', 'male', 'Tripulante fictício 02', 41, 178, 76.4],
    ['crew-03', 'crew03', 'female', 'Tripulante fictício 03', 38, 166, 61.2],
  ] as const) {
    const profile = { id, displayName, bodyModel, missionDay: 47, source: 'simulated',
      baseline: { heartRate: 62, bloodPressure: 116, bloodPressureDiastolic: 74, sleep: 7.2, temperature: 36.6, spo2: 97, respiratoryRate: 14 } }
    await pool.query('INSERT INTO crew(id, username, password_hash, profile) VALUES($1,$2,$3,$4) ON CONFLICT(id) DO NOTHING',
      [id, username, await hashPassword(password), profile])
    // Ficha simulada da pessoa (perfil): só preenche o que ainda está vazio.
    await pool.query(`UPDATE person SET age=COALESCE(age,$2),height_cm=COALESCE(height_cm,$3),sex=COALESCE(sex,$4),
      weight_kg=COALESCE(weight_kg,$5),weight_measured_at=COALESCE(weight_measured_at,now()),weight_updated_at=COALESCE(weight_updated_at,now()) WHERE id=$1`,
      [id, age, heightCm, bodyModel, weightKg])
  }
}

const DEMO_USERNAMES = ['nx01', 'nx02', 'nx03', 'nx04', 'nx05', 'nx06', 'crew02', 'crew03']
/**
 * Modo demo (NEXUS_AUTO_REANCHOR=true): garante as contas crew02/crew03 e alinha a senha de todas as
 * contas de demonstração com o DEMO_PASSWORD, mesmo que o banco tenha sido criado com outra senha.
 * Só mexe nessas 8 contas fictícias; devolve os logins que foram corrigidos.
 */
export async function syncDemoAccounts(pool: pg.Pool, password: string) {
  await seedDemo(pool, password)
  const { rows } = await pool.query('SELECT username, password_hash FROM crew WHERE username = ANY($1)', [DEMO_USERNAMES])
  const fixed: string[] = []
  for (const row of rows) {
    if (await verifyPassword(password, row.password_hash)) continue
    await pool.query('UPDATE crew SET password_hash=$1 WHERE username=$2', [await hashPassword(password), row.username])
    fixed.push(row.username)
  }
  return fixed
}
