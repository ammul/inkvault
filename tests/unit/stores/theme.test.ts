import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '@/stores/auth'
import { useThemeStore } from '@/stores/theme'
import { DEFAULT_THEME } from '@/types'

function mockMatchMedia(matches: boolean) {
  vi.stubGlobal('matchMedia', (_query: string) => ({
    matches,
    media: _query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }))
}

beforeEach(async () => {
  mockMatchMedia(false)
  setActivePinia(createPinia())
  localStorage.clear()
  await useAuthStore().initializeVault('theme-test-passphrase')
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('theme store', () => {
  test('load reads encrypted settings and merges with DEFAULT_THEME', async () => {
    const theme = useThemeStore()
    theme.settings.colorTheme = 'teal'
    theme.settings.font = 'serif'
    await theme.save()
    theme.reset()

    await theme.load()
    expect(theme.settings.colorTheme).toBe('teal')
    expect(theme.settings.font).toBe('serif')
    // unmodified fields stay at defaults
    expect(theme.settings.mood).toBe(DEFAULT_THEME.mood)
  })

  test('load sets loaded = true', async () => {
    const theme = useThemeStore()
    expect(theme.loaded).toBe(false)
    await theme.load()
    expect(theme.loaded).toBe(true)
  })

  test('save encrypts settings (no plaintext in localStorage)', async () => {
    const theme = useThemeStore()
    theme.settings.colorTheme = 'teal'
    await theme.save()
    const raw = localStorage.getItem('iv:theme')
    expect(raw).not.toBeNull()
    expect(raw).not.toContain('teal')
    expect(raw).not.toContain('colorTheme')
  })

  test('apply writes all dataset attributes to documentElement', () => {
    const theme = useThemeStore()
    theme.settings.colorTheme = 'rose'
    theme.settings.font = 'mono'
    theme.settings.mood = 'dark'
    theme.settings.fontSize = 'lg'
    theme.settings.lineSpacing = 'relaxed'
    theme.settings.contentWidth = 'wide'
    theme.apply()
    const el = document.documentElement
    expect(el.dataset.mood).toBe('dark')
    expect(el.dataset.color).toBe('rose')
    expect(el.dataset.font).toBe('mono')
    expect(el.dataset.size).toBe('lg')
    expect(el.dataset.spacing).toBe('relaxed')
    expect(el.dataset.width).toBe('wide')
  })

  test('apply with mood=system uses matchMedia result for dataset.mood', () => {
    mockMatchMedia(true) // simulate dark preference
    const theme = useThemeStore()
    theme.settings.mood = 'system'
    theme.apply()
    expect(document.documentElement.dataset.mood).toBe('dark')
  })

  test('reset restores DEFAULT_THEME values and resets DOM attributes', () => {
    const theme = useThemeStore()
    theme.settings.colorTheme = 'rose'
    theme.settings.mood = 'dark'
    theme.reset()
    expect(theme.settings.colorTheme).toBe(DEFAULT_THEME.colorTheme)
    expect(theme.settings.mood).toBe(DEFAULT_THEME.mood)
    expect(theme.loaded).toBe(false)
    expect(document.documentElement.dataset.mood).toBe(DEFAULT_THEME.mood)
    expect(document.documentElement.dataset.color).toBe(DEFAULT_THEME.colorTheme)
  })
})
