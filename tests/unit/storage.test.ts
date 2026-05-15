import { writeEncrypted, readEncrypted, listEntryKeys, listEntryDates, readSchemaVersion, writeSchemaVersion, writePlain, readPlain, remove, KEYS, migrateEncryptedBlobs } from '@/utils/storage'
import { initVault } from '@/utils/crypto'

beforeEach(() => {
  localStorage.clear()
})

describe('storage', () => {
  test('writeEncrypted stores an opaque blob (not plaintext)', async () => {
    const { key } = await initVault('storage-test')
    await writeEncrypted(key, 'test:key', { hello: 'world' })
    const raw = localStorage.getItem('test:key')
    expect(raw).not.toBeNull()
    expect(raw).not.toContain('hello')
    expect(raw).not.toContain('world')
  })

  test('readEncrypted round-trips a complex object', async () => {
    const { key } = await initVault('rw-test')
    const obj = { a: 1, b: [1, 2, 3], c: true, d: null }
    await writeEncrypted(key, 'test:obj', obj)
    const result = await readEncrypted<typeof obj>(key, 'test:obj')
    expect(result).toEqual(obj)
  })

  test('readEncrypted returns null for a missing key', async () => {
    const { key } = await initVault('null-test')
    const result = await readEncrypted(key, 'nonexistent:key')
    expect(result).toBeNull()
  })

  test('listEntryKeys returns only diary entry keys', () => {
    localStorage.setItem('iv:entry:2024-01-01', 'x')
    localStorage.setItem('iv:entry:2024-01-02', 'x')
    localStorage.setItem('iv:salt', 'y')
    localStorage.setItem('other:stuff', 'z')
    const keys = listEntryKeys()
    expect(keys).toHaveLength(2)
    expect(keys.every((k) => k.startsWith('iv:entry:'))).toBe(true)
  })

  test('writePlain and readPlain work without encryption', () => {
    writePlain('plain:key', 'hello world')
    expect(readPlain('plain:key')).toBe('hello world')
  })

  test('remove deletes a key from localStorage', () => {
    writePlain('remove:me', 'value')
    remove('remove:me')
    expect(readPlain('remove:me')).toBeNull()
  })

  test('listEntryDates returns bare date strings without the iv:entry: prefix', () => {
    localStorage.setItem('iv:entry:2024-01-01', 'x')
    localStorage.setItem('iv:entry:2024-01-02', 'x')
    localStorage.setItem('iv:salt', 'y')
    const dates = listEntryDates()
    expect(dates).toHaveLength(2)
    expect(dates).toContain('2024-01-01')
    expect(dates).toContain('2024-01-02')
    expect(dates.every((d) => !d.startsWith('iv:entry:'))).toBe(true)
  })

  test('readSchemaVersion returns 0 when iv:schema is absent', () => {
    expect(readSchemaVersion()).toBe(0)
  })

  test('writeSchemaVersion and readSchemaVersion round-trip', () => {
    writeSchemaVersion(3)
    expect(readSchemaVersion()).toBe(3)
  })

  test('migrateEncryptedBlobs re-encrypts blobs so the new key can read them', async () => {
    const { key: oldKey } = await initVault('old-vault-migrate')
    const { key: newKey } = await initVault('new-vault-migrate')
    await writeEncrypted(oldKey, KEYS.TRACKERS, { migrated: true })
    await writeEncrypted(oldKey, KEYS.THEME, { colorTheme: 'teal' })
    await migrateEncryptedBlobs(oldKey, newKey)
    const dp = await readEncrypted<{ migrated: boolean }>(newKey, KEYS.TRACKERS)
    const theme = await readEncrypted<{ colorTheme: string }>(newKey, KEYS.THEME)
    expect(dp).toEqual({ migrated: true })
    expect(theme).toEqual({ colorTheme: 'teal' })
  })

  test('old key cannot decrypt blobs after migration', async () => {
    const { key: oldKey } = await initVault('old-vault-stale')
    const { key: newKey } = await initVault('new-vault-stale')
    await writeEncrypted(oldKey, KEYS.TRACKERS, { secret: 'data' })
    await migrateEncryptedBlobs(oldKey, newKey)
    await expect(readEncrypted(oldKey, KEYS.TRACKERS)).rejects.toThrow()
  })
})
