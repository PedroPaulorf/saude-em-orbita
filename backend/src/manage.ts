import { openDatabase, migrate } from './database.js'
import { seedDemo } from './seed.js'
import { createDemoUser } from './users.js'
const command = process.argv[2]
if (command && !['seed', 'create-user'].includes(command)) throw new Error('Unknown management command')
if (command === 'create-user' && (!process.argv[3] || !process.env.NEW_USER_PASSWORD))
  throw new Error('Usage: set NEW_USER_PASSWORD, then npm run user:create -- USERNAME')
const pool = openDatabase(process.env.DATABASE_URL ?? '')
try {
  await migrate(pool)
  if (command === 'seed') await seedDemo(pool, process.env.DEMO_PASSWORD ?? '')
  if (command === 'create-user') {
    const user = await createDemoUser(pool, process.argv[3]!, process.env.NEW_USER_PASSWORD!)
    console.log('Created demo account: ' + user.username)
  } else console.log(command === 'seed' ? 'Demo accounts ensured (existing passwords unchanged).' : 'Migrations applied.')
} finally { await pool.end() }
