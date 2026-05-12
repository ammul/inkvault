import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '@/stores/auth'
import { useDataPointsStore } from '@/stores/datapoints'
import type { DataPointConfig } from '@/types'

beforeEach(async () => {
  setActivePinia(createPinia())
  localStorage.clear()
  await useAuthStore().initializeVault('dp-test')
})

function makeConfig(label = 'Mood'): DataPointConfig {
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

describe('datapoints store', () => {
  test('addConfig and loadConfigs round-trip a config', async () => {
    const dp = useDataPointsStore()
    const config = makeConfig()
    await dp.addConfig(config)
    dp.reset()
    await dp.loadConfigs()
    expect(dp.configs).toHaveLength(1)
    expect(dp.configs[0].id).toBe(config.id)
    expect(dp.configs[0].label).toBe('Mood')
  })

  test('configs are stored encrypted (not plaintext)', async () => {
    const dp = useDataPointsStore()
    await dp.addConfig(makeConfig('SecretMood'))
    const raw = localStorage.getItem('iv:datapoints')
    expect(raw).not.toContain('SecretMood')
    expect(raw).not.toBeNull()
  })

  test('updateConfig changes a specific field', async () => {
    const dp = useDataPointsStore()
    const config = makeConfig()
    await dp.addConfig(config)
    await dp.updateConfig(config.id, { label: 'Energy' })
    expect(dp.configs[0].label).toBe('Energy')
  })

  test('deleteConfig removes the config', async () => {
    const dp = useDataPointsStore()
    const config = makeConfig()
    await dp.addConfig(config)
    await dp.deleteConfig(config.id)
    expect(dp.configs).toHaveLength(0)
  })

  test('loadConfigs returns empty array when no configs saved', async () => {
    const dp = useDataPointsStore()
    await dp.loadConfigs()
    expect(dp.configs).toEqual([])
    expect(dp.loaded).toBe(true)
  })

  test('multiple configs persist independently', async () => {
    const dp = useDataPointsStore()
    await dp.addConfig(makeConfig('Mood'))
    await dp.addConfig(makeConfig('Energy'))
    await dp.addConfig(makeConfig('Sleep'))
    dp.reset()
    await dp.loadConfigs()
    expect(dp.configs).toHaveLength(3)
  })
})
