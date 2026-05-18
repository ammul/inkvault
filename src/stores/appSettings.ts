import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { AppSettings } from '@/types'
import { DEFAULT_APP_SETTINGS } from '@/types'
import { useAuthStore } from './auth'
import { KEYS, writeEncrypted, readEncrypted } from '@/utils/storage'
import { i18n, detectBrowserLocale } from '@/i18n'

export const useAppSettingsStore = defineStore('appSettings', () => {
  const settings = ref<AppSettings>({ ...DEFAULT_APP_SETTINGS })
  const loaded = ref(false)

  function getKey(): CryptoKey {
    const auth = useAuthStore()
    if (!auth.key) throw new Error('Vault is locked')
    return auth.key
  }

  async function load(): Promise<void> {
    const key = getKey()
    const saved = await readEncrypted<AppSettings>(key, KEYS.APP_SETTINGS)
    if (saved) settings.value = { ...DEFAULT_APP_SETTINGS, ...saved }
    loaded.value = true
    apply()
  }

  async function save(): Promise<void> {
    const key = getKey()
    await writeEncrypted(key, KEYS.APP_SETTINGS, settings.value)
  }

  function apply(): void {
    document.documentElement.dataset.animations = settings.value.animations ? 'on' : 'off'
    const locale = settings.value.language === 'auto' ? detectBrowserLocale() : settings.value.language
    i18n.global.locale.value = locale as typeof i18n.global.locale.value
  }

  function reset(): void {
    settings.value = { ...DEFAULT_APP_SETTINGS }
    loaded.value = false
    document.documentElement.dataset.animations = 'on'
    i18n.global.locale.value = detectBrowserLocale() as typeof i18n.global.locale.value
  }

  return { settings, loaded, load, save, apply, reset }
})
