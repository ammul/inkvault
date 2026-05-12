import { test, expect } from '@playwright/test'

async function setupVault(page: import('@playwright/test').Page, pass = 'e2e-test-pass') {
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.reload()
  await page.getByPlaceholder('Choose a strong passphrase').fill(pass)
  await page.getByPlaceholder('Repeat passphrase').fill(pass)
  await page.getByRole('button', { name: 'Create Vault' }).click()
  await expect(page.getByText('Welcome back')).toBeVisible()
}

test('diary home card navigates to diary view with calendar', async ({ page }) => {
  await setupVault(page)
  await page.getByText('Diary').first().click()
  await expect(page.getByRole('heading', { name: 'Diary' })).toBeVisible()
  // Calendar header shows a month name
  await expect(page.locator('nav + main')).toContainText(/January|February|March|April|May|June|July|August|September|October|November|December/)
})

test('clicking a calendar day opens the day entry view', async ({ page }) => {
  await setupVault(page)
  await page.goto('/inkvault/#/diary')
  // Click the first numbered day cell
  await page.locator('.grid > div').filter({ hasText: /^1$/ }).first().click()
  await expect(page.getByPlaceholder('What happened today?')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Save' })).toBeVisible()
})

test('back button returns to calendar', async ({ page }) => {
  await setupVault(page)
  await page.goto('/inkvault/#/diary')
  await page.locator('.grid > div').filter({ hasText: /^1$/ }).first().click()
  await page.getByText('← Back').click()
  await expect(page.getByRole('heading', { name: 'Diary' })).toBeVisible()
})

test('saving a diary entry persists after unlock', async ({ page }) => {
  await setupVault(page, 'persist-test-pass')

  // Navigate to today's entry via the URL
  const today = new Date().toISOString().slice(0, 10)
  await page.goto(`/inkvault/#/diary/${today}`)
  await page.getByPlaceholder('What happened today?').fill('A truly memorable day!')
  await page.getByRole('button', { name: 'Save' }).click()
  await expect(page.getByText('Entry saved')).toBeVisible()

  // Reload and unlock
  await page.reload()
  await page.getByPlaceholder('Enter passphrase').fill('persist-test-pass')
  await page.getByRole('button', { name: 'Unlock' }).click()
  await expect(page.getByRole('heading', { name: 'Welcome back', level: 1 })).toBeVisible()

  // Navigate back to the same day
  await page.goto(`/inkvault/#/diary/${today}`)
  await expect(page.getByPlaceholder('What happened today?')).toBeVisible()
  await expect(page.getByPlaceholder('What happened today?')).toHaveValue('A truly memorable day!')
})
