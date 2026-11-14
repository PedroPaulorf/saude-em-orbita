import { createApp } from './app.js'

const apiKey = process.env.API_KEY
if (!apiKey || apiKey.length < 16) throw new Error('Set API_KEY with at least 16 characters before starting')
const port = Number(process.env.PORT ?? 3001)
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Invalid PORT')
const app = createApp({
  apiKey, databasePath: process.env.DATABASE_PATH ?? './data/health7.sqlite', logger: true,
  origins: (process.env.CORS_ORIGINS ?? 'http://localhost:5173').split(',').map((value) => value.trim()).filter(Boolean),
})
for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.once(signal, () => { app.close().catch((error) => { app.log.error(error); process.exitCode = 1 }) })
}
try { await app.listen({ host: process.env.HOST ?? '127.0.0.1', port }) }
catch (error) { app.log.error(error); await app.close(); process.exitCode = 1 }
