import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { DiaryEntry } from '@/types'
import { useAuthStore } from './auth'
import { KEYS, writeEncrypted, readEncrypted, listEntryKeys, remove } from '@/utils/storage'

export const useDiaryStore = defineStore('diary', () => {
  const entries = ref<Map<string, DiaryEntry>>(new Map())
  const loaded = ref(false)

  function getKey(): CryptoKey {
    const auth = useAuthStore()
    if (!auth.key) throw new Error('Vault is locked')
    return auth.key
  }

  async function loadEntries(): Promise<void> {
    const key = getKey()
    const keys = listEntryKeys()
    const results = await Promise.all(keys.map((k) => readEncrypted<DiaryEntry>(key, k)))
    entries.value.clear()
    for (const entry of results) {
      if (entry) entries.value.set(entry.date, entry)
    }
    loaded.value = true
  }

  async function saveEntry(entry: DiaryEntry): Promise<void> {
    const key = getKey()
    await writeEncrypted(key, KEYS.ENTRY(entry.date), entry)
    entries.value.set(entry.date, entry)
  }

  async function deleteEntry(date: string): Promise<void> {
    remove(KEYS.ENTRY(date))
    entries.value.delete(date)
  }

  function getEntry(date: string): DiaryEntry | null {
    return entries.value.get(date) ?? null
  }

  function reset(): void {
    entries.value.clear()
    loaded.value = false
  }

  return { entries, loaded, loadEntries, saveEntry, deleteEntry, getEntry, reset }
})
