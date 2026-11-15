import { test, expect } from '@playwright/test'

test('Apple XML distinguishes unsupported data, empty exports and valid measurements', async ({ page }) => {
  await page.goto('/')
  const result = await page.evaluate(async () => {
    // Vite serves this module in the same browser environment as the importer.
    const { parseAppleXml } = await import('/src/lib/wearables.ts' as string)
    const error = (xml: string) => { try { parseAppleXml(xml); return '' } catch (e) { return (e as Error).message } }
    return {
      steps: error('<HealthData><Record type="HKQuantityTypeIdentifierDietarySodium" value="300"/></HealthData>'),
      empty: error('<HealthData/>'),
      count: parseAppleXml('<HealthData><Record type="HKQuantityTypeIdentifierHeartRate" sourceName="Test" unit="count/min" value="70" startDate="2026-11-14 12:00:00 +0000" endDate="2026-11-14 12:00:00 +0000"/></HealthData>').samples.length,
    }
  })
  expect(result.steps).toContain('No supported measurements')
  expect(result.steps).toContain('DietarySodium (1)')
  expect(result.steps).not.toContain('1–500')
  expect(result.empty).toContain('No Record entries')
  expect(result.count).toBe(1)
})
