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

  test('loadAllEntries restores previously saved entries after reset', async () => {
    const diary = useDiaryStore()
    await diary.saveEntry(makeEntry('2024-06-01'))
    await diary.saveEntry(makeEntry('2024-06-02'))
    diary.reset()
    expect(diary.entries.size).toBe(0)
    await diary.loadAllEntries()
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

  test('getAvailableDates returns dates without decrypting entries', async () => {
    const diary = useDiaryStore()
    await diary.saveEntry(makeEntry('2024-06-01'))
    await diary.saveEntry(makeEntry('2024-06-02'))
    diary.reset()
    const dates = diary.getAvailableDates()
    expect(dates).toHaveLength(2)
    expect(dates).toContain('2024-06-01')
    expect(dates).toContain('2024-06-02')
    // entries Map should still be empty (no decryption performed)
    expect(diary.entries.size).toBe(0)
    expect(diary.datesLoaded).toBe(true)
  })

  test('loadEntry decrypts and caches a single entry', async () => {
    const diary = useDiaryStore()
    await diary.saveEntry(makeEntry('2024-06-01'))
    await diary.saveEntry(makeEntry('2024-06-02'))
    diary.reset()
    const entry = await diary.loadEntry('2024-06-01')
    expect(entry?.date).toBe('2024-06-01')
    expect(diary.entries.size).toBe(1)
  })

  test('loadEntry returns cached entry on second call', async () => {
    const diary = useDiaryStore()
    await diary.saveEntry(makeEntry('2024-06-01'))
    await diary.loadEntry('2024-06-01')
    const sizeBefore = diary.entries.size
    await diary.loadEntry('2024-06-01')
    expect(diary.entries.size).toBe(sizeBefore)
  })

  test('loadEntry returns null for a missing date', async () => {
    const diary = useDiaryStore()
    const result = await diary.loadEntry('1900-01-01')
    expect(result).toBeNull()
  })

  test('saveEntry updates availableDates', async () => {
    const diary = useDiaryStore()
    await diary.saveEntry(makeEntry('2024-06-01'))
    expect(diary.availableDates.has('2024-06-01')).toBe(true)
  })

  test('deleteEntry removes from availableDates', async () => {
    const diary = useDiaryStore()
    await diary.saveEntry(makeEntry('2024-06-01'))
    await diary.deleteEntry('2024-06-01')
    expect(diary.availableDates.has('2024-06-01')).toBe(false)
  })

  test('reset clears availableDates and datesLoaded', async () => {
    const diary = useDiaryStore()
    await diary.saveEntry(makeEntry('2024-06-01'))
    diary.getAvailableDates()
    expect(diary.datesLoaded).toBe(true)
    diary.reset()
    expect(diary.availableDates.size).toBe(0)
    expect(diary.datesLoaded).toBe(false)
  })
})
