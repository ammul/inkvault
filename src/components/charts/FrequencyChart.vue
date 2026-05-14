<script setup lang="ts">
import { computed } from 'vue'
import type { FrequencySeries } from '@/utils/chartAdapters'

const props = defineProps<{ series: FrequencySeries }>()

const maxCount = computed(() => Math.max(...props.series.bars.map((b) => b.count), 1))
</script>

<template>
  <div class="space-y-1.5">
    <div v-for="bar in series.bars" :key="bar.label" class="flex items-center gap-2 text-sm">
      <span class="w-28 shrink-0 truncate text-ink-muted text-right text-xs">{{ bar.label }}</span>
      <div class="flex-1 bg-edge rounded-full h-2 overflow-hidden">
        <div
          class="h-2 rounded-full transition-all"
          :style="{
            width: `${(bar.count / maxCount) * 100}%`,
            backgroundColor: series.color,
          }"
        />
      </div>
      <span class="w-6 text-right text-xs text-ink-faint shrink-0">{{ bar.count }}</span>
    </div>
  </div>
</template>
