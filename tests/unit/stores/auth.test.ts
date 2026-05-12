import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '@/stores/auth'
import { deriveVaultKey, encrypt, PBKDF2_ITERATIONS_LEGACY, VAULT_SENTINEL } from '@/utils/crypto'
import { KEYS, writePlain } from '@/utils/storage'

beforeEach(() => {
  setActivePinia(createPinia())
  localStorage.clear()
})

describe('auth store', () => {
  test('checkInitialized returns false on empty localStorage', () => {
    const auth = useAuthStore()
    expect(auth.checkInitialized()).toBe(false)
    expect(auth.initialized).toBe(false)
    expect(auth.isUnlocked).toBe(false)
  })

  test('initializeVault sets key, marks initialized, writes salt + verify + kdf to localStorage', async () => {
    const auth = useAuthStore()
    await auth.initializeVault('my-passphrase')
    expect(auth.isUnlocked).toBe(true)
    expect(auth.initialized).toBe(true)
    expect(localStorage.getItem('iv:salt')).not.toBeNull()
    expect(localStorage.getItem('iv:verify')).not.toBeNull()
    expect(localStorage.getItem('iv:kdf')).toBe('600000')
  })

  test('lock clears the in-memory key', async () => {
    const auth = useAuthStore()
    await auth.initializeVault('passphrase')
    auth.lock()
    expect(auth.isUnlocked).toBe(false)
    expect(auth.key).toBeNull()
  })

  test('unlock with correct passphrase restores the key', async () => {
    const auth = useAuthStore()
    await auth.initializeVault('correct')
    auth.lock()
    await auth.unlock('correct')
    expect(auth.isUnlocked).toBe(true)
  })

  test('unlock with wrong passphrase throws and does not set key', async () => {
    const auth = useAuthStore()
    await auth.initializeVault('correct')
    auth.lock()
    await expect(auth.unlock('wrong')).rejects.toThrow()
    expect(auth.isUnlocked).toBe(false)
    expect(auth.key).toBeNull()
  })

  test('passphrase is never stored in plaintext in localStorage', async () => {
    const auth = useAuthStore()
    await auth.initializeVault('super-secret-passphrase-xyz')
    const allValues = Object.values(localStorage).join(' ')
    expect(allValues).not.toContain('super-secret-passphrase-xyz')
  })

  test('checkInitialized returns true after vault is created', async () => {
    const auth = useAuthStore()
    await auth.initializeVault('passphrase')
    auth.lock()
    // Simulate new page load: fresh store, same localStorage
    const auth2 = useAuthStore()
    expect(auth2.checkInitialized()).toBe(true)
  })

  test('unlock migrates a legacy 310k vault to 600k and writes iv:kdf', async () => {
    // Manually build a 310k vault in localStorage (simulates vaults created before the bump)
    const passphrase = 'legacy-passphrase'
    const saltBytes = crypto.getRandomValues(new Uint8Array(16))
    const saltB64 = btoa(String.fromCharCode(...saltBytes))
    const legacyKey = await deriveVaultKey(passphrase, saltB64, PBKDF2_ITERATIONS_LEGACY)
    const verifyBlob = await encrypt(legacyKey, VAULT_SENTINEL)
    writePlain(KEYS.SALT, saltB64)
    writePlain(KEYS.VERIFY, verifyBlob)
    // iv:kdf intentionally absent — old vaults did not have this key

    const auth = useAuthStore()
    auth.checkInitialized()
    await auth.unlock(passphrase)

    expect(auth.isUnlocked).toBe(true)
    expect(localStorage.getItem('iv:kdf')).toBe('600000')
  })

  test('resetVault removes iv:kdf', async () => {
    const auth = useAuthStore()
    await auth.initializeVault('passphrase')
    auth.resetVault()
    expect(localStorage.getItem('iv:kdf')).toBeNull()
  })
})
