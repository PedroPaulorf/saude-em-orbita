import { test, expect } from '@playwright/test'
import { login } from './helpers'

test('iPhone setup opens beside Start and preserves file import on desktop and mobile', async ({ page }) => {
  await page.route('**/DONKI-API/**', route => route.abort())
  await page.goto('/')
  await login(page, 'crew02')
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/#/')
    await page.getByRole('link', { name: 'Connect iPhone', exact: true }).click()
    await expect(page.getByRole('heading', { name: 'Connect iPhone', exact: true })).toBeVisible()
    await expect(page.getByText('iOS companion app required', { exact: true })).toBeVisible()
    await expect(page.locator('#connect-iphone code')).toHaveText('http://127.0.0.1:3003')
    await page.getByRole('button', { name: 'Import Apple Health file instead' }).click()
    await expect(page.getByRole('heading', { name: 'Import measurements', exact: true })).toBeInViewport()
    await expect(page).toHaveURL(/#\/integrations/)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  }
})
