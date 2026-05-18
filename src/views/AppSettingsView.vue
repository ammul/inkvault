<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAppSettingsStore } from '@/stores/appSettings'
import { useDiaryStore } from '@/stores/diary'
import { useTrackersStore } from '@/stores/trackers'
import { seedDemoData, clearData, rerollTheme } from '@/utils/seedData'
import SettingRow from '@/components/ui/SettingRow.vue'
import BinaryToggle from '@/components/ui/BinaryToggle.vue'

const { t } = useI18n()
const appSettings = useAppSettingsStore()
const diary = useDiaryStore()
const trackers = useTrackersStore()

onMounted(async () => {
  if (!appSettings.loaded) await appSettings.load()
  if (!diary.loaded) await diary.loadAllEntries()
  if (!trackers.loaded) await trackers.loadConfigs()
})

watch(() => appSettings.settings.clockDisplay, () => appSettings.save())
watch(() => appSettings.settings.diaryView, () => appSettings.save())
watch(() => appSettings.settings.useEmojis, () => appSettings.save())
watch(() => appSettings.settings.animations, () => { appSettings.apply(); appSettings.save() })
watch(() => appSettings.settings.language, () => { appSettings.apply(); appSettings.save() })

async function setDateFormat(val: 'locale' | 'dmy') {
  appSettings.settings.dateFormat = val
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
        <BinaryToggle
          v-model="appSettings.settings.clockDisplay"
          :options="[{ value: '24h', label: t('appSettings.clockDisplay24h') }, { value: 'ampm', label: t('appSettings.clockDisplayAmpm') }]"
        />
      </SettingRow>

      <SettingRow :title="t('appSettings.diaryView')" :description="t('appSettings.diaryViewDescription')">
        <BinaryToggle
          v-model="appSettings.settings.diaryView"
          :options="[{ value: 'timeline', label: t('appSettings.diaryViewTimeline') }, { value: 'day', label: t('appSettings.diaryViewDay') }]"
        />
      </SettingRow>

      <SettingRow :title="t('appSettings.animations')" :description="t('appSettings.animationsDescription')">
        <BinaryToggle
          v-model="appSettings.settings.animations"
          :options="[{ value: true, label: t('appSettings.on') }, { value: false, label: t('appSettings.off') }]"
        />
      </SettingRow>

      <SettingRow :title="t('appSettings.useEmojis')" :description="t('appSettings.useEmojisDescription')">
        <BinaryToggle
          v-model="appSettings.settings.useEmojis"
          :options="[{ value: true, label: t('appSettings.on') }, { value: false, label: t('appSettings.off') }]"
        />
      </SettingRow>

      <SettingRow :title="t('appSettings.dateFormat')" :description="t('appSettings.dateFormatDescription')">
        <BinaryToggle
          :model-value="appSettings.settings.dateFormat"
          @update:model-value="setDateFormat"
          :options="[{ value: 'locale', label: t('appSettings.dateFormatLocale') }, { value: 'dmy', label: t('appSettings.dateFormatDmy') }]"
        />
      </SettingRow>

      <SettingRow :title="t('appSettings.language')" :description="t('appSettings.languageDescription')">
        <select
          v-model="appSettings.settings.language"
          class="text-sm px-3 py-1.5 rounded-input bg-subtle text-ink border border-edge focus:outline-none focus:ring-2 focus:ring-accent/25 cursor-pointer font-medium"
        >
          <option value="auto">{{ t('appSettings.languageAuto') }}</option>
          <option value="en">{{ t('appSettings.languageEn') }}</option>
          <option value="de">{{ t('appSettings.languageDe') }}</option>
        </select>
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
