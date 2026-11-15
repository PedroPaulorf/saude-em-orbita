import { test, expect } from '@playwright/test'

const profiles = [
  { username: 'crew02', name: 'Demo astronaut', role: null, bodyModel: 'male' },
  { username: 'nx04', name: 'NEXUS 04', role: 'Crew', bodyModel: 'female' },
  { username: 'custom-account', name: 'Other astronaut', role: null, bodyModel: 'female' },
]

test.beforeEach(async ({ page }) => {
  await page.route('**/api/v1/me', route => route.fulfill({ status: 401, json: { message: 'Authentication required' } }))
})

test('a demo avatar fills the password and Enter submits it without typing', async ({ page }) => {
  await page.route('**/api/v1/auth/profiles', route => route.fulfill({ json: { profiles } }))
  await page.route('**/api/v1/auth/login', route => route.fulfill({ status: 401, json: { message: 'Invalid credentials' } }))
  await page.goto('/#/login')
  await page.locator('[data-profile="nx04"]').click()
  const password = page.getByLabel('Password', { exact: true })
  await expect(password).toHaveValue(process.env.VITE_DEMO_PASSWORD || 'senha123')
  await expect(password).toBeFocused()
  const request = page.waitForRequest('**/api/v1/auth/login')
  await page.keyboard.press('Enter')
  expect((await request).postDataJSON()).toEqual({ username: 'nx04', password: process.env.VITE_DEMO_PASSWORD || 'senha123' })
  await expect(page.getByRole('alert')).toHaveText('Incorrect password.')
  // A transient sign-in failure must not make the visitor retype the demo password.
  await expect(password).toHaveValue(process.env.VITE_DEMO_PASSWORD || 'senha123')
  await page.getByRole('button', { name: 'Choose another profile' }).click()
  await page.locator('[data-profile="crew02"]').click()
  await expect(password).toHaveValue(process.env.VITE_DEMO_PASSWORD || 'senha123')
})

test('manual and additional accounts keep their own empty password field', async ({ page }) => {
  await page.route('**/api/v1/auth/profiles', route => route.fulfill({ json: { profiles } }))
  await page.goto('/#/login')
  await page.locator('[data-profile="crew02"]').click()
  await page.getByRole('button', { name: 'Choose another profile' }).click()
  await page.getByRole('button', { name: 'Use another account' }).click()
  await expect(page.getByLabel('Username', { exact: true })).toBeVisible()
  await expect(page.getByLabel('Password', { exact: true })).toHaveValue('')
  await page.keyboard.press('Escape')
  await page.locator('[data-profile="custom-account"]').click()
  await expect(page.getByLabel('Password', { exact: true })).toHaveValue('')
  await expect(page.locator('#demo-password-hint')).toHaveCount(0)
})

for (const failure of ['offline', 'server error', 'older API'] as const) {
  test(`profile loading reports ${failure} and retry restores the avatars`, async ({ page }) => {
    let available = false
    await page.route('**/api/v1/auth/profiles', route => {
      if (available) return route.fulfill({ json: { profiles } })
      return failure === 'offline' ? route.abort('failed') : route.fulfill({ status: failure === 'older API' ? 404 : 503, json: { message: 'Unavailable' } })
    })
    await page.goto('/#/login')
    await expect(page.getByRole('heading', { name: 'Demo temporarily unavailable' })).toBeVisible()
    await expect(page.getByLabel('Username', { exact: true })).toHaveCount(0)
    // The optional manual path can still return to the status and retry.
    await page.getByRole('button', { name: 'Use another account' }).click()
    await page.getByRole('button', { name: 'Choose another profile' }).click()
    available = true
    await page.getByRole('button', { name: 'Try again' }).click()
    await expect(page.getByRole('heading', { name: 'Who’s checking in?' })).toBeVisible()
    await expect(page.locator('[data-profile]')).toHaveCount(profiles.length)
    await expect(page.getByRole('heading', { name: 'Demo temporarily unavailable' })).toHaveCount(0)
  })
}

test('an empty database is reported separately from a connection failure', async ({ page }) => {
  await page.route('**/api/v1/auth/profiles', route => route.fulfill({ json: { profiles: [] } }))
  await page.goto('/#/login')
  await expect(page.getByRole('heading', { name: 'No demo profiles available' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Try again' })).toBeVisible()
  await expect(page.getByLabel('Username', { exact: true })).toHaveCount(0)
})
