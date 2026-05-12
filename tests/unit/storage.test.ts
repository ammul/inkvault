import { writeEncrypted, readEncrypted, listEntryKeys, writePlain, readPlain, remove } from '@/utils/storage'
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
})
