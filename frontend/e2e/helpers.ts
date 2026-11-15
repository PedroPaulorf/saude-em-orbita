import { expect, type Page } from '@playwright/test'

export const PASSWORD = 'browser-fixture-password-29'

/** O indicador de conexão do cabeçalho: mostra o estado e sincroniza ao clicar (nome vem do title). */
export function syncButton(page: Page) {
  return page.getByRole('button', { name: /Select to sync now/ })
}

export async function waitForSync(page: Page) {
  await expect(syncButton(page)).toBeEnabled()
}

export async function sync(page: Page) {
  await waitForSync(page)
  await syncButton(page).click()
  await waitForSync(page)
}

/** Tela de entrada: escolhe o perfil na grade de tripulantes e digita a senha. */
export async function signIn(page: Page, username: string, password = PASSWORD) {
  await page.goto('/#/login')
  await page.locator(`[data-profile="${username}"]`).click()
  await page.getByLabel('Password', { exact: true }).fill(password)
  await page.getByRole('button', { name: 'Sign in', exact: true }).click()
}

/** Select a mission for a new account/device; returning accounts keep their choice. */
export async function chooseMission(page: Page, name = 'ISS') {
  const picker = page.getByRole('heading', { name: 'Choose your mission', exact: true })
  await expect(picker.or(page.getByRole('link', { name: /Open profile$/ }))).toBeVisible()
  if (await picker.isVisible()) await page.getByRole('button', { name: new RegExp(`^Choose ${name}:`) }).click()
}

export async function login(page: Page, username: string) {
  await signIn(page, username)
  await chooseMission(page)
  await expect(page.getByRole('link', { name: /Open profile$/ })).toBeVisible()
  await waitForSync(page)
}

/** The profile page provides the logout action on both mobile and desktop. */
export async function logout(page: Page) {
  await page.evaluate(() => { window.location.hash = '#/profile' })
  await page.getByRole('main').getByRole('button', { name: 'Log out', exact: true }).click()
  await expect(page.getByRole('link', { name: /Open profile$/ })).toHaveCount(0)
}
