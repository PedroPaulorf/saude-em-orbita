import { test, expect } from '@playwright/test'
import { createRequire } from 'node:module'

test('stats and report retain assessment evidence when the current personal baseline changes', async ({ page }) => {
  await page.route('**/DONKI-API/**', route => route.abort())
  await page.goto('/')
  await page.getByLabel('Username', { exact: true }).fill('crew02')
  await page.getByLabel('Password', { exact: true }).fill('browser-fixture-password-29')
  await page.getByRole('button', { name: 'Sign in', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Sync now', exact: true })).toBeEnabled()
  const vitals = { sleep: 5.1, heartRate: 71, bloodPressure: 118, bloodPressureDiastolic: 76, temperature: 36.7 }
  const saved = await page.request.post('http://127.0.0.1:3003/api/v1/me/checkins', {
    headers: { 'X-Requested-With': 'Health7', 'X-Health7-Crew': 'crew-02' },
    data: { clientId: 'stats-evidence', at: new Date().toISOString(), source: 'simulated', vitals, behavioral: {},
      provenance: Object.fromEntries(Object.keys(vitals).map(id => [id, { method: 'manual', quality: 'simulated' }])) },
  })
  expect(saved.status()).toBe(201)
  // This is the schema created by the browser-test runner, never the demo database.
  if (!process.env.HEALTH7_E2E_DATABASE_URL) throw new Error('Isolated test schema required')
  const pg = createRequire(new URL('../../backend/package.json', import.meta.url))('pg')
  const db = new pg.Pool({ connectionString: process.env.HEALTH7_E2E_DATABASE_URL })
  try { await db.query("UPDATE crew SET profile=jsonb_set(profile,'{baseline,sleep}','5.1'::jsonb) WHERE id='crew-02'") }
  finally { await db.end() }

  await page.goto('/#/stats?region=head')
  await page.reload()
  await expect(page.getByRole('button', { name: 'Sync now', exact: true })).toBeEnabled()
  const today = page.getByRole('region', { name: "Today's measures", exact: true })
  await expect(today.getByText('Manual entry · Simulated data')).toHaveCount(4)
  const region = page.locator('#region-panel')
  await region.getByText('Why this state?', { exact: true }).click()
  await expect(region.getByText(/baseline used for this record \(7\.2 h\)/)).toBeVisible()
  await expect(region.getByText('Saved assessment', { exact: true })).toBeVisible()
  const history = page.getByRole('heading', { name: 'Head · Personal records', exact: true }).locator('..')
  await expect(history.getByText(/Current personal baseline: 5\.1 h/)).toBeVisible()
  await history.getByText('Measurement details', { exact: true }).click()
  await expect(history.getByText(/baseline used for this record \(7\.2 h\)/)).toBeVisible()
  await history.getByText('Assessment record', { exact: true }).click()
  await expect(history.getByText('health7-demo-2026-11-14-v1', { exact: true })).toBeVisible()
  // Capture at the top so sticky navigation is shown in its normal position.
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.screenshot({ path: 'test-results/stats-evidence-desktop.png', fullPage: true })
  await page.setViewportSize({ width: 390, height: 844 })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.screenshot({ path: 'test-results/stats-evidence-mobile.png', fullPage: true })

  await page.goto('/#/')
  await page.getByRole('button', { name: 'Open report', exact: true }).click()
  const report = page.getByRole('dialog', { name: 'Report for ground', exact: true })
  const sleep = report.getByRole('listitem').filter({ has: page.getByText('Sleep', { exact: true }) })
  await sleep.getByText('Why this state?', { exact: true }).click()
  await expect(sleep.getByText(/baseline used for this record \(7\.2 h\)/)).toBeVisible()
  await report.getByRole('button', { name: 'Close', exact: true }).click()
  await page.goto('/#/stats')
  await page.getByRole('link', { name: 'Sources & methodology', exact: true }).click()
  await expect(page.locator('#research-sources')).toBeInViewport()
  await page.goto('/#/progress')
  await page.getByRole('link', { name: 'Explore mission scenarios', exact: true }).click()
  await expect(page.locator('#mission-scenarios')).toBeInViewport()
  // A different account cannot see the measurement or its archived assessment.
  await page.getByRole('button', { name: 'Log out', exact: true }).click()
  await page.getByLabel('Username', { exact: true }).fill('crew03')
  await page.getByLabel('Password', { exact: true }).fill('browser-fixture-password-29')
  await page.getByRole('button', { name: 'Sign in', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Sync now', exact: true })).toBeEnabled()
  await page.goto('/#/stats?region=head')
  await expect(page.getByText('No sleep measurements recorded.', { exact: true })).toBeVisible()
  await expect(page.getByText('Measurement details', { exact: true })).toHaveCount(0)
})
