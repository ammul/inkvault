import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { ThemeSettings } from '@/types'
import { DEFAULT_THEME } from '@/types'
import { useAuthStore } from './auth'
import { KEYS, writeEncrypted, readEncrypted } from '@/utils/storage'

export const useThemeStore = defineStore('theme', () => {
  const settings = ref<ThemeSettings>({ ...DEFAULT_THEME })
  const loaded = ref(false)

  let _mqListener: (() => void) | null = null

  function getKey(): CryptoKey {
    const auth = useAuthStore()
    if (!auth.key) throw new Error('Vault is locked')
    return auth.key
  }

  async function load(): Promise<void> {
    const key = getKey()
    const saved = await readEncrypted<ThemeSettings>(key, KEYS.THEME)
    if (saved) settings.value = { ...DEFAULT_THEME, ...saved }
    loaded.value = true
    apply()
  }

  async function save(): Promise<void> {
    const key = getKey()
    await writeEncrypted(key, KEYS.THEME, settings.value)
  }

  function apply(): void {
    const el = document.documentElement
    const mq = window.matchMedia('(prefers-color-scheme: dark)')

    if (settings.value.mood === 'system') {
      el.dataset.mood = mq.matches ? 'dark' : 'minimal'
      if (!_mqListener) {
        _mqListener = () => { el.dataset.mood = mq.matches ? 'dark' : 'minimal' }
        mq.addEventListener('change', _mqListener)
      }
    } else {
      if (_mqListener) {
        mq.removeEventListener('change', _mqListener)
        _mqListener = null
      }
      el.dataset.mood = settings.value.mood
    }

    el.dataset.color   = settings.value.colorTheme
    el.dataset.font    = settings.value.font
    el.dataset.size    = settings.value.fontSize
    el.dataset.spacing = settings.value.lineSpacing
    el.dataset.width   = settings.value.contentWidth
  }

  function reset(): void {
    if (_mqListener) {
      window.matchMedia('(prefers-color-scheme: dark)').removeEventListener('change', _mqListener)
      _mqListener = null
    }
    settings.value = { ...DEFAULT_THEME }
    loaded.value = false
    const el = document.documentElement
    el.dataset.mood    = DEFAULT_THEME.mood
    el.dataset.color   = DEFAULT_THEME.colorTheme
    el.dataset.font    = DEFAULT_THEME.font
    el.dataset.size    = DEFAULT_THEME.fontSize
    el.dataset.spacing = DEFAULT_THEME.lineSpacing
    el.dataset.width   = DEFAULT_THEME.contentWidth
  }

  return { settings, loaded, load, save, apply, reset }
})
