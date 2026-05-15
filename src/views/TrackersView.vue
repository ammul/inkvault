<script setup lang="ts">
import { onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import type { TrackerConfig } from '@/types'
import { useTrackersStore } from '@/stores/trackers'
import { useDiaryStore } from '@/stores/diary'
import TrackerList from '@/components/trackers/TrackerList.vue'

const { t } = useI18n()
const trackers = useTrackersStore()
const diary = useDiaryStore()

onMounted(async () => {
  if (!trackers.loaded) await trackers.loadConfigs()
  if (!diary.loaded) await diary.loadAllEntries()
})

function storedData(id: string): number {
  return [...diary.entries.values()].filter(e => e.dataValues[id] != null).length
}

async function handleSave(
  data: Omit<TrackerConfig, 'id' | 'createdAt'>,
  existingId: string | null,
  locked: boolean,
) {
  if (existingId) {
    const patch = locked ? { label: data.label, color: data.color, icon: data.icon } : data
    await trackers.updateConfig(existingId, patch)
  } else {
    await trackers.addConfig({
      ...data,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    })
  }
}

async function handleDelete(id: string) {
  if (!confirm(t('trackers.deleteConfirm'))) return
  await trackers.deleteConfig(id)
}
</script>

<template>
  <TrackerList
    :configs="trackers.configs"
    :stored-data="storedData"
    @save="handleSave"
    @delete="handleDelete"
  />
</template>
