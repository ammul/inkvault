<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { TimeRange } from '@/types'
import { useDiaryStore } from '@/stores/diary'
import { useDataPointsStore } from '@/stores/datapoints'
import StatsPanel from '@/components/stats/StatsPanel.vue'

const diary = useDiaryStore()
const datapoints = useDataPointsStore()

onMounted(async () => {
  if (!diary.loaded) await diary.loadEntries()
  if (!datapoints.loaded) await datapoints.loadConfigs()
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

const trackableConfigs = computed(() => datapoints.configs)
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-xl font-semibold text-ink">Statistics</h1>
      <select
        v-model="rangeLabel"
        class="border border-edge rounded-input px-3 py-2 text-sm text-ink bg-raised focus:outline-none focus:ring-2 focus:ring-accent/25 focus:border-accent transition-colors"
      >
        <option value="week">Last 7 days</option>
        <option value="month">Last 30 days</option>
        <option value="year">Last year</option>
        <option value="all">All time</option>
      </select>
    </div>

    <div v-if="trackableConfigs.length" class="space-y-4">
      <StatsPanel
        v-for="config in trackableConfigs"
        :key="config.id"
        :config="config"
        :time-range="timeRange"
      />
    </div>
    <p v-else class="text-center text-ink-faint text-sm py-16">
      No data points yet. Add some in
      <router-link to="/data" class="text-accent hover:text-accent-dim transition-colors">Data Points</router-link>.
    </p>
  </div>
</template>
