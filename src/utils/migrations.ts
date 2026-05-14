import { readSchemaVersion, writeSchemaVersion } from './storage'

interface Migration {
  version: number
  run: (key: CryptoKey) => Promise<void>
}

export const CURRENT_SCHEMA_VERSION = 1

const migrations: Migration[] = [
  {
    version: 1,
    // Baseline migration: establishes schema versioning. No data transformation.
    // Old vaults run this once at unlock, write iv:schema=1, and skip it on
    // future unlocks. Future migrations added here will transform data as needed.
    run: async (_key: CryptoKey): Promise<void> => {},
  },
]

export async function runMigrations(key: CryptoKey): Promise<void> {
  const current = readSchemaVersion()
  if (current >= CURRENT_SCHEMA_VERSION) return
  const pending = migrations
    .filter((m) => m.version > current)
    .sort((a, b) => a.version - b.version)
  for (const m of pending) {
    await m.run(key)
    writeSchemaVersion(m.version)
  }
}
