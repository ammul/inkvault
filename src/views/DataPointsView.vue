<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { DataPointConfig } from '@/types'
import { useDataPointsStore } from '@/stores/datapoints'
import { useDiaryStore } from '@/stores/diary'
import DataPointList from '@/components/datapoints/DataPointList.vue'
import DataPointEditor from '@/components/datapoints/DataPointEditor.vue'

const datapoints = useDataPointsStore()
const diary = useDiaryStore()

onMounted(async () => {
  if (!datapoints.loaded) await datapoints.loadConfigs()
  if (!diary.loaded) await diary.loadEntries()
})

const showEditor = ref(false)
const editingConfig = ref<DataPointConfig | undefined>(undefined)
const editingLocked = ref(false)

function hasStoredData(id: string): boolean {
  return [...diary.entries.values()].some((e) => e.dataValues[id] != null)
}

function openNew() {
  editingConfig.value = undefined
  editingLocked.value = false
  showEditor.value = true
}

function openEdit(config: DataPointConfig) {
  editingConfig.value = config
  editingLocked.value = hasStoredData(config.id)
  showEditor.value = true
}

function closeEditor() {
  showEditor.value = false
  editingConfig.value = undefined
  editingLocked.value = false
}

async function handleSave(data: Omit<DataPointConfig, 'id' | 'createdAt'>) {
  if (editingConfig.value) {
    const patch = editingLocked.value
      ? { label: data.label, color: data.color, icon: data.icon }
      : data
    await datapoints.updateConfig(editingConfig.value.id, patch)
  } else {
    await datapoints.addConfig({
      ...data,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    })
  }
  closeEditor()
}

async function handleDelete(id: string) {
  if (!confirm('Delete this data point? This cannot be undone.')) return
  await datapoints.deleteConfig(id)
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-4">
      <h1 class="text-xl font-bold text-gray-800">⚙️ Data Points</h1>
      <button
        v-if="!showEditor"
        @click="openNew"
        class="text-sm bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition"
      >
        + Add
      </button>
    </div>

    <DataPointEditor
      v-if="showEditor"
      :initial="editingConfig"
      :locked="editingLocked"
      @save="handleSave"
      @cancel="closeEditor"
      class="mb-4"
    />

    <DataPointList :configs="datapoints.configs" @edit="openEdit" @delete="handleDelete" />
  </div>
</template>
