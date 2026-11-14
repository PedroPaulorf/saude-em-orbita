import pg from 'pg'
import { readFile, readdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { createHash } from 'node:crypto'

export function openDatabase(databaseUrl: string) {
  if (!databaseUrl) throw new Error('DATABASE_URL is required')
  return new pg.Pool({ connectionString: databaseUrl, max: 10, connectionTimeoutMillis: 5000, statement_timeout: 10000 })
}

/** Transactional, schema-scoped lock serializes concurrent application starts. */
export async function migrate(pool: pg.Pool) {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    await client.query("SELECT pg_advisory_xact_lock(hashtextextended(current_database() || ':' || current_schema() || ':health7-migrations', 0))")
    await client.query('CREATE TABLE IF NOT EXISTS schema_migrations(version text PRIMARY KEY, checksum text NOT NULL, applied_at timestamptz NOT NULL DEFAULT now())')
    const directory = fileURLToPath(new URL('../migrations/', import.meta.url))
    for (const version of (await readdir(directory)).filter(name => /^\d+.*\.sql$/.test(name)).sort()) {
      const sql = (await readFile(directory + '/' + version, 'utf8')).replace(/\r\n/g, '\n')
      const checksum = createHash('sha256').update(sql).digest('hex')
      // Accept a legacy Windows checksum only when the SQL differs solely in line endings.
      const windowsChecksum = createHash('sha256').update(sql.replace(/\n/g, '\r\n')).digest('hex')
      const existing = await client.query('SELECT checksum FROM schema_migrations WHERE version = $1', [version])
      if (existing.rowCount) {
        if (![checksum, windowsChecksum].includes(existing.rows[0].checksum)) throw new Error('Applied migration changed: ' + version)
        continue
      }
      await client.query(sql)
      await client.query('INSERT INTO schema_migrations(version, checksum) VALUES ($1, $2)', [version, checksum])
    }
    await client.query('COMMIT')
  } catch (error) { await client.query('ROLLBACK'); throw error }
  finally { client.release() }
}
