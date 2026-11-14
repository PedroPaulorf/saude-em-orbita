import { test, expect, type Page } from '@playwright/test'

async function login(page: Page, username: string) {
  await page.getByLabel('Username', { exact: true }).fill(username)
  await page.getByLabel('Password', { exact: true }).fill('browser-fixture-password-29')
  await page.getByRole('button', { name: 'Sign in', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Log out', exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Sync now', exact: true })).toBeEnabled()
}

test('medical data uses the signed-in history and private saved scenarios on desktop and mobile', async ({ page }) => {
  await page.route('**/DONKI-API/**', route => route.abort())
  await page.goto('/')
  await login(page, 'crew03')
  const written = await page.request.post('http://127.0.0.1:3003/api/v1/me/checkins', {
    headers: { 'X-Requested-With': 'Health7', 'X-Health7-Crew': 'crew-03' },
    data: { clientId: 'medical-browser-fixture', at: new Date().toISOString(), source: 'simulated', vitals: { sleep: 5.1 }, behavioral: {}, provenance: { sleep: { method: 'manual', quality: 'simulated' } } },
  })
  expect(written.status()).toBe(201)
  await page.getByRole('button', { name: 'Sync now', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Sync now', exact: true })).toBeEnabled()
  await page.getByRole('link', { name: 'Medical data & sources', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Medical data & sources', exact: true })).toBeVisible()
  await page.getByText('Latest stored assessment', { exact: true }).click()
  await expect(page.getByText(/Rule: health7-demo-/).first()).toBeVisible()
  await expect(page.getByText(/clinical validation|demonstration thresholds/).first()).toBeVisible()
  await page.getByRole('button', { name: 'Simulate & save scenario', exact: true }).click()
  await page.getByText(/180 days, 4 crew/).first().click()
  await expect(page.getByText(/Mean events:/).first()).toBeVisible()
  await page.screenshot({ path: 'test-results/medical-data-desktop.png', fullPage: true })
  await page.setViewportSize({ width: 390, height: 844 })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  await page.screenshot({ path: 'test-results/medical-data-mobile.png', fullPage: true })
  const saved = await page.request.get('http://127.0.0.1:3003/api/v1/me/simulations')
  const scenarioId = (await saved.json()).items[0].id
  await page.getByRole('button', { name: 'Log out', exact: true }).click()
  await login(page, 'crew02')
  const other = await page.request.get(`http://127.0.0.1:3003/api/v1/me/simulations/${scenarioId}`)
  expect(other.status()).toBe(404)
  await page.goto('/#/data')
  await page.getByRole('button', { name: 'Sync & load saved scenarios', exact: true }).click()
  await expect(page.getByText(/180 days, 4 crew/)).toHaveCount(0)
})
