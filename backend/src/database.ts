import { DatabaseSync } from 'node:sqlite'
import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import { initializeMedical, storeObservations } from './medical.js'
import type { CheckInInput } from './contracts.js'

export function openDatabase(path: string) {
  if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true })
  const db = new DatabaseSync(path)
  db.exec(`PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL; PRAGMA busy_timeout = 5000;
    CREATE TABLE IF NOT EXISTS crew (id TEXT PRIMARY KEY, profile TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS checkins (
      id TEXT PRIMARY KEY, crew_id TEXT NOT NULL REFERENCES crew(id), client_id TEXT NOT NULL,
      at TEXT NOT NULL, received_at TEXT NOT NULL, payload TEXT NOT NULL,
      UNIQUE(crew_id, client_id)
    );
    CREATE INDEX IF NOT EXISTS checkins_crew_time ON checkins(crew_id, at);`)
  db.prepare('INSERT OR IGNORE INTO crew(id, profile) VALUES (?, ?)').run('crew-02', JSON.stringify({
    id: 'crew-02', displayName: 'Crew member 02', missionDay: 47, source: 'simulated',
    baselineVersion: 'crew-02-demo-v1',
    baseline: { heartRate: 62, bloodPressure: 116, bloodPressureDiastolic: 74, sleep: 7.2, temperature: 36.6, spo2: 97, respiratoryRate: 14, bodyMass: 74 },
  }))
  initializeMedical(db)
  // Existing databases gain traceability without inventing collection provenance.
  db.exec('BEGIN')
  try {
    for (const row of db.prepare('SELECT id, payload FROM checkins WHERE id NOT IN (SELECT checkin_id FROM observations)').all()) {
      storeObservations(db, row.id as string, JSON.parse(row.payload as string) as CheckInInput, true)
    }
    db.exec('COMMIT')
  } catch (error) { db.exec('ROLLBACK'); db.close(); throw error }
  return db
}
