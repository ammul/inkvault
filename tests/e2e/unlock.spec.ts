import { test, expect } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.reload()
})

test('first visit shows the vault setup form', async ({ page }) => {
  await expect(page.getByText('Create a passphrase to get started.')).toBeVisible()
  await expect(page.getByPlaceholder('Choose a strong passphrase')).toBeVisible()
  await expect(page.getByPlaceholder('Repeat passphrase')).toBeVisible()
})

test('creating a vault unlocks the app and shows the home screen', async ({ page }) => {
  await page.getByPlaceholder('Choose a strong passphrase').fill('my-test-passphrase-123')
  await page.getByPlaceholder('Repeat passphrase').fill('my-test-passphrase-123')
  await page.getByRole('button', { name: 'Create Vault' }).click()
  await expect(page.getByText('Welcome to InkVault')).toBeVisible()
})

test('mismatched passphrases show an error', async ({ page }) => {
  await page.getByPlaceholder('Choose a strong passphrase').fill('passphrase-a')
  await page.getByPlaceholder('Repeat passphrase').fill('passphrase-b')
  await page.getByRole('button', { name: 'Create Vault' }).click()
  await expect(page.getByText('Passphrases do not match.')).toBeVisible()
})

test('reload requires passphrase again', async ({ page }) => {
  await page.getByPlaceholder('Choose a strong passphrase').fill('my-test-passphrase-123')
  await page.getByPlaceholder('Repeat passphrase').fill('my-test-passphrase-123')
  await page.getByRole('button', { name: 'Create Vault' }).click()
  await expect(page.getByText('Welcome to InkVault')).toBeVisible()

  await page.reload()
  await expect(page.getByText('Enter your passphrase to unlock.')).toBeVisible()
  await expect(page.getByPlaceholder('Enter passphrase')).toBeVisible()
})

test('wrong passphrase shows an error', async ({ page }) => {
  // Setup vault
  await page.getByPlaceholder('Choose a strong passphrase').fill('correct-passphrase')
  await page.getByPlaceholder('Repeat passphrase').fill('correct-passphrase')
  await page.getByRole('button', { name: 'Create Vault' }).click()
  await page.reload()

  await page.getByPlaceholder('Enter passphrase').fill('wrong-passphrase')
  await page.getByRole('button', { name: 'Unlock' }).click()
  await expect(page.getByText('Wrong passphrase. Try again.')).toBeVisible()
})

test('correct passphrase after setup unlocks the app', async ({ page }) => {
  await page.getByPlaceholder('Choose a strong passphrase').fill('correct-passphrase')
  await page.getByPlaceholder('Repeat passphrase').fill('correct-passphrase')
  await page.getByRole('button', { name: 'Create Vault' }).click()
  await page.reload()

  await page.getByPlaceholder('Enter passphrase').fill('correct-passphrase')
  await page.getByRole('button', { name: 'Unlock' }).click()
  await expect(page.getByText('Welcome to InkVault')).toBeVisible()
})

test('passphrase is never stored in localStorage', async ({ page }) => {
  await page.getByPlaceholder('Choose a strong passphrase').fill('super-secret-passphrase-xyz')
  await page.getByPlaceholder('Repeat passphrase').fill('super-secret-passphrase-xyz')
  await page.getByRole('button', { name: 'Create Vault' }).click()

  const allStorage = await page.evaluate(() => JSON.stringify(Object.entries(localStorage)))
  expect(allStorage).not.toContain('super-secret-passphrase-xyz')
})
