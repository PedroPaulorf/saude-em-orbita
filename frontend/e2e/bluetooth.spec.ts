import { test, expect } from '@playwright/test'
import { login } from './helpers'

test.beforeEach(async ({ page }) => {
  await page.route('**/DONKI-API/**', route => route.abort())
})
test('Bluetooth receives HRS, requires save consent, retries an immutable snapshot and disconnects on logout', async ({ page }) => {
  await page.addInitScript(() => {
    const w = window as any
    w.bleRequests = 0; w.bleDisconnects = 0
    const characteristic = new EventTarget() as any
    characteristic.startNotifications = async () => characteristic
    characteristic.stopNotifications = async () => characteristic
    const device = new EventTarget() as any
    device.id = 'test-fixture-only'; device.name = 'Wear OS test transmitter'
    device.gatt = {
      connected: false,
      async connect() { this.connected = true; return this },
      disconnect() { this.connected = false; w.bleDisconnects++ },
      async getPrimaryService() { return { async getCharacteristic() { return characteristic } } },
    }
    w.sendHeartRate = (bpm: number) => {
      characteristic.value = new DataView(Uint8Array.from([6, bpm]).buffer)
      characteristic.dispatchEvent(new Event('characteristicvaluechanged'))
    }
    Object.defineProperty(navigator, 'bluetooth', { configurable: true, value: {
      async requestDevice(options: any) {
        w.bleRequests++; w.bleOptions = options
        return device
      },
    } })
  })
  await page.goto('/'); await login(page, 'crew02')
  await page.getByRole('link', { name: 'Connect watch via Bluetooth', exact: true }).click()
  const panel = page.locator('#bluetooth-connection')
  expect(await page.evaluate(() => (window as any).bleRequests)).toBe(0)
  await panel.getByRole('button', { name: 'Connect Bluetooth', exact: true }).click()
  await expect(panel.getByRole('status').filter({ hasText: 'Bluetooth status: connected' })).toBeVisible()
  expect(await page.evaluate(() => (window as any).bleOptions)).toEqual({ filters: [{ services: ['heart_rate'] }] })
  await page.evaluate(() => (window as any).sendHeartRate(72))
  await expect(panel.getByText('72 bpm', { exact: true })).toBeVisible()
  const posts: any[] = []
  await page.route('**/api/v1/me/wearables/imports', async route => {
    posts.push(route.request().postDataJSON())
    if (posts.length === 1) await route.abort(); else await route.continue()
  })
  await expect(panel.getByRole('button', { name: 'Save current Bluetooth reading', exact: true })).toBeDisabled()
  expect(posts.length).toBe(0)
  await panel.getByRole('checkbox', { name: /I authorize saving/ }).check()
  await panel.getByRole('button', { name: 'Save current Bluetooth reading', exact: true }).click()
  await expect(panel.getByRole('alert')).toContainText('Could not confirm saving')
  await page.evaluate(() => (window as any).sendHeartRate(74))
  await panel.getByRole('button', { name: 'Retry Bluetooth reading', exact: true }).click()
  await expect(panel.getByText(/Bluetooth reading saved: 1 added/)).toBeVisible()
  expect(posts[0]).toEqual(posts[1]); expect(posts[1].samples[0].value).toBe(72)
  await expect(page.getByText('Heart rate: 72 bpm', { exact: true })).toBeVisible()
  await page.clock.install()
  await page.clock.fastForward(16000)
  await expect(panel.getByRole('button', { name: 'Save current Bluetooth reading', exact: true })).toBeDisabled()
  await expect(panel.getByText(/No fresh reading in the last 15 seconds/)).toBeVisible()
  await page.evaluate(() => (window as any).sendHeartRate(75))
  await expect(panel.getByRole('button', { name: 'Save current Bluetooth reading', exact: true })).toBeEnabled()
  await page.screenshot({ path: 'test-results/bluetooth-desktop.png', fullPage: true })
  await page.setViewportSize({ width: 390, height: 844 })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await page.screenshot({ path: 'test-results/bluetooth-mobile.png', fullPage: true })
  await page.getByRole('button', { name: 'Log out', exact: true }).click()
  expect(await page.evaluate(() => (window as any).bleDisconnects)).toBe(1)
  await login(page, 'crew03')
  await page.goto('/#/integrations')
  await expect(page.getByText('0 imported samples saved for this account.', { exact: true })).toBeVisible()
  await expect(page.getByText('72 bpm', { exact: true })).toHaveCount(0)
})

test('unsupported browsers show a disabled connect button and an explanation', async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(navigator, 'bluetooth', { configurable: true, value: undefined }))
  await page.goto('/'); await login(page, 'crew03'); await page.goto('/#/integrations')
  const panel = page.locator('#bluetooth-connection')
  await expect(panel.getByRole('button', { name: 'Connect Bluetooth', exact: true })).toBeDisabled()
  await expect(panel.getByText(/Web Bluetooth is unavailable/)).toBeVisible()
})

test('Galaxy Fit3 offers a phone bridge APK and reports a confirmed Samsung Health upload', async ({ page }) => {
  await page.goto('/'); await login(page, 'crew03'); await page.goto('/#/integrations')
  const panel = page.locator('#fit3-connection')
  await panel.getByRole('button', { name: 'Connect Samsung Galaxy Fit3 via phone', exact: true }).click()
  await expect(panel.getByText(/Android 14 or later phone/)).toBeVisible()
  const apk = panel.getByRole('link', { name: /Download Health7 Fit3 Bridge/ })
  const response = await page.request.get((await apk.getAttribute('href'))!)
  expect(response.status()).toBe(200)
  expect((await response.body()).subarray(0, 2).toString()).toBe('PK')
  const imported = await page.request.post('http://127.0.0.1:3003/api/v1/me/wearables/imports', {
    headers: { 'X-Requested-With': 'Health7', 'X-Health7-Crew': 'crew-03' },
    data: { clientId: 'fit3-phone-fixture', version: 1, source: 'samsung', format: 'samsung-health-connect-v1', quality: 'unverified',
      samples: [{ metric: 'heartRate', device: 'Samsung Health | SM-R390 fixture', value: 76, unit: 'bpm', at: new Date().toISOString() }] },
  })
  expect(imported.status()).toBe(201)
  await page.getByRole('button', { name: 'Refresh imported history', exact: true }).click()
  await expect(panel.getByRole('status')).toContainText('Phone upload received:')
  await expect(page.getByText('Uploaded by Android phone · Samsung Health / Health Connect', { exact: true })).toBeVisible()
})

test('device history loads records beyond the first 100 without replacing the newest page', async ({ page }) => {
  await page.goto('/'); await login(page, 'crew02')
  const saved = await page.request.post('http://127.0.0.1:3003/api/v1/me/wearables/imports', {
    headers: { 'X-Requested-With': 'Health7', 'X-Health7-Crew': 'crew-02' },
    data: { clientId: 'pagination-browser', version: 1, source: 'samsung', format: 'health7-json-v1', quality: 'example',
      samples: Array.from({ length: 105 }, (_, i) => ({ device: 'Pagination fixture ' + i, metric: 'heartRate', value: 60, unit: 'bpm', at: new Date(Date.UTC(2026, 0, 1, 0, i)).toISOString() })) },
  })
  expect(saved.status()).toBe(201)
  await page.goto('/#/integrations')
  await expect(page.getByRole('button', { name: 'Load older measurements', exact: true })).toBeVisible()
  await expect(page.getByText(/· Pagination fixture 0$/)).toHaveCount(0)
  await page.getByRole('button', { name: 'Load older measurements', exact: true }).click()
  await expect(page.getByText(/· Pagination fixture 0$/)).toBeVisible()
  await expect(page.getByText('Heart rate: 72 bpm', { exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Load older measurements', exact: true })).toHaveCount(0)
})
