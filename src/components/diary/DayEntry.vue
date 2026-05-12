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
  <div class="space-y-5">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <h2 class="text-lg font-semibold text-ink">{{ displayDate }}</h2>
      <button
        @click="router.push('/diary')"
        class="text-sm text-ink-muted hover:text-ink transition-colors px-2 py-1 rounded-input hover:bg-subtle"
      >
        ← Back
      </button>
    </div>

    <!-- Free text -->
    <textarea
      v-model="text"
      placeholder="What happened today?"
      rows="7"
      class="w-full border border-edge rounded-card px-4 py-3 text-sm text-ink bg-raised placeholder:text-ink-faint resize-none focus:outline-none focus:ring-2 focus:ring-accent/25 focus:border-accent transition-colors"
    />

    <!-- Data points -->
    <div v-if="datapoints.configs.length" class="space-y-2">
      <h3 class="text-xs font-medium text-ink-faint uppercase tracking-widest">Data Points</h3>
      <DataPointField
        v-for="config in datapoints.configs"
        :key="config.id"
        :config="config"
        :model-value="dataValues[config.id] ?? null"
        @update:model-value="setDataValue(config.id, $event)"
      />
    </div>

    <!-- Save -->
    <div>
      <button
        @click="save"
        :disabled="saving"
        class="bg-accent text-on-accent px-5 py-2 rounded-input text-sm font-medium hover:bg-accent-dim disabled:opacity-50 transition-colors"
      >
        {{ saving ? 'Saving…' : 'Save entry' }}
      </button>
    </div>
  </div>
</template>
