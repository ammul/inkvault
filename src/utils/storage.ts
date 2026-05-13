import { encrypt, decrypt } from './crypto'

export const KEYS = {
  SALT: 'iv:salt',
  VERIFY: 'iv:verify',
  KDF: 'iv:kdf',
  DATAPOINTS: 'iv:datapoints',
  THEME: 'iv:theme',
  APP_SETTINGS: 'iv:app-settings',
  ENTRY: (date: string) => `iv:entry:${date}`,
  ALL_ENTRY_PREFIX: 'iv:entry:',
} as const

export function listEntryKeys(): string[] {
  return Object.keys(localStorage).filter((k) => k.startsWith(KEYS.ALL_ENTRY_PREFIX))
}

export async function writeEncrypted(
  key: CryptoKey,
  storageKey: string,
  value: unknown,
): Promise<void> {
  const blob = await encrypt(key, JSON.stringify(value))
  localStorage.setItem(storageKey, blob)
}

export async function readEncrypted<T>(key: CryptoKey, storageKey: string): Promise<T | null> {
  const blob = localStorage.getItem(storageKey)
  if (!blob) return null
  const json = await decrypt(key, blob)
  return JSON.parse(json) as T
}

export function writePlain(storageKey: string, value: string): void {
  localStorage.setItem(storageKey, value)
}

export function readPlain(storageKey: string): string | null {
  return localStorage.getItem(storageKey)
}

export function remove(storageKey: string): void {
  localStorage.removeItem(storageKey)
}

export async function migrateEncryptedBlobs(oldKey: CryptoKey, newKey: CryptoKey): Promise<void> {
  const storageKeys = [KEYS.VERIFY, KEYS.DATAPOINTS, KEYS.THEME, KEYS.APP_SETTINGS, ...listEntryKeys()]
  for (const k of storageKeys) {
    const blob = localStorage.getItem(k)
    if (!blob) continue
    const plain = await decrypt(oldKey, blob)
    localStorage.setItem(k, await encrypt(newKey, plain))
  }
}
