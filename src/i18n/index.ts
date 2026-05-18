import { createI18n } from 'vue-i18n'
import en from './locales/en'
import de from './locales/de'

export type SupportedLocale = 'en' | 'de'

export function detectBrowserLocale(): SupportedLocale {
  const lang = navigator.language ?? 'en'
  return lang.startsWith('de') ? 'de' : 'en'
}

export const i18n = createI18n({
  legacy: false,
  locale: detectBrowserLocale(),
  fallbackLocale: 'en',
  messages: { en, de },
})
