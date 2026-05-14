import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '@/stores/auth'
import { useAppSettingsStore } from '@/stores/appSettings'
import { DEFAULT_APP_SETTINGS } from '@/types'

beforeEach(async () => {
  setActivePinia(createPinia())
  localStorage.clear()
  await useAuthStore().initializeVault('appsettings-test-passphrase')
})

describe('appSettings store', () => {
  test('load reads encrypted settings and merges with defaults', async () => {
    const settings = useAppSettingsStore()
    settings.settings.animations = false
    await settings.save()
    settings.reset()

    await settings.load()
    expect(settings.settings.animations).toBe(false)
    expect(settings.loaded).toBe(true)
    // unmodified fields stay at defaults
    expect(settings.settings.useEmojis).toBe(DEFAULT_APP_SETTINGS.useEmojis)
  })

  test('save encrypts settings (no plaintext in localStorage)', async () => {
    const settings = useAppSettingsStore()
    settings.settings.animations = false
    await settings.save()
    const raw = localStorage.getItem('iv:app-settings')
    expect(raw).not.toBeNull()
    expect(raw).not.toContain('animations')
  })

  test('apply sets dataset.animations based on setting value', () => {
    const settings = useAppSettingsStore()
    settings.settings.animations = true
    settings.apply()
    expect(document.documentElement.dataset.animations).toBe('on')

    settings.settings.animations = false
    settings.apply()
    expect(document.documentElement.dataset.animations).toBe('off')
  })

  test('reset restores defaults and sets dataset.animations to on', () => {
    const settings = useAppSettingsStore()
    settings.settings.animations = false
    settings.reset()
    expect(settings.settings.animations).toBe(DEFAULT_APP_SETTINGS.animations)
    expect(settings.loaded).toBe(false)
    expect(document.documentElement.dataset.animations).toBe('on')
  })
})
