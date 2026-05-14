# InkVault — Architecture Reference

This document is the authoritative reference for the InkVault codebase. It is written for future Claude sessions and developers who need to understand the system before making changes.

---

## Overview

InkVault is a fully client-side Vue 3 SPA with zero backend. All diary data is encrypted on the user's device using the browser's native Web Crypto API. The app is deployed as a static site on GitHub Pages. Privacy is the primary design constraint — no data ever leaves the device unencrypted.

**Deployed at:** `https://<username>.github.io/inkvault/`
**Repo name:** `inkvault`
**Vite base path:** `/inkvault/`

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Vue 3 (Composition API, `<script setup>`) |
| Language | TypeScript (strict mode) |
| Build | Vite 6, `@vitejs/plugin-vue` |
| State | Pinia |
| Router | Vue Router 4, hash mode |
| CSS | Tailwind CSS v4 (Vite plugin, no config file) |
| Unit tests | Vitest + jsdom |
| E2E tests | Playwright (against built `dist/`) |
| CI/CD | GitHub Actions → `peaceiris/actions-gh-pages` |

---

## Security Model

### Encryption

- **Algorithm:** AES-256-GCM (authenticated encryption — any tampering causes decryption to throw)
- **Key derivation:** PBKDF2 / SHA-256 / 600,000 iterations (OWASP 2025 recommendation for SHA-256)
- **IV:** Fresh random 12 bytes per `encrypt()` call — no IV reuse
- **Key extractability:** `false` — the `CryptoKey` object cannot be serialized or read by JS code
- **No external crypto dependencies** — Web Crypto API is built into every modern browser

### Blob format

Every encrypted value is stored as a base64 string with this layout:

```
[IV (12 bytes)][ciphertext (N bytes)] → base64
```

The salt is stored separately in plaintext (this is correct — the salt is not secret, only the passphrase is).

### Key lifecycle

1. User enters passphrase → PBKDF2 derives a `CryptoKey` → stored in Pinia `auth` store (memory only)
2. Key is used for all encrypt/decrypt operations via `storage.ts`
3. On lock / page close / reload / idle timeout / tab hide: key is gone — user must re-enter passphrase
4. Passphrase is never stored anywhere

### Passphrase verification

On first setup: derive key from passphrase → encrypt sentinel string `'inkvault-v1'` → store as `iv:verify`.
On unlock: derive key → attempt to decrypt `iv:verify` → AES-GCM auth tag failure = wrong passphrase.

### Passphrase strength

`src/utils/passphrase.ts` exports `scorePassphrase()` and `MIN_PASSPHRASE_LENGTH` (currently 12). The unlock screen blocks vault creation, and the settings view blocks backup export, when the proposed passphrase is shorter than the minimum. A 4-bar strength indicator is shown live as the user types. **The minimum is the floor: do not lower it.** Strength enforcement only applies at *creation* time — existing vaults and existing backup files can still be unlocked with whatever passphrase they were created with.

### Content Security Policy

The production build injects a strict CSP via a Vite plugin (`inject-csp` in `vite.config.ts`). The CSP is **not** present in dev mode (HMR/WebSocket would break). Production policy:

```
default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline';
img-src 'self' data:; font-src 'self' data:; connect-src 'none';
base-uri 'none'; form-action 'none'; frame-ancestors 'none'; object-src 'none'
```

`connect-src 'none'` enforces the "no network egress, ever" guarantee at the browser level — even an XSS cannot exfiltrate plaintext over the network. If a future change requires `fetch`/`XHR`, that breaks the privacy model and the CSP must be revisited.

### localStorage key schema

All keys owned by InkVault use the `iv:` prefix:

| Key | Content | Encryption |
|---|---|---|
| `iv:salt` | 16-byte PBKDF2 salt, base64 | Plaintext (by design) |
| `iv:kdf` | PBKDF2 iteration count (e.g. `"600000"`) | Plaintext (by design) |
| `iv:verify` | Encrypted sentinel string | Encrypted |
| `iv:datapoints` | JSON array of `DataPointConfig[]` | Encrypted |
| `iv:entry:YYYY-MM-DD` | JSON `DiaryEntry` object | Encrypted (one key per day) |

`iv:kdf` is absent on vaults created before the 600k migration. On unlock, the absence is treated as 310,000 (the old default). After successful unlock the vault is transparently re-encrypted at 600k and `iv:kdf` is written.

### Backup (export / import)

`src/utils/backup.ts` defines the portable backup format and its own KDF call path:

- **Independent passphrase + salt.** A backup uses its own 16-byte random salt and PBKDF2 derivation (310k / SHA-256). The backup passphrase is *not* the vault passphrase; the user picks a new one at export time.
- **Format:** JSON file with `version`, `exportedAt`, `salt`, `verify` (encrypted sentinel `inkvault-backup-v1`), `datapoints` (encrypted config array), and `entries` (date → encrypted `DiaryEntry` blob).
- **Every blob has its own random IV** — same construction as on-disk storage.
- **Wrong-passphrase detection** uses the backup sentinel's AES-GCM auth tag.
- **Restore via unlock screen** (`UnlockScreen.vue`): the backup passphrase becomes the new vault passphrase. **Restore via settings** (`SettingsView.vue`): entries are merged into the currently-unlocked vault; data point configs are fully replaced.

---

## Data Models

Source: `src/types/index.ts`

```typescript
type DataPointType = 'range' | 'string' | 'multi-string' | 'boolean'

interface DataPointConfig {
  id: string           // crypto.randomUUID()
  label: string
  color: string        // CSS hex e.g. '#6366f1'
  icon: string         // emoji string
  type: DataPointType
  config: RangeConfig | StringConfig | MultiStringConfig | BooleanConfig
  createdAt: string    // ISO datetime
}

type RangeConfig      = { min: number; max: number; step: number; labels?: string[] }
type StringConfig     = { placeholder?: string }
type MultiStringConfig = { options: string[] }
type BooleanConfig    = { trueLabel: string; falseLabel: string }

type DataPointValue = number | string | string[] | boolean | null

interface DiaryEntry {
  date: string         // YYYY-MM-DD
  text: string         // free-form journal text
  dataValues: Record<string, DataPointValue>  // dataPointConfig.id → value
  updatedAt: string    // ISO datetime
}
```

---

## Crypto & Storage Layer

### `src/utils/crypto.ts`

The entire security model depends on this file. **Do not simplify it.**

Public API:
```typescript
initVault(passphrase)           → { salt, verifyBlob, key }  // first setup
unlockVault(passphrase, salt, verifyBlob) → CryptoKey         // subsequent unlock
encrypt(key, plaintext)         → Promise<string>             // base64 blob
decrypt(key, blob)              → Promise<string>             // throws on wrong key/tamper
```

Key internal function: `deriveKey(passphrase, salt, iterations?)` — defaults to 600,000 PBKDF2 iterations. **Never reduce this number.** `PBKDF2_ITERATIONS_LEGACY = 310_000` is exported only for the migration path and tests. `deriveVaultKey(passphrase, saltB64, iterations)` is a public helper used by `auth.ts` during vault migration.

### `src/utils/storage.ts`

Thin adapter combining crypto with localStorage. All localStorage access goes through here.

```typescript
writeEncrypted(key, storageKey, value)         // JSON.stringify → encrypt → localStorage
readEncrypted<T>(key, storageKey)              // localStorage → decrypt → JSON.parse
writePlain(storageKey, value)                  // only for salt, verifyBlob, kdf count
readPlain(storageKey)
remove(storageKey)
listEntryKeys()                                // returns all 'iv:entry:*' keys
migrateEncryptedBlobs(oldKey, newKey)          // re-encrypts all blobs (used on KDF migration)
KEYS                                           // constant map of all storage key names
```

**Never write to localStorage directly from a store or component — always go through `storage.ts`.**

---

## Pinia Stores

### `src/stores/auth.ts`

Manages the encryption key lifecycle. The `key` ref is the only place the `CryptoKey` lives.

| Item | Detail |
|---|---|
| `key: Ref<CryptoKey \| null>` | In-memory only, never persisted |
| `initialized: Ref<boolean>` | True if `iv:salt` + `iv:verify` exist in localStorage |
| `isUnlocked: ComputedRef<boolean>` | `key !== null` |
| `checkInitialized()` | Reads localStorage; call on app mount |
| `initializeVault(passphrase)` | First-time setup: derives key, writes salt + verify + kdf |
| `unlock(passphrase)` | Unlocks vault; transparently migrates to 600k PBKDF2 if vault was created with 310k |
| `lock()` | Clears `key` **and** calls `diary.reset()` + `datapoints.reset()` so decrypted data does not survive in memory |
| `resetVault()` | Destructive wipe: removes every `iv:entry:*`, `iv:datapoints`, `iv:salt`, `iv:verify`, `iv:kdf` and resets both stores |

### `src/stores/diary.ts`

| Item | Detail |
|---|---|
| `entries: Ref<Map<string, DiaryEntry>>` | Keyed by YYYY-MM-DD |
| `loaded: Ref<boolean>` | Set true after `loadEntries()` |
| `loadEntries()` | Reads and decrypts all `iv:entry:*` keys |
| `saveEntry(entry)` | Encrypts and writes `iv:entry:YYYY-MM-DD` |
| `deleteEntry(date)` | Removes from store + localStorage |
| `getEntry(date)` | Returns entry or null |
| `reset()` | Clears in-memory state (called on lock) |

### `src/stores/datapoints.ts`

| Item | Detail |
|---|---|
| `configs: Ref<DataPointConfig[]>` | All data point configurations |
| `loaded: Ref<boolean>` | Set true after `loadConfigs()` |
| `loadConfigs()` | Reads and decrypts `iv:datapoints` |
| `saveConfigs()` | Encrypts and writes entire `configs` array |
| `addConfig(config)` | Push + saveConfigs |
| `updateConfig(id, patch)` | Merge patch + saveConfigs |
| `deleteConfig(id)` | Filter out + saveConfigs |
| `reset()` | Clears in-memory state (called on lock) |

---

## Component Tree

```
App.vue
├── UnlockScreen.vue          (shown when !auth.isUnlocked)
└── AppShell.vue              (shown when auth.isUnlocked)
    ├── AppNav.vue            (logo, nav links, lock button)
    └── RouterView
        ├── HomeView.vue          /home  (3 navigation cards)
        ├── DiaryView.vue         /diary, /diary/:date
        │   ├── CalendarView.vue  (month grid)
        │   └── DayEntry.vue      (journal + data point fields)
        │       └── DataPointField.vue  (dispatch component)
        │           ├── RangeField.vue
        │           ├── StringField.vue
        │           ├── MultiStringField.vue
        │           └── BooleanField.vue
        ├── StatisticsView.vue    /stats
        │   └── StatsPanel.vue    (one per trackable data point)
        └── DataPointsView.vue    /data
            ├── DataPointList.vue
            └── DataPointEditor.vue
```

### DataPointField dispatch pattern

`DataPointField.vue` receives a `DataPointConfig` and the current value, and renders the correct field component via `component :is`. Adding a new field type requires:
1. Adding the type to `DataPointType` in `types/index.ts`
2. Adding its config interface in `types/index.ts`
3. Creating `src/components/datapoints/fields/NewTypeField.vue`
4. Adding the entry to `fieldMap` in `DataPointField.vue`

---

## Router

- **Mode:** Hash (`createWebHashHistory()`) — mandatory for GitHub Pages (no server-side routing)
- **Auth guard:** Returns `false` (aborts navigation) when `auth.isUnlocked === false`
- **Unlock UX:** `App.vue` conditionally renders `UnlockScreen` — not a route, so URL stays stable during unlock

Routes:
| Path | Name | Component |
|---|---|---|
| `/` | — | redirect → `/home` |
| `/home` | `home` | `HomeView` |
| `/diary` | `diary` | `DiaryView` (calendar) |
| `/diary/:date` | `diary-day` | `DiaryView` (day entry) |
| `/stats` | `stats` | `StatisticsView` |
| `/data` | `datapoints` | `DataPointsView` |
| `/settings` | `settings` | `SettingsView` (backup export/import) |

---

## App Unlock Flow

```
User visits app
  → App.vue: auth.checkInitialized()
    → No vault (first visit): UnlockScreen shows "Create passphrase" form
      → User submits: auth.initializeVault(passphrase) → router.push('/home')
    → Vault exists (return visit): UnlockScreen shows "Enter passphrase" form
      → Correct: auth.unlock(passphrase) → router.push('/home')
      → Wrong: throws → error shown, key stays null
  → auth.isUnlocked === true: AppShell + RouterView render
```

---

## Build & Deployment

### Vite config

```typescript
base: '/inkvault/'    // MUST match GitHub repo name exactly
build: { target: 'es2022', sourcemap: false }
```

If the repo is renamed, update `base` in `vite.config.ts`.

A custom `inject-csp` plugin in the same config appends a strict `Content-Security-Policy` meta tag to `dist/index.html` at build time (skipped in dev). See *Security Model → Content Security Policy* above.

### GitHub Actions pipeline

```
push to main:
  test (always) ─┐
  e2e  (always) ─┴→ build → deploy (main only)

PRs: test + e2e only (no build/deploy)
```

E2E tests run against the production build (`npm run build` then `npm run preview`), not the dev server.

---

## Testing

### Unit tests (Vitest + jsdom)

- `tests/unit/setup.ts`: Polyfills `crypto.subtle` from Node's `webcrypto` (jsdom lacks it)
- Coverage target: `src/utils/**` and `src/stores/**`

Run: `npm run test:unit`

### E2E tests (Playwright, Chromium only)

- Run against `npm run preview` (built dist/)
- Base URL: `http://localhost:4173`
- Each test clears localStorage and sets up a fresh vault in `beforeEach`

Run: `npm run test:e2e`

### Type check

Run: `npm run type-check` (vue-tsc --noEmit)

---

## Security Invariants

These must hold at all times. Before any change, verify none of these are violated:

1. **No plaintext data in localStorage** — only `iv:salt` and `iv:kdf` are written unencrypted (intentional)
2. **No localStorage writes outside `storage.ts`** — all writes go through `writeEncrypted` or `writePlain`
3. **The `CryptoKey` never leaves Pinia** — not serialized, not passed to `localStorage`, not logged
4. **PBKDF2 iterations stay ≥ 600,000** — reducing this weakens brute-force resistance
5. **`MIN_PASSPHRASE_LENGTH` stays ≥ 12** — short passphrases defeat the KDF entirely
6. **`lock()` resets the diary and datapoints stores** — otherwise plaintext lingers in JS memory after lock
7. **`resetVault()` wipes every `iv:*` key** — leaving orphaned ciphertext defeats the user's intent
8. **`sourcemap: false` in production build** — source maps reveal code structure
9. **Production CSP includes `connect-src 'none'`** — no network egress, ever; XSS cannot exfiltrate
10. **Hash router mode** — never switch to `createWebHistory()` (breaks GitHub Pages)
11. **Auto-lock listeners in `App.vue`** — vault locks on `visibilitychange → hidden` and after 10 min idle; do not remove

---

## Deferred Features

These are **not implemented** and should not be added without user instruction:

- **Chart library**: Statistics view uses a plain data table; chart visualization comes with design
- **IndexedDB migration**: localStorage is used now; migrate to IndexedDB if 5MB limit becomes an issue
- **Visual design**: Design is intentionally minimal; user will provide a design separately
