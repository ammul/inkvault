import { createBackup, restoreBackup } from '@/utils/backup'
import type { DataPointConfig, DiaryEntry, ThemeSettings } from '@/types'

const PASSPHRASE = 'backup-test-passphrase-long-enough'

function makeConfig(): DataPointConfig {
  return {
    id: crypto.randomUUID(),
    label: 'Mood',
    color: '#6366f1',
    icon: '😊',
    type: 'range',
    config: { min: 0, max: 10, step: 1 },
    createdAt: new Date().toISOString(),
  }
}

function makeEntry(date: string, text = 'Entry text'): DiaryEntry {
  return { date, text, entries: [], dataValues: {}, updatedAt: new Date().toISOString() }
}

describe('backup utils', () => {
  test('createBackup + restoreBackup round-trips datapoints and entries', async () => {
    const configs = [makeConfig()]
    const entries = [makeEntry('2024-06-01'), makeEntry('2024-06-02')]
    const backup = await createBackup(PASSPHRASE, configs, entries)
    const result = await restoreBackup(backup, PASSPHRASE)
    expect(result.datapoints).toHaveLength(1)
    expect(result.datapoints[0].id).toBe(configs[0].id)
    expect(result.entries).toHaveLength(2)
    expect(result.entries.map((e) => e.date).sort()).toEqual(['2024-06-01', '2024-06-02'])
  })

  test('restoreBackup includes theme when provided', async () => {
    const theme: ThemeSettings = {
      colorTheme: 'teal',
      font: 'serif',
      mood: 'dark',
      fontSize: 'lg',
      lineSpacing: 'relaxed',
      contentWidth: 'wide',
    }
    const backup = await createBackup(PASSPHRASE, [], [], theme)
    const result = await restoreBackup(backup, PASSPHRASE)
    expect(result.theme).toEqual(theme)
  })

  test('restoreBackup returns theme: null when backup has no theme field', async () => {
    const backup = await createBackup(PASSPHRASE, [], [])
    const result = await restoreBackup(backup, PASSPHRASE)
    expect(result.theme).toBeNull()
  })

  test('restoreBackup throws on wrong passphrase', async () => {
    const backup = await createBackup(PASSPHRASE, [], [])
    await expect(restoreBackup(backup, 'wrong-passphrase-here')).rejects.toThrow(
      'Wrong backup passphrase',
    )
  })

  test('restoreBackup throws on version mismatch', async () => {
    const backup = await createBackup(PASSPHRASE, [], [])
    const tampered = { ...backup, version: 99 as 1 }
    await expect(restoreBackup(tampered, PASSPHRASE)).rejects.toThrow('Unsupported backup version')
  })

  test('backup file does not contain plaintext data', async () => {
    const config = makeConfig()
    config.label = 'SuperSecretLabel'
    const entry = makeEntry('2024-06-01', 'SuperSecretDiaryText')
    const backup = await createBackup(PASSPHRASE, [config], [entry])
    const serialized = JSON.stringify(backup)
    expect(serialized).not.toContain('SuperSecretLabel')
    expect(serialized).not.toContain('SuperSecretDiaryText')
  })

  test('each createBackup generates a unique salt', async () => {
    const b1 = await createBackup(PASSPHRASE, [], [])
    const b2 = await createBackup(PASSPHRASE, [], [])
    expect(b1.salt).not.toBe(b2.salt)
  })

  test('restoreBackup rejects tampered verify blob', async () => {
    const backup = await createBackup(PASSPHRASE, [], [])
    const chars = backup.verify.split('')
    const mid = Math.floor(chars.length / 2)
    chars[mid] = chars[mid] === 'A' ? 'B' : 'A'
    const tampered = { ...backup, verify: chars.join('') }
    await expect(restoreBackup(tampered, PASSPHRASE)).rejects.toThrow('Wrong backup passphrase')
  })
})
