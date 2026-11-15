import { createApp } from './app.js'
const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) throw new Error('DATABASE_URL is required')
const port = Number(process.env.PORT ?? 3001)
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Invalid PORT')
const secureCookies = process.env.COOKIE_SECURE === 'true'
if (process.env.NODE_ENV === 'production' && !secureCookies) throw new Error('Production requires COOKIE_SECURE=true and HTTPS')
const aiUrl = process.env.AI_PROVIDER_URL
if (aiUrl) {
  if (!process.env.AI_MODEL_VERSION) throw new Error('AI_MODEL_VERSION is required for provider provenance')
  const parsed = new URL(aiUrl)
  if (!['http:', 'https:'].includes(parsed.protocol) || (process.env.NODE_ENV === 'production' && parsed.protocol !== 'https:')) throw new Error('AI provider requires HTTP(S), HTTPS in production')
}
const timeoutMs = Number(process.env.AI_PROVIDER_TIMEOUT_MS ?? 5000)
if (!Number.isInteger(timeoutMs) || timeoutMs < 100 || timeoutMs > 30000) throw new Error('AI provider timeout must be 100..30000 milliseconds')
const app = await createApp({ databaseUrl, logger: true, secureCookies,
  origins: (process.env.CORS_ORIGINS ?? 'http://localhost:5173').split(',').map(v => v.trim()).filter(Boolean),
  aiProvider: aiUrl ? { url: aiUrl, name: process.env.AI_PROVIDER_NAME ?? 'configured-http-provider', modelVersion: process.env.AI_MODEL_VERSION!, apiKey: process.env.AI_PROVIDER_KEY, timeoutMs } : undefined,
})
for (const signal of ['SIGINT', 'SIGTERM'] as const) process.once(signal, () => { app.close().catch(error => { app.log.error(error); process.exitCode = 1 }) })
try { await app.listen({ host: process.env.HOST ?? '127.0.0.1', port }) }
catch (error) { app.log.error(error); await app.close(); process.exitCode = 1 }

if (process.env.NEXUS_AUTO_REANCHOR === 'true' && !process.exitCode) {
  const { reanchorNexusIfStale } = await import('./import-nexus.js')
  let running = false
  const tick = async () => {
    if (running) return
    running = true
    try { await reanchorNexusIfStale(databaseUrl, process.env.DEMO_PASSWORD, line => app.log.info(line)) }
    catch (error) { app.log.error(error) } finally { running = false }
  }
  await tick()
  setInterval(tick, 10 * 60 * 1000).unref()
}
