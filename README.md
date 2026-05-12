# InkVault

A private, fully client-side encrypted diary. No backend. No accounts. No telemetry.
All data lives in your browser's `localStorage`, encrypted with AES-256-GCM using a key derived from your passphrase.

> **Status:** active development. The security model has been reviewed but this is a personal project, not an audited product. See [Threat model](#threat-model) for what InkVault does and does not defend against.

## Features

- **End-to-end client-side encryption.** AES-256-GCM authenticated encryption with PBKDF2-SHA256 key derivation (310,000 iterations).
- **No network egress.** The production build sets a Content Security Policy with `connect-src 'none'`. The browser will refuse to send your data anywhere, even if asked.
- **Daily diary entries** with free-form text plus per-day structured *data points* (mood ranges, booleans, multi-select tags, medication doses, etc.).
- **Configurable data points.** Define what you want to track — the schema is yours.
- **Statistics view** over your data points across week / month / year ranges.
- **Encrypted backup export / import.** Download a self-contained encrypted JSON file protected by a separate backup passphrase.
- **Passphrase strength enforcement** on vault creation (minimum 12 characters, live strength meter).
- **Hard lock.** Locking the vault clears the in-memory key *and* every decrypted entry from JS memory.
- **Static site.** Deploys to GitHub Pages as a single HTML file plus JS/CSS bundles. No server to compromise.

## Security model

| Component | Choice |
|---|---|
| Symmetric cipher | AES-256-GCM (authenticated; any tampering is detected) |
| KDF | PBKDF2-HMAC-SHA256, 310,000 iterations, 16-byte random salt |
| IV | Fresh 12 random bytes per `encrypt()` call |
| Key handling | `CryptoKey` is non-extractable, lives only in the Pinia `auth` store |
| Verification | Encrypted sentinel string; wrong passphrase = GCM auth tag failure |
| Storage | `localStorage`, one encrypted blob per day + one for data point configs |
| Plaintext on disk | Only the PBKDF2 salt (salts are not secret) |
| Network | None. Production CSP enforces no outbound connections |
| Sourcemaps | Disabled in production |

The salt is stored alongside the encrypted vault. If your device is stolen, an attacker has everything they need to attempt an offline brute-force attack against your passphrase — which is why InkVault enforces a minimum passphrase length and shows a strength meter at vault creation. **Your passphrase is the only thing protecting your data. Choose well.**

For the full technical reference see [ARCHITECTURE.md](./ARCHITECTURE.md).

## Threat model

**Defends against:**
- Loss of the device with the vault locked
- Casual access to the browser's `localStorage` (file system snooping, browser sync, casual roommate)
- Network adversaries (there is no network traffic to intercept)
- A compromised hosting CDN partially modifying assets — the CSP forbids exfiltration, though it cannot stop a fully replaced bundle

**Does *not* defend against:**
- A weak passphrase against an attacker with disk access (no KDF saves a short password)
- An attacker who has access to your device *while the vault is unlocked* (decrypted data is in JS memory)
- A malicious browser extension with permissions on the InkVault origin
- A targeted supply-chain attack on a dependency (npm or GitHub Actions)
- Forensic recovery of decrypted data from system swap / RAM dumps

If your threat model includes any of the bottom four, InkVault is not the right tool.

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Vue 3 (Composition API) |
| Language | TypeScript (strict) |
| Build | Vite 6 |
| State | Pinia |
| Router | Vue Router 4 (hash mode, required for GitHub Pages) |
| CSS | Tailwind CSS v4 |
| Crypto | Web Crypto API (no external crypto deps) |
| Unit tests | Vitest + jsdom |
| E2E tests | Playwright (against the built `dist/`) |
| CI/CD | GitHub Actions → GitHub Pages |

## Local development

```bash
npm install
npm run dev           # http://localhost:5173
```

Open the app, set a passphrase, and you have a working vault. The passphrase is *not* recoverable — if you forget it, the encrypted data is unreadable.

### Other commands

```bash
npm run type-check    # vue-tsc --noEmit
npm run test:unit     # Vitest
npm run build         # Type-check + production build → dist/
npm run preview       # Serve dist/ at http://localhost:4173
npm run test:e2e      # Playwright (requires npm run build first)
```

## Deployment

The repo is configured to deploy to GitHub Pages on push to `main`:

1. `Test` and `E2E` jobs run on every push and PR.
2. `Build` runs on `main` only, producing `dist/`.
3. `Deploy` publishes `dist/` to the `gh-pages` branch via `peaceiris/actions-gh-pages`.

If you fork this repo under a different name, update the Vite base path in `vite.config.ts` (`base: '/inkvault/'`) to match your repo name.

## Project layout

```
src/
  utils/
    crypto.ts          # AES-GCM + PBKDF2 primitives
    storage.ts         # encrypted localStorage adapter
    backup.ts          # portable encrypted backup format
    passphrase.ts      # strength scoring + minimum length
  stores/
    auth.ts            # key lifecycle (lock / unlock / reset)
    diary.ts           # diary entries (Map<date, DiaryEntry>)
    datapoints.ts      # data point configurations
  components/
    auth/              # UnlockScreen
    datapoints/        # field dispatch + concrete field types
    layout/            # AppShell, AppNav
    ui/                # Toast
  views/               # Home, Diary, Statistics, DataPoints, Settings
  router/              # hash-mode router with auth guard
```

## Contributing

This is a personal project; PRs aren't expected. If you're forking it to use yourself, the most important files to understand before changing anything are `src/utils/crypto.ts`, `src/utils/storage.ts`, and `src/stores/auth.ts`. The security invariants in [ARCHITECTURE.md](./ARCHITECTURE.md#security-invariants) explain what must not change.

## License

No license is currently declared. Treat the source as all-rights-reserved unless that changes.
