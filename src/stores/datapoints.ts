import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { DataPointConfig } from '@/types'
import { useAuthStore } from './auth'
import { KEYS, writeEncrypted, readEncrypted } from '@/utils/storage'

export const useDataPointsStore = defineStore('datapoints', () => {
  const configs = ref<DataPointConfig[]>([])
  const loaded = ref(false)

  function getKey(): CryptoKey {
    const auth = useAuthStore()
    if (!auth.key) throw new Error('Vault is locked')
    return auth.key
  }

  async function loadConfigs(): Promise<void> {
    const key = getKey()
    const data = await readEncrypted<DataPointConfig[]>(key, KEYS.DATAPOINTS)
    configs.value = data ?? []
    loaded.value = true
  }

  async function saveConfigs(): Promise<void> {
    const key = getKey()
    await writeEncrypted(key, KEYS.DATAPOINTS, configs.value)
  }

  async function addConfig(config: DataPointConfig): Promise<void> {
    configs.value.push(config)
    await saveConfigs()
  }

  async function updateConfig(id: string, patch: Partial<DataPointConfig>): Promise<void> {
    const idx = configs.value.findIndex((c) => c.id === id)
    if (idx === -1) return
    configs.value[idx] = { ...configs.value[idx], ...patch }
    await saveConfigs()
  }

  async function deleteConfig(id: string): Promise<void> {
    configs.value = configs.value.filter((c) => c.id !== id)
    await saveConfigs()
  }

  async function replaceConfigs(newConfigs: DataPointConfig[]): Promise<void> {
    configs.value = newConfigs
    await saveConfigs()
  }

  function reset(): void {
    configs.value = []
    loaded.value = false
  }

  return { configs, loaded, loadConfigs, addConfig, updateConfig, deleteConfig, replaceConfigs, reset }
})
