<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useDiaryStore } from '@/stores/diary'
import { useTrackersStore } from '@/stores/trackers'
import { seedDemoData, clearData, rerollTheme } from '@/utils/seedData'

const { t } = useI18n()
const diary = useDiaryStore()
const trackers = useTrackersStore()

onMounted(async () => {
  if (!diary.loaded) await diary.loadAllEntries()
  if (!trackers.loaded) await trackers.loadConfigs()
})

const hasData = computed(() => diary.entries.size > 0 || trackers.configs.length > 0)
const storesReady = computed(() => diary.loaded && trackers.loaded)

const seedLoading = ref(false)
const seedDone = ref(false)
const seedDisabled = computed(() => !storesReady.value || hasData.value || seedLoading.value || clearLoading.value)

const clearLoading = ref(false)
const clearDone = ref(false)
const clearDisabled = computed(() => !storesReady.value || !hasData.value || clearLoading.value || seedLoading.value)

const rerollLoading = ref(false)
const rerollDisabled = computed(() => !hasData.value || rerollLoading.value || seedLoading.value || clearLoading.value)

async function handleSeed() {
  seedLoading.value = true
  seedDone.value = false
  clearDone.value = false
  try {
    await seedDemoData()
    seedDone.value = true
  } finally {
    seedLoading.value = false
  }
}

async function handleReroll() {
  rerollLoading.value = true
  try {
    await rerollTheme()
  } finally {
    rerollLoading.value = false
  }
}

async function handleClear() {
  clearLoading.value = true
  clearDone.value = false
  seedDone.value = false
  try {
    await clearData()
    await diary.loadAllEntries()
    clearDone.value = true
  } finally {
    clearLoading.value = false
  }
}
</script>

<template>
  <div class="max-w-lg mx-auto space-y-6 pb-12">
    <h1 class="text-xl font-semibold text-ink">{{ t('data.title') }}</h1>

    <section class="bg-raised border border-edge rounded-card shadow-card p-6 space-y-4">
      <div>
        <h2 class="font-semibold text-ink">{{ t('sampleData.title') }}</h2>
        <p class="text-sm text-ink-muted mt-1">{{ t('sampleData.description') }}</p>
      </div>

      <p v-if="hasData && !clearDone" class="text-sm text-ink-muted">{{ t('sampleData.hasDataHint') }}</p>
      <p v-if="!hasData && !seedDone" class="text-sm text-ink-muted">{{ t('sampleData.noDataHint') }}</p>
      <p v-if="seedDone" class="text-sm text-ok">{{ t('sampleData.done') }}</p>
      <p v-if="clearDone" class="text-sm text-ok">{{ t('sampleData.resetDone') }}</p>

      <div class="flex gap-2">
        <button
          @click="handleSeed"
          :disabled="seedDisabled"
          class="flex-1 border border-edge text-ink rounded-input px-4 py-2.5 text-sm font-medium hover:bg-subtle disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {{ seedLoading ? t('sampleData.loading') : t('sampleData.button') }}
        </button>
        <button
          @click="handleClear"
          :disabled="clearDisabled"
          class="flex-1 border border-danger/50 text-danger rounded-input px-4 py-2.5 text-sm font-medium hover:bg-danger-tint disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {{ clearLoading ? t('sampleData.clearing') : t('sampleData.resetButton') }}
        </button>
      </div>
      <button
        @click="handleReroll"
        :disabled="rerollDisabled"
        class="w-full border border-edge text-ink rounded-input px-4 py-2.5 text-sm font-medium hover:bg-subtle disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {{ rerollLoading ? t('sampleData.loading') : t('sampleData.rerollButton') }}
      </button>
    </section>
  </div>
</template>
