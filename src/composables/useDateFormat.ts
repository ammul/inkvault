import { computed } from 'vue'
import { useAppSettingsStore } from '@/stores/appSettings'
import { i18n } from '@/i18n'

export function useDateFormat() {
  const appSettings = useAppSettingsStore()
  const dateFormat = computed(() => appSettings.settings.dateFormat)
  const clockDisplay = computed(() => appSettings.settings.clockDisplay)
  const activeLocale = computed(() => i18n.global.locale.value)

  function parseDate(dateStr: string): [number, number, number] {
    const [y, m, d] = dateStr.split('-').map(Number)
    return [y, m, d]
  }

  function toDmy(y: number, m: number, d: number): string {
    return `${String(d).padStart(2, '0')}.${String(m).padStart(2, '0')}.${y}`
  }

  /** "18.05.26" or "May 18" / "May 18, 2025" — short month, for lists */
  function formatDate(dateStr: string): string {
    const [y, m, d] = parseDate(dateStr)
    if (dateFormat.value === 'dmy') return toDmy(y, m, d)
    const opts: Intl.DateTimeFormatOptions = y === new Date().getFullYear()
      ? { month: 'short', day: 'numeric' }
      : { month: 'short', day: 'numeric', year: 'numeric' }
    return new Date(y, m - 1, d).toLocaleDateString(activeLocale.value, opts)
  }

  /** "18.05.26" or "May 18" / "May 18, 2025" — long month, for headers */
  function formatLongDate(dateStr: string): string {
    const [y, m, d] = parseDate(dateStr)
    if (dateFormat.value === 'dmy') return toDmy(y, m, d)
    const opts: Intl.DateTimeFormatOptions = y === new Date().getFullYear()
      ? { month: 'long', day: 'numeric' }
      : { month: 'long', day: 'numeric', year: 'numeric' }
    return new Date(y, m - 1, d).toLocaleDateString(activeLocale.value, opts)
  }

  /** "Monday" */
  function formatWeekday(dateStr: string): string {
    const [y, m, d] = parseDate(dateStr)
    return new Date(y, m - 1, d).toLocaleDateString(activeLocale.value, { weekday: 'long' })
  }

  /** "May 2026" — always locale, used for calendar month headers */
  function formatMonthYear(year: number, month: number): string {
    return new Date(year, month).toLocaleDateString(activeLocale.value, { month: 'long', year: 'numeric' })
  }

  /** "14:30" or "2:30 PM" — full time with AM/PM suffix when in ampm mode */
  function formatTime(iso: string): string {
    return new Date(iso).toLocaleTimeString(activeLocale.value, {
      hour: '2-digit',
      minute: '2-digit',
      hour12: clockDisplay.value === 'ampm',
    })
  }

  /** "14:30" or "02:30" — strips AM/PM suffix, for when it is rendered separately */
  function formatTimeHm(iso: string): string {
    return new Date(iso).toLocaleTimeString(activeLocale.value, {
      hour: '2-digit',
      minute: '2-digit',
      hour12: clockDisplay.value === 'ampm',
    }).replace(/ ?[AP]M$/i, '')
  }

  /** "am" or "pm" */
  function formatAmPm(iso: string): 'am' | 'pm' {
    return new Date(iso).getHours() < 12 ? 'am' : 'pm'
  }

  return {
    formatDate,
    formatLongDate,
    formatWeekday,
    formatMonthYear,
    formatTime,
    formatTimeHm,
    formatAmPm,
  }
}
