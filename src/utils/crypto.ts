const PBKDF2_ITERATIONS = 600_000
export const PBKDF2_ITERATIONS_LEGACY = 310_000
export const VAULT_SENTINEL = 'inkvault-v1'

function toBase64(bytes: Uint8Array): string {
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

function fromBase64(b64: string): Uint8Array<ArrayBuffer> {
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))
}

async function deriveKey(passphrase: string, salt: Uint8Array<ArrayBuffer>, iterations = PBKDF2_ITERATIONS): Promise<CryptoKey> {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(passphrase),
    'PBKDF2',
    false,
    ['deriveKey'],
  )
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  )
}

export async function encrypt(key: CryptoKey, plaintext: string): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    new TextEncoder().encode(plaintext),
  )
  const result = new Uint8Array(iv.byteLength + ciphertext.byteLength)
  result.set(iv, 0)
  result.set(new Uint8Array(ciphertext), iv.byteLength)
  return toBase64(result)
}

export async function decrypt(key: CryptoKey, blob: string): Promise<string> {
  const bytes = fromBase64(blob)
  const iv = bytes.slice(0, 12)
  const ciphertext = bytes.slice(12)
  const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext)
  return new TextDecoder().decode(plaintext)
}

export async function initVault(
  passphrase: string,
): Promise<{ salt: string; verifyBlob: string; key: CryptoKey }> {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const key = await deriveKey(passphrase, salt)
  const verifyBlob = await encrypt(key, VAULT_SENTINEL)
  return { salt: toBase64(salt), verifyBlob, key }
}

export async function unlockVault(
  passphrase: string,
  saltB64: string,
  verifyBlob: string,
  iterations = PBKDF2_ITERATIONS,
): Promise<CryptoKey> {
  const salt = fromBase64(saltB64)
  const key = await deriveKey(passphrase, salt, iterations)
  const decrypted = await decrypt(key, verifyBlob)
  if (decrypted !== VAULT_SENTINEL) throw new Error('Invalid passphrase')
  return key
}

export async function deriveVaultKey(
  passphrase: string,
  saltB64: string,
  iterations: number,
): Promise<CryptoKey> {
  return deriveKey(passphrase, fromBase64(saltB64), iterations)
}

export { PBKDF2_ITERATIONS }
