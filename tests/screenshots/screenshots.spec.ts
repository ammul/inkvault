import { test, expect, type Page } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
import { join } from 'node:path'

const PASSPHRASE = 'InkVault-Demo-2024!'
const OUT = join(process.cwd(), 'docs', 'screenshots')

test.setTimeout(300_000)

async function shot(page: Page, name: string): Promise<void> {
  await page.screenshot({ path: join(OUT, name), fullPage: false })
}

function dateISO(daysAgo: number): string {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  return d.toISOString().slice(0, 10)
}

async function openRadialMenu(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Add entry' }).click()
  await page.waitForTimeout(500) // radial animation (max ~350ms)
}

async function afterSave(page: Page): Promise<void> {
  await page.waitForTimeout(500)
}

const ENTRIES = [
  {
    text: 'Woke up feeling refreshed after a solid eight hours. Made coffee and read for an hour before the day started.',
    mood: 8, energy: 7, exercised: true, emotions: ['Joyful', 'Grateful'],
  },
  {
    text: 'Busy day at work, but managed to get a long walk in at lunch. The fresh air helped a lot.',
    mood: 6, energy: 5, exercised: true, emotions: ['Calm'],
  },
  {
    text: "Quiet evening. Finished a book I'd been reading for weeks — that satisfying feeling of closing the last page.",
    mood: 8, energy: 6, exercised: false, emotions: ['Calm', 'Grateful'],
  },
  {
    text: 'Struggled to focus today. Too many browser tabs. Closed them all and finally got into a flow state.',
    mood: 4, energy: 3, exercised: false, emotions: ['Anxious'],
  },
  {
    text: 'Met an old friend for dinner. We talked for three hours without noticing the time.',
    mood: 9, energy: 7, exercised: false, emotions: ['Joyful', 'Excited'],
  },
  {
    text: 'Rainy morning. Did a full workout at home and felt surprisingly good afterward.',
    mood: 7, energy: 8, exercised: true, emotions: ['Calm', 'Grateful'],
  },
  {
    text: 'Productive start to the week. Wrote for an hour in the morning before checking email.',
    mood: 8, energy: 9, exercised: true, emotions: ['Excited'],
  },
]

async function addTracker(
  page: Page,
  label: string,
  type?: string,
  extras?: (page: Page) => Promise<void>,
) {
  await page.getByRole('button', { name: '+ Add', exact: true }).click()
  await page.getByPlaceholder('e.g. Mood').fill(label)
  if (type) await page.getByRole('button', { name: type }).click()
  if (extras) await extras(page)
  await page.getByRole('button', { name: 'Add tracker' }).click()
  // Wait for draft to close — "+ Add another tracker" only appears when configs.length > 0 && !showDraft
  await expect(page.getByText('+ Add another tracker')).toBeVisible({ timeout: 10_000 })
}

test('generate promotional screenshots', async ({ page }) => {
  await mkdir(OUT, { recursive: true })

  // ── Lock / create screen ──────────────────────────────────────────────────
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.reload()
  await expect(page.getByPlaceholder('Choose a strong passphrase')).toBeVisible()
  await shot(page, '01-lock-create.png')

  // ── Create vault ──────────────────────────────────────────────────────────
  await page.getByPlaceholder('Choose a strong passphrase').fill(PASSPHRASE)
  await page.getByPlaceholder('Repeat passphrase').fill(PASSPHRASE)
  await page.getByRole('button', { name: 'Create Vault' }).click()
  await expect(page.getByText('Welcome back')).toBeVisible()
  await shot(page, '02-home.png')

  // ── Trackers ──────────────────────────────────────────────────────────────
  await page.goto('/inkvault/#/trackers')
  await expect(page.getByRole('button', { name: '+ Add' })).toBeVisible()

  await addTracker(page, 'Mood')
  await addTracker(page, 'Energy')
  await addTracker(page, 'Exercise', 'Yes / No')
  await addTracker(page, 'How I felt', 'Multiple choice', async (p) => {
    await p.getByPlaceholder('Good, Neutral, Bad').fill('Joyful, Calm, Anxious, Excited, Grateful')
  })
  await addTracker(page, 'Vitamin D', 'Medication', async (p) => {
    await p.getByPlaceholder('e.g. Ibuprofen').fill('Vitamin D3')
    await p.getByPlaceholder('e.g. 10mg, 40mg, 100mg').fill('1000 IU, 2000 IU')
  })

  await page.waitForTimeout(300) // let list-enter animation finish
  await shot(page, '03-trackers-list.png')

  // Expand Mood row to show editor
  await page.locator('[role="button"]').filter({ hasText: 'Mood' }).click()
  await page.waitForTimeout(200)
  await shot(page, '04-trackers-editor.png')
  // Cancel button is in the TrackerCardShell footer
  await page.getByRole('button', { name: 'Cancel' }).click()

  // ── Seed diary entries ────────────────────────────────────────────────────
  for (let i = 0; i < ENTRIES.length; i++) {
    const entry = ENTRIES[i]
    await page.goto(`/inkvault/#/diary/${dateISO(i)}`)

    await openRadialMenu(page)
    await page.getByRole('button', { name: 'Add text entry' }).click()
    await page.getByPlaceholder('What happened?').fill(entry.text)
    await page.getByRole('button', { name: 'Done' }).click()
    await afterSave(page)

    await openRadialMenu(page)
    await page.getByRole('button', { name: 'Mood' }).click()
    await page.locator('input[type="range"]').fill(String(entry.mood))
    await page.getByRole('button', { name: 'Done' }).click()
    await afterSave(page)

    await openRadialMenu(page)
    await page.getByRole('button', { name: 'Energy' }).click()
    await page.locator('input[type="range"]').fill(String(entry.energy))
    await page.getByRole('button', { name: 'Done' }).click()
    await afterSave(page)

    await openRadialMenu(page)
    await page.getByRole('button', { name: 'Exercise' }).click()
    await page.getByRole('button', { name: entry.exercised ? 'Yes' : 'No' }).click()
    await page.getByRole('button', { name: 'Done' }).click()
    await afterSave(page)

    await openRadialMenu(page)
    await page.getByRole('button', { name: 'How I felt' }).click()
    for (const emotion of entry.emotions) {
      await page.getByRole('button', { name: emotion }).click()
    }
    await page.getByRole('button', { name: 'Done' }).click()
    await afterSave(page)
  }

  // ── Diary calendar ────────────────────────────────────────────────────────
  await page.goto('/inkvault/#/diary')
  await expect(page.locator('main')).toContainText(
    /January|February|March|April|May|June|July|August|September|October|November|December/,
  )
  await page.waitForTimeout(500)
  await shot(page, '05-diary-calendar.png')

  // ── Diary day (today) ─────────────────────────────────────────────────────
  await page.goto(`/inkvault/#/diary/${dateISO(0)}`)
  await expect(page.getByText(ENTRIES[0].text)).toBeVisible()
  await page.waitForTimeout(400)
  await shot(page, '06-diary-day.png')

  // ── Statistics ────────────────────────────────────────────────────────────
  await page.goto('/inkvault/#/stats')
  await expect(page.getByText('Statistics')).toBeVisible()
  await page.waitForTimeout(800)
  await shot(page, '07-stats.png')

  // ── Theme variations ──────────────────────────────────────────────────────
  type Mood = 'minimal' | 'cozy' | 'dark'
  type Color = 'indigo' | 'violet' | 'teal' | 'rose' | 'amber' | 'slate'

  async function applyTheme(mood: Mood, color: Color): Promise<void> {
    await page.evaluate(
      ([m, c]) => {
        const el = document.documentElement
        el.dataset.mood = m
        el.dataset.color = c
      },
      [mood, color] as [string, string],
    )
  }

  const THEME_SHOTS: { mood: Mood; color: Color; label: string }[] = [
    { mood: 'minimal', color: 'indigo',  label: 'minimal-indigo' },
    { mood: 'minimal', color: 'rose',    label: 'minimal-rose'   },
    { mood: 'cozy',    color: 'amber',   label: 'cozy-amber'     },
    { mood: 'cozy',    color: 'teal',    label: 'cozy-teal'      },
    { mood: 'dark',    color: 'indigo',  label: 'dark-indigo'    },
    { mood: 'dark',    color: 'violet',  label: 'dark-violet'    },
    { mood: 'dark',    color: 'rose',    label: 'dark-rose'      },
  ]

  for (const { mood, color, label } of THEME_SHOTS) {
    await page.goto(`/inkvault/#/diary/${dateISO(0)}`)
    await expect(page.getByText(ENTRIES[0].text)).toBeVisible()
    await applyTheme(mood, color)
    await page.waitForTimeout(200)
    await shot(page, `theme-${label}-diary.png`)

    await page.goto('/inkvault/#/diary')
    await expect(page.locator('main')).toContainText(
      /January|February|March|April|May|June|July|August|September|October|November|December/,
    )
    await applyTheme(mood, color)
    await page.waitForTimeout(300)
    await shot(page, `theme-${label}-calendar.png`)
  }

  await applyTheme('minimal', 'indigo')

  // ── Theme view ────────────────────────────────────────────────────────────
  await page.goto('/inkvault/#/theme')
  await expect(page.getByRole('heading', { name: 'Theme' })).toBeVisible()
  await shot(page, '08-theme.png')

  // ── Backup settings ───────────────────────────────────────────────────────
  await page.goto('/inkvault/#/backup')
  await expect(page.getByRole('heading', { name: 'Backup' })).toBeVisible()
  await shot(page, '09-backup.png')

  // ── Lock screen ───────────────────────────────────────────────────────────
  await page.getByRole('button', { name: 'Toggle menu' }).click()
  await page.waitForTimeout(250) // drawer slide-in animation (200ms)
  await page.getByRole('button', { name: 'Lock' }).click()
  await expect(page.getByPlaceholder('Enter passphrase')).toBeVisible()
  await shot(page, '10-lock-unlock.png')
})
