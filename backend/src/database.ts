import { DatabaseSync } from 'node:sqlite'
import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'

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
    baseline: { heartRate: 62, bloodPressure: 116, bloodPressureDiastolic: 74, sleep: 7.2, temperature: 36.6 },
  }))
  return db
}
