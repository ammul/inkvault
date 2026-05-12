import { encrypt, decrypt } from './crypto'
import type { DataPointConfig, DiaryEntry } from '@/types'

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
  datapoints: string
  entries: Record<string, string>
}

export async function createBackup(
  passphrase: string,
  datapointConfigs: DataPointConfig[],
  diaryEntries: DiaryEntry[],
): Promise<BackupFile> {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const key = await deriveBackupKey(passphrase, salt)
  const verify = await encrypt(key, BACKUP_SENTINEL)
  const encDatapoints = await encrypt(key, JSON.stringify(datapointConfigs))
  const encEntries: Record<string, string> = {}
  for (const entry of diaryEntries) {
    encEntries[entry.date] = await encrypt(key, JSON.stringify(entry))
  }
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    salt: toBase64(salt),
    verify,
    datapoints: encDatapoints,
    entries: encEntries,
  }
}

export async function restoreBackup(
  backup: BackupFile,
  passphrase: string,
): Promise<{ datapoints: DataPointConfig[]; entries: DiaryEntry[] }> {
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
  const datapoints = JSON.parse(await decrypt(key, backup.datapoints)) as DataPointConfig[]
  const entries = await Promise.all(
    Object.values(backup.entries).map(
      async (blob) => JSON.parse(await decrypt(key, blob)) as DiaryEntry,
    ),
  )
  return { datapoints, entries }
}
