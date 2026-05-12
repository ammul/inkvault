import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { ThemeSettings } from '@/types'
import { DEFAULT_THEME } from '@/types'
import { useAuthStore } from './auth'
import { KEYS, writeEncrypted, readEncrypted } from '@/utils/storage'

export const useThemeStore = defineStore('theme', () => {
  const settings = ref<ThemeSettings>({ ...DEFAULT_THEME })
  const loaded = ref(false)

  function getKey(): CryptoKey {
    const auth = useAuthStore()
    if (!auth.key) throw new Error('Vault is locked')
    return auth.key
  }

  async function load(): Promise<void> {
    const key = getKey()
    const saved = await readEncrypted<ThemeSettings>(key, KEYS.THEME)
    if (saved) settings.value = saved
    loaded.value = true
    apply()
  }

  async function save(): Promise<void> {
    const key = getKey()
    await writeEncrypted(key, KEYS.THEME, settings.value)
  }

  function apply(): void {
    const el = document.documentElement
    el.dataset.mood = settings.value.mood
    el.dataset.color = settings.value.colorTheme
    el.dataset.font = settings.value.font
  }

  function reset(): void {
    settings.value = { ...DEFAULT_THEME }
    loaded.value = false
    const el = document.documentElement
    el.dataset.mood = DEFAULT_THEME.mood
    el.dataset.color = DEFAULT_THEME.colorTheme
    el.dataset.font = DEFAULT_THEME.font
  }

  return { settings, loaded, load, save, apply, reset }
})
