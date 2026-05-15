<script setup lang="ts">
import { computed } from 'vue'
import type { TrackerConfig, TrackerValue } from '@/types'
import { toChartResult } from '@/utils/chartAdapters'
import LineChart from './LineChart.vue'
import FrequencyChart from './FrequencyChart.vue'

const props = defineProps<{
  config: TrackerConfig
  values: { date: string; value: TrackerValue }[]
}>()

const result = computed(() => toChartResult(props.config, props.values))
</script>

<template>
  <div>
    <LineChart v-if="result?.kind === 'line'" :series="result.series" />
    <FrequencyChart v-else-if="result?.kind === 'frequency'" :series="result.series" />
    <p v-else class="text-sm text-ink-faint text-center py-6">No chart available for this data type.</p>
  </div>
</template>
