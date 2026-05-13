import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '@/stores/auth'
import { useDiaryStore } from '@/stores/diary'
import type { DiaryEntry } from '@/types'

beforeEach(async () => {
  setActivePinia(createPinia())
  localStorage.clear()
  await useAuthStore().initializeVault('diary-test')
})

function makeEntry(date: string, text = 'Test entry'): DiaryEntry {
  return { date, text, entries: [], dataValues: {}, updatedAt: new Date().toISOString() }
}

describe('diary store', () => {
  test('saveEntry stores and getEntry retrieves an entry', async () => {
    const diary = useDiaryStore()
    const entry = makeEntry('2024-06-01')
    await diary.saveEntry(entry)
    expect(diary.getEntry('2024-06-01')).toEqual(entry)
  })

  test('loadEntries restores previously saved entries after reset', async () => {
    const diary = useDiaryStore()
    await diary.saveEntry(makeEntry('2024-06-01'))
    await diary.saveEntry(makeEntry('2024-06-02'))
    diary.reset()
    expect(diary.entries.size).toBe(0)
    await diary.loadEntries()
    expect(diary.entries.size).toBe(2)
  })

  test('entries are not stored in plaintext', async () => {
    const diary = useDiaryStore()
    const entry = makeEntry('2024-06-01', 'totally secret content')
    await diary.saveEntry(entry)
    const raw = localStorage.getItem('iv:entry:2024-06-01')
    expect(raw).not.toContain('totally secret content')
    expect(raw).not.toBeNull()
  })

  test('deleteEntry removes from store and localStorage', async () => {
    const diary = useDiaryStore()
    await diary.saveEntry(makeEntry('2024-06-01'))
    await diary.deleteEntry('2024-06-01')
    expect(diary.getEntry('2024-06-01')).toBeNull()
    expect(localStorage.getItem('iv:entry:2024-06-01')).toBeNull()
  })

  test('getEntry returns null for a missing date', () => {
    const diary = useDiaryStore()
    expect(diary.getEntry('2024-01-01')).toBeNull()
  })

  test('saveEntry updates an existing entry', async () => {
    const diary = useDiaryStore()
    await diary.saveEntry(makeEntry('2024-06-01', 'original'))
    await diary.saveEntry(makeEntry('2024-06-01', 'updated'))
    expect(diary.getEntry('2024-06-01')?.text).toBe('updated')
  })
})
