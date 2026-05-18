<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import type { TimeRange } from '@/types'
import { useDiaryStore } from '@/stores/diary'
import { useTrackersStore } from '@/stores/trackers'
import StatsPanel from '@/components/stats/StatsPanel.vue'
import TrackerFilterPanel from '@/components/stats/TrackerFilterPanel.vue'

const { t } = useI18n()
const diary = useDiaryStore()
const trackers = useTrackersStore()

onMounted(async () => {
  if (!diary.loaded) await diary.loadAllEntries()
  if (!trackers.loaded) await trackers.loadConfigs()
})

const rangeLabel = ref<'week' | 'month' | 'year' | 'all'>('month')

const timeRange = computed((): TimeRange => {
  const today = new Date()
  const end = today.toISOString().slice(0, 10)
  let start: string

  if (rangeLabel.value === 'week') {
    const d = new Date(today)
    d.setDate(d.getDate() - 7)
    start = d.toISOString().slice(0, 10)
  } else if (rangeLabel.value === 'month') {
    const d = new Date(today)
    d.setMonth(d.getMonth() - 1)
    start = d.toISOString().slice(0, 10)
  } else if (rangeLabel.value === 'year') {
    const d = new Date(today)
    d.setFullYear(d.getFullYear() - 1)
    start = d.toISOString().slice(0, 10)
  } else {
    start = '0000-01-01'
  }

  return { start, end, label: rangeLabel.value }
})

const showFilters = ref(false)
const filterPanel = ref<InstanceType<typeof TrackerFilterPanel> | null>(null)

const hasActiveFilter = computed(() => filterPanel.value?.hasActiveFilter ?? false)
const visibleConfigs = computed(() => {
  if (!hasActiveFilter.value) return trackers.configs
  return trackers.configs.filter(c => filterPanel.value?.isFilterActive(c.id))
})
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-3">
      <div class="flex items-center gap-2">
        <h1 class="text-xl font-semibold text-ink">{{ t('statistics.title') }}</h1>
        <span
          v-if="hasActiveFilter && !showFilters"
          class="text-xs px-1.5 py-0.5 rounded bg-accent/15 text-accent font-medium"
        >
          {{ t('statistics.filter.activeHint') }}
        </span>
      </div>
      <div class="flex items-center gap-2">
        <select
          v-model="rangeLabel"
          :aria-label="t('statistics.range.label')"
          class="border border-edge rounded-input px-3 py-2 text-sm text-ink bg-raised focus:outline-none focus:ring-2 focus:ring-accent/25 focus:border-accent transition-colors"
        >
          <option value="week">{{ t('statistics.range.week') }}</option>
          <option value="month">{{ t('statistics.range.month') }}</option>
          <option value="year">{{ t('statistics.range.year') }}</option>
          <option value="all">{{ t('statistics.range.all') }}</option>
        </select>
        <button
          @click="showFilters = !showFilters"
          class="relative border border-edge rounded-input px-3 py-2 text-sm text-ink bg-raised hover:bg-surface focus:outline-none focus:ring-2 focus:ring-accent/25 focus:border-accent transition-colors flex items-center gap-1.5"
          :class="showFilters ? 'border-accent text-accent' : ''"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L13 10.414V17a1 1 0 01-.553.894l-4 2A1 1 0 017 19v-8.586L3.293 6.707A1 1 0 013 6V3z" clip-rule="evenodd" />
          </svg>
          {{ t('statistics.filter.label') }}
          <span v-if="hasActiveFilter" class="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-accent" />
        </button>
      </div>
    </div>

    <TrackerFilterPanel v-if="showFilters" ref="filterPanel" />

    <div v-if="trackers.configs.length" class="space-y-4">
      <StatsPanel
        v-for="config in visibleConfigs"
        :key="config.id"
        :config="config"
        :time-range="timeRange"
        :filter="filterPanel?.configFilters[config.id] ?? null"
      />
    </div>
    <p v-else class="text-center text-ink-faint text-sm py-16">
      {{ t('statistics.noTrackersPrefix') }}
      <router-link to="/data" class="text-accent hover:text-accent-dim transition-colors">{{
        t('statistics.noTrackersLink')
      }}</router-link>.
    </p>
  </div>
</template>
