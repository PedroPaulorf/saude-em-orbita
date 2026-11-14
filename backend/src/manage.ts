import { openDatabase, migrate } from './database.js'
import { seedDemo } from './seed.js'
const pool = openDatabase(process.env.DATABASE_URL ?? '')
try {
  await migrate(pool)
  if (process.argv[2] === 'seed') await seedDemo(pool, process.env.DEMO_PASSWORD ?? '')
  console.log(process.argv[2] === 'seed' ? 'Demo accounts ensured (existing passwords unchanged).' : 'Migrations applied.')
} finally { await pool.end() }
