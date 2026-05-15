import { test, expect, type Page } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
import { join } from 'node:path'

const PASSPHRASE = 'InkVault-Demo-2024!'
const OUT = join(process.cwd(), 'docs', 'screenshots')

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

// Wait for encrypted save to complete — AES is fast but we need reactivity to settle.
// 500ms is conservative; the actual crypto+localStorage write is <10ms.
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

  // ── Data points ───────────────────────────────────────────────────────────
  // handleSave() in DataPointsView is async — it awaits the encrypted store write before
  // calling closeEditor(). So after clicking "Add Data Point" we must wait for the editor
  // to close (showEditor = false) before proceeding; the "+ Add" button only renders when
  // showEditor = false, making it a reliable signal.
  await page.goto('/inkvault/#/data')
  await expect(page.getByRole('button', { name: '+ Add' })).toBeVisible()

  // Mood — range (default type)
  await page.getByRole('button', { name: '+ Add' }).click()
  await page.getByPlaceholder('e.g. Mood').fill('Mood')
  await page.getByRole('button', { name: 'Add Data Point' }).click()
  await expect(page.getByRole('button', { name: '+ Add' })).toBeVisible({ timeout: 10_000 })

  // Energy — range
  await page.getByRole('button', { name: '+ Add' }).click()
  await page.getByPlaceholder('e.g. Mood').fill('Energy')
  await page.getByRole('button', { name: 'Add Data Point' }).click()
  await expect(page.getByRole('button', { name: '+ Add' })).toBeVisible({ timeout: 10_000 })

  // Exercise — boolean (Yes / No type)
  await page.getByRole('button', { name: '+ Add' }).click()
  await page.getByPlaceholder('e.g. Mood').fill('Exercise')
  await page.getByRole('button', { name: 'Yes / No' }).click()
  await page.getByRole('button', { name: 'Add Data Point' }).click()
  await expect(page.getByRole('button', { name: '+ Add' })).toBeVisible({ timeout: 10_000 })

  // How I felt — multi-string
  await page.getByRole('button', { name: '+ Add' }).click()
  await page.getByPlaceholder('e.g. Mood').fill('How I felt')
  await page.getByRole('button', { name: 'Multiple choice' }).click()
  await page.getByPlaceholder('Good, Neutral, Bad').fill('Joyful, Calm, Anxious, Excited, Grateful')
  await page.getByRole('button', { name: 'Add Data Point' }).click()
  await expect(page.getByRole('button', { name: '+ Add' })).toBeVisible({ timeout: 10_000 })

  // Vitamin D — medication
  await page.getByRole('button', { name: '+ Add' }).click()
  await page.getByPlaceholder('e.g. Mood').fill('Vitamin D')
  await page.getByRole('button', { name: 'Medication' }).click()
  await page.getByPlaceholder('e.g. Ibuprofen').fill('Vitamin D3')
  await page.getByPlaceholder('e.g. 10mg, 40mg, 100mg').fill('1000 IU, 2000 IU')
  await page.getByRole('button', { name: 'Add Data Point' }).click()
  await expect(page.getByRole('button', { name: '+ Add' })).toBeVisible({ timeout: 10_000 })
  await page.waitForTimeout(300) // let the Vitamin D list-enter animation finish (200ms)

  await shot(page, '03-datapoints-list.png')

  // Open Mood editor to show range config
  await page.getByRole('button', { name: 'Edit' }).first().click()
  await shot(page, '04-datapoints-editor.png')
  await page.getByRole('button', { name: 'Cancel' }).click()

  // ── Seed diary entries ────────────────────────────────────────────────────
  for (let i = 0; i < ENTRIES.length; i++) {
    const entry = ENTRIES[i]
    await page.goto(`/inkvault/#/diary/${dateISO(i)}`)

    // Text entry
    await openRadialMenu(page)
    await page.getByRole('button', { name: 'Add text entry' }).click()
    await page.getByPlaceholder('What happened?').fill(entry.text)
    await page.getByRole('button', { name: 'Done' }).click()
    await afterSave(page)

    // Mood
    await openRadialMenu(page)
    await page.getByRole('button', { name: 'Mood' }).click()
    await page.locator('input[type="range"]').fill(String(entry.mood))
    await page.getByRole('button', { name: 'Done' }).click()
    await afterSave(page)

    // Energy
    await openRadialMenu(page)
    await page.getByRole('button', { name: 'Energy' }).click()
    await page.locator('input[type="range"]').fill(String(entry.energy))
    await page.getByRole('button', { name: 'Done' }).click()
    await afterSave(page)

    // Exercise
    await openRadialMenu(page)
    await page.getByRole('button', { name: 'Exercise' }).click()
    await page.getByRole('button', { name: entry.exercised ? 'Yes' : 'No' }).click()
    await page.getByRole('button', { name: 'Done' }).click()
    await afterSave(page)

    // How I felt
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
  await page.waitForTimeout(500) // let calendar render and any Teleport from prev page clear
  await shot(page, '05-diary-calendar.png')

  // ── Diary day (today) ─────────────────────────────────────────────────────
  await page.goto(`/inkvault/#/diary/${dateISO(0)}`)
  await expect(page.getByText(ENTRIES[0].text)).toBeVisible()
  await page.waitForTimeout(400) // let timeline fade-in animation complete (200ms)
  await shot(page, '06-diary-day.png')

  // ── Statistics ────────────────────────────────────────────────────────────
  await page.goto('/inkvault/#/stats')
  await expect(page.getByText('Statistics')).toBeVisible()
  await page.waitForTimeout(800) // chart render
  await shot(page, '07-stats.png')

  // ── Theme variations ──────────────────────────────────────────────────────
  // Apply theme directly via dataset attributes (same as ThemeStore.apply())
  // Must run before lock so we're still authenticated and stores are loaded.
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
    // Diary day — most content-rich view
    await page.goto(`/inkvault/#/diary/${dateISO(0)}`)
    await expect(page.getByText(ENTRIES[0].text)).toBeVisible()
    await applyTheme(mood, color)
    await page.waitForTimeout(200)
    await shot(page, `theme-${label}-diary.png`)

    // Calendar — shows month grid with color accents
    await page.goto('/inkvault/#/diary')
    await expect(page.locator('main')).toContainText(
      /January|February|March|April|May|June|July|August|September|October|November|December/,
    )
    await applyTheme(mood, color)
    await page.waitForTimeout(300)
    await shot(page, `theme-${label}-calendar.png`)
  }

  // Reset to default theme before remaining shots
  await applyTheme('minimal', 'indigo')

  // ── Theme view ────────────────────────────────────────────────────────────
  await page.goto('/inkvault/#/theme')
  await expect(page.getByRole('heading', { name: 'Theme' })).toBeVisible()
  await shot(page, '08-theme.png')

  // ── Settings (backup) ─────────────────────────────────────────────────────
  await page.goto('/inkvault/#/settings')
  await expect(page.getByRole('heading', { name: 'Backup' })).toBeVisible()
  await shot(page, '09-settings.png')

  // ── Lock screen ───────────────────────────────────────────────────────────
  await page.getByRole('button', { name: 'Toggle menu' }).click()
  await page.waitForTimeout(250) // drawer slide-in animation (200ms)
  await page.getByRole('button', { name: 'Lock' }).click()
  await expect(page.getByPlaceholder('Enter passphrase')).toBeVisible()
  await shot(page, '10-lock-unlock.png')
})
