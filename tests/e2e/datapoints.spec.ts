import { test, expect } from '@playwright/test'

async function setupVault(page: import('@playwright/test').Page) {
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.reload()
  await page.getByPlaceholder('Choose a strong passphrase').fill('e2e-dp-passphrase')
  await page.getByPlaceholder('Repeat passphrase').fill('e2e-dp-passphrase')
  await page.getByRole('button', { name: 'Create Vault' }).click()
  await expect(page.getByText('Welcome back')).toBeVisible()
}

test('creating a data point appears in the list', async ({ page }) => {
  await setupVault(page)
  await page.goto('/inkvault/#/data')
  await page.getByRole('button', { name: '+ Add' }).click()
  await page.getByPlaceholder('e.g. Mood').fill('Energy')
  await page.getByRole('button', { name: 'Add Data Point' }).click()
  await expect(page.getByText('Energy')).toBeVisible()
})

test('editing a data point updates its label', async ({ page }) => {
  await setupVault(page)
  await page.goto('/inkvault/#/data')
  await page.getByRole('button', { name: '+ Add' }).click()
  await page.getByPlaceholder('e.g. Mood').fill('Mood')
  await page.getByRole('button', { name: 'Add Data Point' }).click()

  await page.getByRole('button', { name: 'Edit' }).click()
  await page.getByPlaceholder('e.g. Mood').clear()
  await page.getByPlaceholder('e.g. Mood').fill('Happiness')
  await page.getByRole('button', { name: 'Save Changes' }).click()
  await expect(page.getByText('Happiness')).toBeVisible()
  await expect(page.getByText('Mood')).not.toBeVisible()
})

test('deleting a data point removes it from the list', async ({ page }) => {
  await setupVault(page)
  await page.goto('/inkvault/#/data')
  await page.getByRole('button', { name: '+ Add' }).click()
  await page.getByPlaceholder('e.g. Mood').fill('Sleep')
  await page.getByRole('button', { name: 'Add Data Point' }).click()

  page.on('dialog', (dialog) => dialog.accept())
  await page.getByRole('button', { name: 'Delete' }).click()
  await expect(page.getByText('Sleep')).not.toBeVisible()
  await expect(page.getByText('No data points yet.')).toBeVisible()
})

test('data point appears as a field in the diary day entry', async ({ page }) => {
  await setupVault(page)

  // Create a data point
  await page.goto('/inkvault/#/data')
  await page.getByRole('button', { name: '+ Add' }).click()
  await page.getByPlaceholder('e.g. Mood').fill('Mood')
  await page.getByRole('button', { name: 'Add Data Point' }).click()

  // Open today's diary entry
  const today = new Date().toISOString().slice(0, 10)
  await page.goto(`/inkvault/#/diary/${today}`)

  // Open the add menu — the data point should appear as a log option
  await page.getByRole('button', { name: 'Add entry' }).click()
  await expect(page.getByRole('button', { name: 'Mood' })).toBeVisible()
})
