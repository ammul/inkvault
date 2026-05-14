import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { DiaryEntry } from '@/types'
import { useAuthStore } from './auth'
import { KEYS, writeEncrypted, readEncrypted, listEntryKeys, listEntryDates, remove } from '@/utils/storage'

export const useDiaryStore = defineStore('diary', () => {
  const entries = ref<Map<string, DiaryEntry>>(new Map())
  const loaded = ref(false)
  const availableDates = ref<Set<string>>(new Set())
  const datesLoaded = ref(false)

  function getKey(): CryptoKey {
    const auth = useAuthStore()
    if (!auth.key) throw new Error('Vault is locked')
    return auth.key
  }

  function getAvailableDates(): string[] {
    const dates = listEntryDates()
    availableDates.value = new Set(dates)
    datesLoaded.value = true
    return dates
  }

  async function loadEntry(date: string): Promise<DiaryEntry | null> {
    if (entries.value.has(date)) return entries.value.get(date)!
    const key = getKey()
    const entry = await readEncrypted<DiaryEntry>(key, KEYS.ENTRY(date))
    if (entry) entries.value.set(entry.date, entry)
    return entry ?? null
  }

  async function loadAllEntries(): Promise<void> {
    const key = getKey()
    const keys = listEntryKeys()
    const results = await Promise.all(keys.map((k) => readEncrypted<DiaryEntry>(key, k)))
    entries.value.clear()
    for (const entry of results) {
      if (entry) entries.value.set(entry.date, entry)
    }
    loaded.value = true
    datesLoaded.value = true
    availableDates.value = new Set(entries.value.keys())
  }

  async function saveEntry(entry: DiaryEntry): Promise<void> {
    const key = getKey()
    await writeEncrypted(key, KEYS.ENTRY(entry.date), entry)
    entries.value.set(entry.date, entry)
    availableDates.value.add(entry.date)
  }

  async function deleteEntry(date: string): Promise<void> {
    remove(KEYS.ENTRY(date))
    entries.value.delete(date)
    availableDates.value.delete(date)
  }

  function getEntry(date: string): DiaryEntry | null {
    return entries.value.get(date) ?? null
  }

  function reset(): void {
    entries.value.clear()
    availableDates.value.clear()
    loaded.value = false
    datesLoaded.value = false
  }

  return {
    entries,
    loaded,
    availableDates,
    datesLoaded,
    getAvailableDates,
    loadEntry,
    loadAllEntries,
    saveEntry,
    deleteEntry,
    getEntry,
    reset,
  }
})
