import { test, expect } from '@playwright/test'
import { login } from './helpers'

test('large Apple activity files resume after network failure and deduplicate reimports', async ({ page }) => {
  test.setTimeout(90_000)
  await page.route('**/DONKI-API/**', route => route.abort())
  await page.goto('/'); await login(page, 'crew02'); await page.goto('/#/integrations')
  const types = [['StepCount', 'count', '20'], ['DistanceWalkingRunning', 'km', '0.4'], ['WalkingSpeed', 'km/hr', '3.6'], ['ActiveEnergyBurned', 'kcal', '20'], ['BasalEnergyBurned', 'kJ', '4.184']]
  const xml = '<HealthData>' + Array.from({ length: 1501 }, (_, i) => {
    const [type, unit, value] = types[i % types.length], date = new Date(Date.UTC(2026, 10, 1, 0, i)).toISOString()
    return `<Record type="HKQuantityTypeIdentifier${type}" sourceName="Fictional import verification" unit="${unit}" value="${value}" startDate="${date}" endDate="${date}"/>`
  }).join('') + '</HealthData>'
  async function select() {
    await page.getByLabel('Measurement file', { exact: true }).setInputFiles({ name: 'export.xml', mimeType: 'text/xml', buffer: Buffer.from(xml) })
    await expect(page.getByRole('heading', { name: 'Import preview', exact: true })).toBeVisible()
    await page.getByRole('checkbox').check()
  }
  let calls = 0
  await page.route('**/me/wearables/imports', route => ++calls === 2 ? route.abort() : route.continue())
  await select(); await page.getByRole('button', { name: 'Save imported measurements', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('Import interrupted')
  await page.getByRole('button', { name: 'Resume import', exact: true }).click()
  await expect(page.getByText('Import saved: 1501 added, 0 duplicates. No medical assessment was generated.', { exact: true })).toBeVisible()
  await select(); await page.getByRole('button', { name: 'Save imported measurements', exact: true }).click()
  await expect(page.getByText('Import saved: 0 added, 1501 duplicates. No medical assessment was generated.', { exact: true })).toBeVisible()
})
