import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '@/stores/auth'
import { readSchemaVersion, writeSchemaVersion, listEntryKeys, readEncrypted, writeEncrypted } from '@/utils/storage'
import { runMigrations, CURRENT_SCHEMA_VERSION } from '@/utils/migrations'
import type { DiaryEntry } from '@/types'

beforeEach(async () => {
  setActivePinia(createPinia())
  localStorage.clear()
  await useAuthStore().initializeVault('migrations-test')
})

function getVaultKey(): CryptoKey {
  const auth = useAuthStore()
  if (!auth.key) throw new Error('not unlocked')
  return auth.key
}

async function saveRawEntry(key: CryptoKey, entry: object, date: string): Promise<void> {
  await writeEncrypted(key, `iv:entry:${date}`, entry)
}

describe('runMigrations', () => {
  test('is a no-op when iv:schema is already at CURRENT_SCHEMA_VERSION', async () => {
    const key = getVaultKey()
    writeSchemaVersion(CURRENT_SCHEMA_VERSION)
    const keysBefore = listEntryKeys()
    await runMigrations(key)
    expect(listEntryKeys()).toEqual(keysBefore)
    expect(readSchemaVersion()).toBe(CURRENT_SCHEMA_VERSION)
  })

  test('runs pending migrations when iv:schema is absent (version 0)', async () => {
    localStorage.removeItem('iv:schema')
    expect(readSchemaVersion()).toBe(0)
    const key = getVaultKey()
    await runMigrations(key)
    expect(readSchemaVersion()).toBe(CURRENT_SCHEMA_VERSION)
  })

  test('writes schema version after each migration step', async () => {
    localStorage.removeItem('iv:schema')
    const key = getVaultKey()
    await runMigrations(key)
    expect(readSchemaVersion()).toBe(CURRENT_SCHEMA_VERSION)
  })

  test('is idempotent — running twice yields the same result', async () => {
    localStorage.removeItem('iv:schema')
    const key = getVaultKey()
    await runMigrations(key)
    const versionAfterFirst = readSchemaVersion()
    await runMigrations(key)
    expect(readSchemaVersion()).toBe(versionAfterFirst)
  })

  test('does not touch entries if already at current schema version', async () => {
    const key = getVaultKey()
    const entry: DiaryEntry = { date: '2024-01-01', text: 'hello', entries: [], dataValues: {}, updatedAt: new Date().toISOString() }
    await saveRawEntry(key, entry, '2024-01-01')
    writeSchemaVersion(CURRENT_SCHEMA_VERSION)
    await runMigrations(key)
    const loaded = await readEncrypted<DiaryEntry>(key, 'iv:entry:2024-01-01')
    expect(loaded).toEqual(entry)
  })
})

describe('readSchemaVersion / writeSchemaVersion', () => {
  test('returns 0 when iv:schema is absent', () => {
    localStorage.removeItem('iv:schema')
    expect(readSchemaVersion()).toBe(0)
  })

  test('round-trips correctly', () => {
    writeSchemaVersion(5)
    expect(readSchemaVersion()).toBe(5)
  })

  test('returns 0 for non-numeric stored value', () => {
    localStorage.setItem('iv:schema', 'bad')
    expect(readSchemaVersion()).toBe(0)
  })
})
