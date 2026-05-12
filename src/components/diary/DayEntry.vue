<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { DiaryEntry, DataPointValue } from '@/types'
import { useDiaryStore } from '@/stores/diary'
import { useDataPointsStore } from '@/stores/datapoints'
import { useToastStore } from '@/stores/toast'
import DataPointField from '@/components/datapoints/DataPointField.vue'

const route = useRoute()
const router = useRouter()
const diary = useDiaryStore()
const datapoints = useDataPointsStore()
const toast = useToastStore()

const date = computed(() => route.params.date as string)
const text = ref('')
const dataValues = ref<Record<string, DataPointValue>>({})
const saving = ref(false)

function load() {
  const entry = diary.getEntry(date.value)
  text.value = entry?.text ?? ''
  dataValues.value = entry ? { ...entry.dataValues } : {}
  if (entry) toast.show('Entry loaded')
}

onMounted(load)
watch(date, load)

async function save() {
  saving.value = true
  const entry: DiaryEntry = {
    date: date.value,
    text: text.value,
    dataValues: dataValues.value,
    updatedAt: new Date().toISOString(),
  }
  await diary.saveEntry(entry)
  saving.value = false
  toast.show('Entry saved')
}

function setDataValue(id: string, value: DataPointValue) {
  dataValues.value = { ...dataValues.value, [id]: value }
}

const displayDate = computed(() => {
  if (!date.value) return ''
  const [y, m, d] = date.value.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
})
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h2 class="text-lg font-semibold text-gray-800">{{ displayDate }}</h2>
      <button @click="router.push('/diary')" class="text-sm text-gray-400 hover:text-gray-600">
        ← Back
      </button>
    </div>

    <textarea
      v-model="text"
      placeholder="What happened today?"
      rows="6"
      class="w-full border border-gray-200 rounded-lg p-3 text-gray-700 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
    />

    <div v-if="datapoints.configs.length" class="space-y-3">
      <h3 class="text-sm font-medium text-gray-400 uppercase tracking-wide">Data Points</h3>
      <DataPointField
        v-for="config in datapoints.configs"
        :key="config.id"
        :config="config"
        :model-value="dataValues[config.id] ?? null"
        @update:model-value="setDataValue(config.id, $event)"
      />
    </div>

    <div class="flex items-center gap-3">
      <button
        @click="save"
        :disabled="saving"
        class="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition text-sm font-medium"
      >
        {{ saving ? 'Saving…' : 'Save' }}
      </button>
    </div>
  </div>
</template>
