import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { initVault, unlockVault, deriveVaultKey, PBKDF2_ITERATIONS, PBKDF2_ITERATIONS_LEGACY } from '@/utils/crypto'
import { KEYS, writePlain, readPlain, remove, listEntryKeys, migrateEncryptedBlobs } from '@/utils/storage'
import { runMigrations, CURRENT_SCHEMA_VERSION } from '@/utils/migrations'
import { useDiaryStore } from './diary'
import { useTrackersStore } from './trackers'
import { useThemeStore } from './theme'
import { useAppSettingsStore } from './appSettings'

export const useAuthStore = defineStore('auth', () => {
  const key = ref<CryptoKey | null>(null)
  const initialized = ref(false)

  const isUnlocked = computed(() => key.value !== null)

  function checkInitialized(): boolean {
    const hasVault = !!readPlain(KEYS.SALT) && !!readPlain(KEYS.VERIFY)
    initialized.value = hasVault
    return hasVault
  }

  async function initializeVault(passphrase: string): Promise<void> {
    const { salt, verifyBlob, key: derivedKey } = await initVault(passphrase)
    writePlain(KEYS.SALT, salt)
    writePlain(KEYS.VERIFY, verifyBlob)
    writePlain(KEYS.KDF, String(PBKDF2_ITERATIONS))
    writePlain(KEYS.SCHEMA, String(CURRENT_SCHEMA_VERSION))
    key.value = derivedKey
    initialized.value = true
  }

  async function unlock(passphrase: string): Promise<void> {
    const salt = readPlain(KEYS.SALT)
    const verifyBlob = readPlain(KEYS.VERIFY)
    if (!salt || !verifyBlob) throw new Error('Vault not initialized')

    const storedIterations = parseInt(readPlain(KEYS.KDF) ?? String(PBKDF2_ITERATIONS_LEGACY), 10)
    const oldKey = await unlockVault(passphrase, salt, verifyBlob, storedIterations)

    let finalKey: CryptoKey
    if (storedIterations < PBKDF2_ITERATIONS) {
      finalKey = await deriveVaultKey(passphrase, salt, PBKDF2_ITERATIONS)
      await migrateEncryptedBlobs(oldKey, finalKey)
      writePlain(KEYS.KDF, String(PBKDF2_ITERATIONS))
    } else {
      finalKey = oldKey
    }

    await runMigrations(finalKey)
    key.value = finalKey
  }

  function lock(): void {
    key.value = null
    useDiaryStore().reset()
    useTrackersStore().reset()
    useThemeStore().reset()
    useAppSettingsStore().reset()
  }

  function resetVault(): void {
    for (const entryKey of listEntryKeys()) remove(entryKey)
    remove(KEYS.TRACKERS)
    remove(KEYS.SALT)
    remove(KEYS.VERIFY)
    remove(KEYS.KDF)
    remove(KEYS.SCHEMA)
    remove(KEYS.THEME)
    remove(KEYS.APP_SETTINGS)
    useDiaryStore().reset()
    useTrackersStore().reset()
    useThemeStore().reset()
    useAppSettingsStore().reset()
    key.value = null
    initialized.value = false
  }

  return { key, initialized, isUnlocked, checkInitialized, initializeVault, unlock, lock, resetVault }
})
