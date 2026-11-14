import { test, expect, type Page } from '@playwright/test'

async function login(page: Page, username: string) {
  await page.getByLabel('Username', { exact: true }).fill(username)
  await page.getByLabel('Password', { exact: true }).fill('browser-fixture-password-29')
  await page.getByRole('button', { name: 'Sign in', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Log out', exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Sync now', exact: true })).toBeEnabled()
}

async function checkup(page: Page, sleep: string) {
  await page.goto('/#/check/health')
  const answers = [
    ['Resting heart rate', '71'], ['Blood pressure (systolic/diastolic)', '118/76'],
    ['Sleep', sleep], ['Body temperature', '36.7'],
  ]
  for (const [label, value] of answers) {
    await page.getByLabel(label, { exact: true }).fill(value)
    await page.getByRole('button', { name: 'Next', exact: true }).click()
  }
  for (let i = 0; i < 3; i++) {
    await page.getByRole('radio', { name: '3', exact: true }).click()
    await page.getByRole('button', { name: i === 2 ? 'Save check-in' : 'Next', exact: true }).click()
  }
  await expect(page.getByRole('heading', { name: 'Home', exact: true })).toBeAttached()
}

test.beforeEach(async ({ page }) => {
  await page.route('**/DONKI-API/**', route => route.abort())
  await page.goto('/')
})

test('login selects female avatar, head shows own sleep and switching accounts clears personal data', async ({ page }) => {
  await page.getByLabel('Username', { exact: true }).fill('crew03')
  await page.getByLabel('Password', { exact: true }).fill('incorrect-password')
  await page.getByRole('button', { name: 'Sign in', exact: true }).click()
  await expect(page.getByRole('alert')).toBeVisible()
  await login(page, 'crew03')
  await expect(page.locator('[data-body-model="female"]')).toBeVisible()
  await page.getByRole('button', { name: /^Head:/ }).first().click()
  await expect(page.getByRole('heading', { name: /Head/ }).first()).toBeVisible()
  await expect(page.getByText('No sleep measurements recorded.', { exact: true })).toBeVisible()
  await checkup(page, '5.1')
  const symptom = await page.request.post('http://127.0.0.1:3003/api/v1/me/symptoms', {
    headers: { 'X-Requested-With': 'Health7', 'X-Health7-Crew': 'crew-03' },
    data: { clientId: 'browser-head-symptom', at: new Date().toISOString(), bodyPart: 'head', severity: 2, label: 'Browser fixture head symptom' },
  })
  expect(symptom.status()).toBe(201)
  await page.getByRole('button', { name: 'Sync now', exact: true }).click()
  await page.getByRole('button', { name: /^Head:/ }).first().click()
  await expect(page.getByText(/5\.1/).first()).toBeVisible()
  await expect(page.getByRole('heading', { name: /^Browser fixture head symptom/ })).toBeVisible()
  await page.screenshot({ path: 'test-results/avatar-head.png', fullPage: true })
  await page.reload()
  await expect(page.getByRole('button', { name: 'Log out', exact: true })).toBeVisible()
  await expect(page.getByText(/5\.1/).first()).toBeVisible()
  await page.getByRole('button', { name: 'Log out', exact: true }).click()
  await login(page, 'crew02')
  await expect(page.locator('[data-body-model="male"]')).toBeVisible()
  await page.getByRole('button', { name: /^Head:/ }).first().click()
  await expect(page.getByText(/5\.1/)).toHaveCount(0)
  await expect(page.getByRole('heading', { name: /^Browser fixture head symptom/ })).toHaveCount(0)
  await page.goto('/#/stats?region=constructor')
  await expect(page.getByRole('heading', { name: 'Head', exact: true })).toBeVisible()
})

test('disconnected writes remain queued and reconnect sync does not duplicate a check-in', async ({ page }) => {
  await login(page, 'crew02')
  await page.route('**/api/v1/me/checkins', route => route.request().method() === 'POST' ? route.abort() : route.continue())
  await checkup(page, '6.2')
  await expect(page.getByRole('status').filter({ hasText: /pending|queued|offline|sync/i }).first()).toBeVisible()
  await page.unroute('**/api/v1/me/checkins')
  await page.getByRole('button', { name: 'Sync now', exact: true }).click()
  await expect.poll(async () => {
    const result = await page.request.get('http://127.0.0.1:3003/api/v1/me/checkins')
    const body = await result.json()
    return body.items?.filter((row: { vitals: { sleep: number } }) => row.vitals.sleep === 6.2).length
  }).toBe(1)
  await page.getByRole('button', { name: 'Sync now', exact: true }).click()
  const response = await page.request.get('http://127.0.0.1:3003/api/v1/me/checkins')
  expect((await response.json()).items.filter((row: { vitals: { sleep: number } }) => row.vitals.sleep === 6.2)).toHaveLength(1)
})

test('expired session clears private screens and asks for sign-in', async ({ page }) => {
  await login(page, 'crew03')
  await page.request.post('http://127.0.0.1:3003/api/v1/auth/logout', { headers: { 'X-Requested-With': 'Health7' } })
  await page.getByRole('button', { name: 'Sync now', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Sign in', exact: true })).toBeVisible()
  await expect(page.locator('[data-body-model]')).toHaveCount(0)
})

test('a pending record is uploaded only after its owner signs in again', async ({ page }) => {
  await login(page, 'crew03')
  await page.route('**/api/v1/me/checkins', route => route.request().method() === 'POST' ? route.abort() : route.continue())
  await checkup(page, '7.4')
  await page.getByRole('button', { name: 'Log out', exact: true }).click()
  await page.unroute('**/api/v1/me/checkins')
  await login(page, 'crew02')
  const other = await page.request.get('http://127.0.0.1:3003/api/v1/me/checkins')
  expect((await other.json()).items.some((row: { vitals: { sleep: number } }) => row.vitals.sleep === 7.4)).toBe(false)
  await page.getByRole('button', { name: 'Log out', exact: true }).click()
  await login(page, 'crew03')
  const own = await page.request.get('http://127.0.0.1:3003/api/v1/me/checkins')
  expect((await own.json()).items.filter((row: { vitals: { sleep: number } }) => row.vitals.sleep === 7.4)).toHaveLength(1)
})
