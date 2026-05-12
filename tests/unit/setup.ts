import { webcrypto } from 'node:crypto'

// jsdom does not implement crypto.subtle — use Node's built-in Web Crypto
if (!globalThis.crypto?.subtle) {
  Object.defineProperty(globalThis, 'crypto', {
    value: webcrypto,
    configurable: true,
  })
}
