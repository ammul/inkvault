import { initVault, unlockVault, encrypt, decrypt, deriveVaultKey, PBKDF2_ITERATIONS_LEGACY } from '@/utils/crypto'

describe('crypto', () => {
  test('initVault returns a CryptoKey, salt, and verifyBlob', async () => {
    const result = await initVault('test-passphrase')
    expect(result.key).toBeInstanceOf(CryptoKey)
    expect(typeof result.salt).toBe('string')
    expect(result.salt.length).toBeGreaterThan(0)
    expect(typeof result.verifyBlob).toBe('string')
    expect(result.verifyBlob.length).toBeGreaterThan(0)
  })

  test('unlockVault succeeds with the correct passphrase', async () => {
    const { salt, verifyBlob } = await initVault('my-passphrase')
    const key = await unlockVault('my-passphrase', salt, verifyBlob)
    expect(key).toBeInstanceOf(CryptoKey)
  })

  test('unlockVault throws with wrong passphrase', async () => {
    const { salt, verifyBlob } = await initVault('correct-passphrase')
    await expect(unlockVault('wrong-passphrase', salt, verifyBlob)).rejects.toThrow()
  })

  test('encrypt and decrypt round-trips any string', async () => {
    const { key } = await initVault('round-trip')
    const plaintext = 'Hello, InkVault! 🔏'
    const blob = await encrypt(key, plaintext)
    const result = await decrypt(key, blob)
    expect(result).toBe(plaintext)
  })

  test('encrypt produces different ciphertext each call (random IV)', async () => {
    const { key } = await initVault('iv-test')
    const blob1 = await encrypt(key, 'same plaintext')
    const blob2 = await encrypt(key, 'same plaintext')
    expect(blob1).not.toBe(blob2)
  })

  test('decrypt throws on tampered ciphertext', async () => {
    const { key } = await initVault('tamper-test')
    const blob = await encrypt(key, 'sensitive data')
    // Corrupt a byte in the ciphertext portion (after the 16-char IV region in base64)
    const chars = blob.split('')
    chars[25] = chars[25] === 'A' ? 'B' : 'A'
    await expect(decrypt(key, chars.join(''))).rejects.toThrow()
  })

  test('decrypt throws when using a key from a different passphrase', async () => {
    const { key: key1 } = await initVault('passphrase-one')
    const { key: key2 } = await initVault('passphrase-two')
    const blob = await encrypt(key1, 'data')
    await expect(decrypt(key2, blob)).rejects.toThrow()
  })

  test('CryptoKey is non-extractable', async () => {
    const { key } = await initVault('non-extractable')
    expect(key.extractable).toBe(false)
  })

  test('unlockVault accepts explicit iteration count (legacy vaults)', async () => {
    const passphrase = 'legacy-test'
    const saltB64 = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(16))))
    const legacyKey = await deriveVaultKey(passphrase, saltB64, PBKDF2_ITERATIONS_LEGACY)
    const verifyBlob = await encrypt(legacyKey, 'inkvault-v1')
    const key = await unlockVault(passphrase, saltB64, verifyBlob, PBKDF2_ITERATIONS_LEGACY)
    expect(key).toBeInstanceOf(CryptoKey)
  })

  test('deriveVaultKey with different iterations produces different keys', async () => {
    const passphrase = 'same-pass'
    const saltB64 = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(16))))
    const key1 = await deriveVaultKey(passphrase, saltB64, PBKDF2_ITERATIONS_LEGACY)
    const key2 = await deriveVaultKey(passphrase, saltB64, 600_000)
    const blob = await encrypt(key1, 'test')
    await expect(decrypt(key2, blob)).rejects.toThrow()
  })
})
