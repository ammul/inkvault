<script setup lang="ts">
import { onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import type { DataPointConfig } from '@/types'
import { useDataPointsStore } from '@/stores/datapoints'
import { useDiaryStore } from '@/stores/diary'
import DataPointList from '@/components/datapoints/DataPointList.vue'

const { t } = useI18n()
const datapoints = useDataPointsStore()
const diary = useDiaryStore()

onMounted(async () => {
  if (!datapoints.loaded) await datapoints.loadConfigs()
  if (!diary.loaded) await diary.loadAllEntries()
})

function storedData(id: string): number {
  return [...diary.entries.values()].filter(e => e.dataValues[id] != null).length
}

async function handleSave(
  data: Omit<DataPointConfig, 'id' | 'createdAt'>,
  existingId: string | null,
  locked: boolean,
) {
  if (existingId) {
    const patch = locked ? { label: data.label, color: data.color, icon: data.icon } : data
    await datapoints.updateConfig(existingId, patch)
  } else {
    await datapoints.addConfig({
      ...data,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    })
  }
}

async function handleDelete(id: string) {
  if (!confirm(t('dataPoints.deleteConfirm'))) return
  await datapoints.deleteConfig(id)
}
</script>

<template>
  <DataPointList
    :configs="datapoints.configs"
    :stored-data="storedData"
    @save="handleSave"
    @delete="handleDelete"
  />
</template>
