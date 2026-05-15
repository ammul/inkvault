import { encrypt, decrypt } from './crypto'
import type { TrackerConfig, DiaryEntry, ThemeSettings } from '@/types'

const BACKUP_SENTINEL = 'inkvault-backup-v1'
const PBKDF2_ITERATIONS = 600_000

function toBase64(bytes: Uint8Array): string {
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i])
  return btoa(binary)
}

function fromBase64(b64: string): Uint8Array<ArrayBuffer> {
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))
}

async function deriveBackupKey(passphrase: string, salt: Uint8Array<ArrayBuffer>): Promise<CryptoKey> {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(passphrase),
    'PBKDF2',
    false,
    ['deriveKey'],
  )
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  )
}

export interface BackupFile {
  version: 1
  exportedAt: string
  salt: string
  verify: string
  trackers: string
  entries: Record<string, string>
  theme?: string
}

export async function createBackup(
  passphrase: string,
  trackerConfigs: TrackerConfig[],
  diaryEntries: DiaryEntry[],
  themeSettings?: ThemeSettings,
): Promise<BackupFile> {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const key = await deriveBackupKey(passphrase, salt)
  const verify = await encrypt(key, BACKUP_SENTINEL)
  const encTrackers = await encrypt(key, JSON.stringify(trackerConfigs))
  const encEntries: Record<string, string> = {}
  for (const entry of diaryEntries) {
    encEntries[entry.date] = await encrypt(key, JSON.stringify(entry))
  }
  const result: BackupFile = {
    version: 1,
    exportedAt: new Date().toISOString(),
    salt: toBase64(salt),
    verify,
    trackers: encTrackers,
    entries: encEntries,
  }
  if (themeSettings) {
    result.theme = await encrypt(key, JSON.stringify(themeSettings))
  }
  return result
}

export async function restoreBackup(
  backup: BackupFile,
  passphrase: string,
): Promise<{ trackers: TrackerConfig[]; entries: DiaryEntry[]; theme: ThemeSettings | null }> {
  if (backup.version !== 1) throw new Error('Unsupported backup version')
  const salt = fromBase64(backup.salt)
  const key = await deriveBackupKey(passphrase, salt)
  let sentinel: string
  try {
    sentinel = await decrypt(key, backup.verify)
  } catch {
    throw new Error('Wrong backup passphrase')
  }
  if (sentinel !== BACKUP_SENTINEL) throw new Error('Wrong backup passphrase')
  const trackers = JSON.parse(await decrypt(key, backup.trackers)) as TrackerConfig[]
  const entries = await Promise.all(
    Object.values(backup.entries).map(
      async (blob) => JSON.parse(await decrypt(key, blob)) as DiaryEntry,
    ),
  )
  let theme: ThemeSettings | null = null
  if (backup.theme) {
    try {
      theme = JSON.parse(await decrypt(key, backup.theme)) as ThemeSettings
    } catch {
      // old backup without theme — ignore
    }
  }
  return { trackers, entries, theme }
}
