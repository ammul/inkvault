<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAppSettingsStore } from '@/stores/appSettings'
import { useDiaryStore } from '@/stores/diary'
import { useTrackersStore } from '@/stores/trackers'
import { seedDemoData, clearData, rerollTheme } from '@/utils/seedData'
import SettingRow from '@/components/ui/SettingRow.vue'

const { t } = useI18n()
const appSettings = useAppSettingsStore()
const diary = useDiaryStore()
const trackers = useTrackersStore()

onMounted(async () => {
  if (!appSettings.loaded) await appSettings.load()
  if (!diary.loaded) await diary.loadAllEntries()
  if (!trackers.loaded) await trackers.loadConfigs()
})

async function setClockDisplay(val: '24h' | 'ampm') {
  appSettings.settings.clockDisplay = val
  await appSettings.save()
}

async function setDiaryView(val: 'timeline' | 'day') {
  appSettings.settings.diaryView = val
  await appSettings.save()
}

async function setAnimations(val: boolean) {
  appSettings.settings.animations = val
  appSettings.apply()
  await appSettings.save()
}

async function setUseEmojis(val: boolean) {
  appSettings.settings.useEmojis = val
  await appSettings.save()
}

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
    <h1 class="text-xl font-semibold text-ink">{{ t('appSettings.title') }}</h1>

    <section class="space-y-3">
      <h2 class="text-xs font-semibold text-ink-muted uppercase tracking-wider">
        {{ t('appSettings.preferences') }}
      </h2>

      <SettingRow :title="t('appSettings.clockDisplay')" :description="t('appSettings.clockDisplayDescription')">
        <button
          @click="setClockDisplay('24h')"
          :class="appSettings.settings.clockDisplay === '24h'
            ? 'bg-accent text-on-accent'
            : 'bg-subtle text-ink-muted hover:bg-edge'"
          class="text-sm px-3 py-1.5 rounded-input transition-colors font-medium"
        >{{ t('appSettings.clockDisplay24h') }}</button>
        <button
          @click="setClockDisplay('ampm')"
          :class="appSettings.settings.clockDisplay === 'ampm'
            ? 'bg-accent text-on-accent'
            : 'bg-subtle text-ink-muted hover:bg-edge'"
          class="text-sm px-3 py-1.5 rounded-input transition-colors font-medium"
        >{{ t('appSettings.clockDisplayAmpm') }}</button>
      </SettingRow>

      <SettingRow :title="t('appSettings.diaryView')" :description="t('appSettings.diaryViewDescription')">
        <button
          @click="setDiaryView('timeline')"
          :class="appSettings.settings.diaryView === 'timeline'
            ? 'bg-accent text-on-accent'
            : 'bg-subtle text-ink-muted hover:bg-edge'"
          class="text-sm px-3 py-1.5 rounded-input transition-colors font-medium"
        >{{ t('appSettings.diaryViewTimeline') }}</button>
        <button
          @click="setDiaryView('day')"
          :class="appSettings.settings.diaryView === 'day'
            ? 'bg-accent text-on-accent'
            : 'bg-subtle text-ink-muted hover:bg-edge'"
          class="text-sm px-3 py-1.5 rounded-input transition-colors font-medium"
        >{{ t('appSettings.diaryViewDay') }}</button>
      </SettingRow>

      <SettingRow :title="t('appSettings.animations')" :description="t('appSettings.animationsDescription')">
        <button
          @click="setAnimations(true)"
          :class="appSettings.settings.animations
            ? 'bg-accent text-on-accent'
            : 'bg-subtle text-ink-muted hover:bg-edge'"
          class="text-sm px-3 py-1.5 rounded-input transition-colors font-medium"
        >{{ t('appSettings.on') }}</button>
        <button
          @click="setAnimations(false)"
          :class="!appSettings.settings.animations
            ? 'bg-accent text-on-accent'
            : 'bg-subtle text-ink-muted hover:bg-edge'"
          class="text-sm px-3 py-1.5 rounded-input transition-colors font-medium"
        >{{ t('appSettings.off') }}</button>
      </SettingRow>

      <SettingRow :title="t('appSettings.useEmojis')" :description="t('appSettings.useEmojisDescription')">
        <button
          @click="setUseEmojis(true)"
          :class="appSettings.settings.useEmojis
            ? 'bg-accent text-on-accent'
            : 'bg-subtle text-ink-muted hover:bg-edge'"
          class="text-sm px-3 py-1.5 rounded-input transition-colors font-medium"
        >{{ t('appSettings.on') }}</button>
        <button
          @click="setUseEmojis(false)"
          :class="!appSettings.settings.useEmojis
            ? 'bg-accent text-on-accent'
            : 'bg-subtle text-ink-muted hover:bg-edge'"
          class="text-sm px-3 py-1.5 rounded-input transition-colors font-medium"
        >{{ t('appSettings.off') }}</button>
      </SettingRow>
    </section>

    <section class="space-y-3">
      <h2 class="text-xs font-semibold text-ink-muted uppercase tracking-wider">
        {{ t('sampleData.title') }}
      </h2>

      <div class="bg-raised border border-edge rounded-card shadow-card p-4 space-y-4">
        <p class="text-sm text-ink-muted">{{ t('sampleData.description') }}</p>

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
      </div>
    </section>
  </div>
</template>
