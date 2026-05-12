# InkVault — Claude Code Instructions

## Project Overview

InkVault is a private, fully client-side encrypted diary app built with Vue 3 + TypeScript.
All user data is encrypted on-device with AES-256-GCM. No backend. No accounts.
Deployed to GitHub Pages as a static site.

See `ARCHITECTURE.md` for the full technical reference.

## Commands

```bash
npm run dev           # Development server (localhost:5173)
npm run build         # Type-check + Vite build → dist/
npm run type-check    # vue-tsc --noEmit (always run before claiming a change is done)
npm run test:unit     # Vitest unit tests
npm run test:e2e      # Playwright E2E tests (requires npm run build first)
npm run preview       # Serve dist/ at localhost:4173 (used by E2E tests)
```

## Critical Rules

### Security — highest priority

- **Never simplify `src/utils/crypto.ts`** at the cost of correctness. This file is the entire security model.
- **Never write to localStorage directly** from stores or components. All reads/writes go through `src/utils/storage.ts`.
- **Never reduce PBKDF2 iterations** below 600,000. This would weaken brute-force resistance. The vault uses `iv:kdf` (plaintext, like `iv:salt`) to store the iteration count; on unlock, old 310k vaults are transparently migrated to 600k.
- **Never enable sourcemaps** in the production build (`sourcemap: false` in vite.config.ts).
- **Never store the CryptoKey** anywhere other than the Pinia `auth` store's `key` ref.
- **`iv:salt` is intentionally stored in plaintext** — this is correct, the salt is not secret.
- **Never weaken the passphrase strength check.** `MIN_PASSPHRASE_LENGTH` in `src/utils/passphrase.ts` is the floor for any new vault or backup passphrase. Reducing it weakens the entire system, since PBKDF2 cost cannot save a short password.
- **`lock()` must reset the diary and datapoints stores.** Otherwise decrypted data lingers in JS memory after the user thinks they locked the vault.
- **`resetVault()` must wipe every `iv:*` key**, not just salt and verify. Orphaned ciphertext is recoverable if the passphrase is later compromised.
- **Auto-lock is active.** `App.vue` locks the vault on `visibilitychange → hidden` and after 10 minutes of idle (no mouse/keyboard/touch/scroll). Do not remove these listeners.
- **The production CSP must include `connect-src 'none'`.** Injected by the `inject-csp` plugin in `vite.config.ts`. The app must never need network access — adding `fetch` or any external resource breaks the privacy guarantee.

### Architecture

- **Hash router mode is mandatory** (`createWebHashHistory()`). GitHub Pages cannot do server-side routing. Never switch to `createWebHistory()`.
- **Vite base path is `/inkvault/`** — do not change without also updating the GitHub Actions deploy config and repo name.
- **The unlock screen is not a route** — `App.vue` conditionally renders `UnlockScreen` when `!auth.isUnlocked`. This keeps the URL stable during unlock.
- **Cross-store dependencies**: stores call `useAuthStore()` inside actions (not at definition level). This is correct Pinia pattern.

### Workflow

- Always run `npm run type-check` before claiming a change is complete.
- The E2E tests run against the production build. Run `npm run build` before `npm run test:e2e`.
- Vitest unit tests require the `tests/unit/setup.ts` polyfill for `crypto.subtle` (jsdom lacks Web Crypto).

### Design

- The visual design is intentionally minimal (bare Tailwind utility classes only).
- **Do not add styling beyond Tailwind utilities** unless the user explicitly provides a design.
- Do not add component libraries, icon libraries, or animation libraries without being asked.

## Key File Locations

| Purpose | Path |
|---|---|
| Data types | `src/types/index.ts` |
| Crypto primitives | `src/utils/crypto.ts` |
| Storage adapter | `src/utils/storage.ts` |
| Backup format (export/import) | `src/utils/backup.ts` |
| Passphrase strength | `src/utils/passphrase.ts` |
| Auth store (key lifecycle) | `src/stores/auth.ts` |
| Diary store | `src/stores/diary.ts` |
| Data points store | `src/stores/datapoints.ts` |
| Router | `src/router/index.ts` |
| App entry gating | `src/App.vue` |
| Unlock screen | `src/components/auth/UnlockScreen.vue` |
| Settings / backup UI | `src/views/SettingsView.vue` |
| Field dispatch | `src/components/datapoints/DataPointField.vue` |
| Vite config (incl. CSP injection) | `vite.config.ts` |
| CI/CD pipeline | `.github/workflows/deploy.yml` |

## Deferred Features (do not implement unless asked)

- Chart library for statistics view
- Visual design system
- IndexedDB migration
