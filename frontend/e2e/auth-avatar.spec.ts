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
  for (const [i, [label, value]] of answers.entries()) {
    await page.getByLabel(label, { exact: true }).fill(value)
    await page.getByRole('button', { name: i === answers.length - 1 ? 'Save check-up' : 'Next', exact: true }).click()
  }
  await page.getByRole('link', { name: 'Back to Home', exact: true }).click()
  await page.goto('/#/check/behavioral')
  for (let i = 0; i < 3; i++) {
    await page.getByRole('radio', { name: '3', exact: true }).click()
    await page.getByRole('button', { name: i === 2 ? 'Save check-in' : 'Next', exact: true }).click()
  }
  await page.getByRole('link', { name: 'Back to Home', exact: true }).click()
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
  await expect(page.getByRole('heading', { name: 'Head · Personal records', exact: true })).toBeVisible()
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
  await rejectedCheckup(page)
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

test('prevention, progress, scenario and companion remain available with account-scoped local data', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await login(page, 'crew03')
  await page.getByRole('button', { name: '250 ml', exact: true }).click()
  await page.getByRole('button', { name: 'Open companion', exact: true }).click()
  await page.getByPlaceholder('Write a message', { exact: true }).fill('Private crew03 demo message')
  await page.getByRole('button', { name: 'Send message', exact: true }).click()
  await expect(page.getByText('Demo reply', { exact: true })).toBeVisible()
  await page.getByRole('dialog', { name: 'Companion', exact: true }).getByRole('button', { name: 'Close companion', exact: true }).click()
  await page.goto('/#/prevention')
  await expect(page.getByRole('heading', { name: 'Prevention', exact: true })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Mission exposure', exact: true })).toBeVisible()
  await page.goto('/#/progress')
  await expect(page.getByRole('heading', { name: 'Progress', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Simulated data', exact: true }).click()
  await page.getByRole('radio', { name: /Day 3/ }).click()
  await page.getByRole('button', { name: 'Load scenario', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Prevention', exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Sync now', exact: true })).toBeEnabled()
  await page.screenshot({ path: 'test-results/prevention-merged.png', fullPage: true })
  await page.getByRole('button', { name: 'Log out', exact: true }).click()
  await login(page, 'crew02')
  await page.getByRole('button', { name: 'Open companion', exact: true }).click()
  await expect(page.getByText('Private crew03 demo message', { exact: true })).toHaveCount(0)
  const accountData = await page.evaluate(() => ({
    water: localStorage.getItem('health7:water:v2:crew-03'),
    otherWater: localStorage.getItem('health7:water:v2:crew-02'),
    plans: localStorage.getItem('health7:plans:v1:crew-03'),
    otherPlans: localStorage.getItem('health7:plans:v1:crew-02'),
  }))
  expect(accountData.water).not.toBeNull()
  expect(accountData.plans).not.toBeNull()
  expect(accountData.otherWater).toBeNull()
  expect(accountData.otherPlans).toBeNull()
  expect(errors).toEqual([])
})

async function rejectedCheckup(page: Page) {
  await page.goto('/#/check/health')
  await page.getByLabel('Resting heart rate', { exact: true }).fill('70')
  await page.getByRole('button', { name: 'Next', exact: true }).click()
  await page.getByLabel('Blood pressure (systolic/diastolic)', { exact: true }).fill('118/76')
  await page.getByRole('button', { name: 'Next', exact: true }).click()
  await page.getByLabel('Sleep', { exact: true }).fill('25')
  await page.getByRole('button', { name: 'Next', exact: true }).click()
  await expect(page.getByText('Type hours of sleep from 0 to 24.', { exact: true })).toBeVisible()
  await page.getByLabel('Sleep', { exact: true }).fill('5.5')
  await page.getByRole('button', { name: 'Next', exact: true }).click()
  await page.getByLabel('Body temperature', { exact: true }).fill('36.7')
  await page.route('**/api/v1/me/checkins', route => route.request().method() === 'POST'
    ? route.fulfill({ status: 400, contentType: 'application/json', body: JSON.stringify({ message: 'Invalid fixture measurement' }) })
    : route.continue())
  await page.getByRole('button', { name: 'Save check-up', exact: true }).click()
  await expect(page.getByRole('alert').filter({ hasText: /rejected/ })).toBeVisible()
  await expect(page.getByLabel('Body temperature', { exact: true })).toHaveValue('36.7')
  await expect(page.getByRole('heading', { name: 'Saved to server.', exact: true })).toHaveCount(0)
  await page.unroute('**/api/v1/me/checkins')
  await page.getByRole('button', { name: 'Save check-up', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Saved to server.', exact: true })).toBeVisible()
}
