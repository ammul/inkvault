<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { TrackerConfig, RangeConfig, StringConfig, MultiStringConfig, BooleanConfig, MedicationConfig } from '@/types'

const { t } = useI18n()

const props = defineProps<{ config: TrackerConfig }>()

const rangeConfig = computed(() => props.config.config as RangeConfig)
const stringConfig = computed(() => props.config.config as StringConfig)
const multiConfig = computed(() => props.config.config as MultiStringConfig)
const boolConfig = computed(() => props.config.config as BooleanConfig)
const medConfig = computed(() => props.config.config as MedicationConfig)

const visibleOptions = computed(() => multiConfig.value.options.slice(0, 4))
const extraOptions = computed(() => Math.max(0, multiConfig.value.options.length - 4))

const visiblePresets = computed(() => (medConfig.value.dosagePresets ?? []).slice(0, 3))
const extraPresets = computed(() => Math.max(0, (medConfig.value.dosagePresets ?? []).length - 3))

const SAMPLE_FILL = 70
</script>

<template>
  <!-- range -->
  <div v-if="config.type === 'range'" class="flex items-center gap-2.5">
    <span class="text-[11px] text-ink-faint">{{ rangeConfig.min }}</span>
    <div class="relative flex-1 h-1 bg-edge rounded-full">
      <div
        class="absolute inset-y-0 left-0 rounded-full"
        :style="{ width: SAMPLE_FILL + '%', background: config.color }"
      ></div>
      <div
        class="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full"
        :style="{ left: SAMPLE_FILL + '%', background: config.color, boxShadow: `0 0 0 2px var(--color-surface), 0 0 0 3px ${config.color}` }"
      ></div>
    </div>
    <span class="text-[11px] text-ink-faint">{{ rangeConfig.max }}</span>
  </div>

  <!-- string -->
  <p v-else-if="config.type === 'string'" class="text-xs text-ink-faint italic truncate">
    {{ stringConfig.placeholder || t('trackers.preview.stringFallback') }}
  </p>

  <!-- multi-string -->
  <div v-else-if="config.type === 'multi-string'" class="flex flex-wrap gap-1">
    <span
      v-for="(opt, i) in visibleOptions"
      :key="opt"
      class="text-[11px] px-2 py-0.5 rounded-full border"
      :class="i === 0
        ? 'bg-accent-tint border-accent/30 text-accent-dim font-medium'
        : 'border-edge bg-surface text-ink-muted'"
    >{{ opt }}</span>
    <span v-if="extraOptions > 0" class="text-[11px] text-ink-faint self-center">+{{ extraOptions }}</span>
  </div>

  <!-- boolean -->
  <div v-else-if="config.type === 'boolean'" class="flex gap-1">
    <div
      class="flex-1 text-center text-[11.5px] py-1 rounded-md border font-medium"
      :style="{
        background: `color-mix(in oklab, ${config.color}, white 90%)`,
        color: `color-mix(in oklab, ${config.color}, black 30%)`,
        borderColor: `color-mix(in oklab, ${config.color}, white 70%)`
      }"
    >{{ boolConfig.trueLabel }}</div>
    <div class="flex-1 text-center text-[11.5px] py-1 rounded-md border border-edge text-ink-muted">
      {{ boolConfig.falseLabel }}
    </div>
  </div>

  <!-- medication -->
  <div v-else-if="config.type === 'medication'" class="flex items-center gap-2 flex-wrap">
    <span
      v-for="preset in visiblePresets"
      :key="preset"
      class="text-[11.5px] px-2 py-0.5 rounded-md border border-edge bg-surface text-ink-muted tabular-nums"
    >{{ preset }}</span>
    <span v-if="extraPresets > 0" class="text-[11px] text-ink-faint">+{{ extraPresets }}</span>
  </div>
</template>
