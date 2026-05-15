import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '@/stores/auth'
import { useTrackersStore } from '@/stores/trackers'
import type { TrackerConfig } from '@/types'

beforeEach(async () => {
  setActivePinia(createPinia())
  localStorage.clear()
  await useAuthStore().initializeVault('dp-test')
})

function makeConfig(label = 'Mood'): TrackerConfig {
  return {
    id: crypto.randomUUID(),
    label,
    color: '#6366f1',
    icon: '😊',
    type: 'range',
    config: { min: 0, max: 10, step: 1 },
    createdAt: new Date().toISOString(),
  }
}

describe('trackers store', () => {
  test('addConfig and loadConfigs round-trip a config', async () => {
    const trackers = useTrackersStore()
    const config = makeConfig()
    await trackers.addConfig(config)
    trackers.reset()
    await trackers.loadConfigs()
    expect(trackers.configs).toHaveLength(1)
    expect(trackers.configs[0].id).toBe(config.id)
    expect(trackers.configs[0].label).toBe('Mood')
  })

  test('configs are stored encrypted (not plaintext)', async () => {
    const trackers = useTrackersStore()
    await trackers.addConfig(makeConfig('SecretMood'))
    const raw = localStorage.getItem('iv:datapoints')
    expect(raw).not.toContain('SecretMood')
    expect(raw).not.toBeNull()
  })

  test('updateConfig changes a specific field', async () => {
    const trackers = useTrackersStore()
    const config = makeConfig()
    await trackers.addConfig(config)
    await trackers.updateConfig(config.id, { label: 'Energy' })
    expect(trackers.configs[0].label).toBe('Energy')
  })

  test('deleteConfig removes the config', async () => {
    const trackers = useTrackersStore()
    const config = makeConfig()
    await trackers.addConfig(config)
    await trackers.deleteConfig(config.id)
    expect(trackers.configs).toHaveLength(0)
  })

  test('loadConfigs returns empty array when no configs saved', async () => {
    const trackers = useTrackersStore()
    await trackers.loadConfigs()
    expect(trackers.configs).toEqual([])
    expect(trackers.loaded).toBe(true)
  })

  test('multiple configs persist independently', async () => {
    const trackers = useTrackersStore()
    await trackers.addConfig(makeConfig('Mood'))
    await trackers.addConfig(makeConfig('Energy'))
    await trackers.addConfig(makeConfig('Sleep'))
    trackers.reset()
    await trackers.loadConfigs()
    expect(trackers.configs).toHaveLength(3)
  })
})
