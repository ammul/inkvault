<script setup lang="ts">
import type { TrackerConfig, TrackerValue, RangeConfig, BooleanConfig, MedicationValue } from '@/types'

const props = defineProps<{
  config: TrackerConfig | undefined
  value: TrackerValue
  useEmojis: boolean
}>()
</script>

<template>
  <template v-if="!config" />

  <!-- range: score tile -->
  <template v-else-if="config.type === 'range'">
    <span
      class="inline-flex items-baseline gap-2.5 rounded-[10px] px-3.5 py-2"
      :style="{ background: `color-mix(in oklab, ${config.color}, white 92%)` }"
    >
      <span
        class="text-[22px] font-semibold leading-none tracking-[-0.02em] tabular-nums"
        :style="{ color: config.color }"
      >{{ value }}</span>
      <span
        class="text-[11.5px]"
        :style="{ color: `color-mix(in oklab, ${config.color}, black 30%)` }"
      >
        / {{ (config.config as RangeConfig).max }}
        <span
          v-if="(config.config as RangeConfig).min !== 0"
          class="text-[10.5px] opacity-80"
        >({{ (config.config as RangeConfig).min }}–{{ (config.config as RangeConfig).max }})</span>
      </span>
    </span>
  </template>

  <!-- boolean: filled or hollow pill -->
  <template v-else-if="config.type === 'boolean' && value !== null">
    <span
      class="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-semibold border"
      :style="value === true ? {
        background: `color-mix(in oklab, ${config.color}, white 90%)`,
        color: `color-mix(in oklab, ${config.color}, black 35%)`,
        borderColor: `color-mix(in oklab, ${config.color}, white 70%)`
      } : {
        background: 'var(--color-subtle)',
        color: 'var(--color-ink-muted)',
        borderColor: 'var(--color-edge)'
      }"
    >
      <span
        class="inline-flex items-center justify-center w-[14px] h-[14px] rounded-full text-[9px] font-bold text-white"
        :style="value === true ? { background: config.color } : { background: 'var(--color-edge-strong)' }"
      >✓</span>
      {{ value === true
        ? (config.config as BooleanConfig).trueLabel
        : (config.config as BooleanConfig).falseLabel }}
    </span>
  </template>

  <!-- multi-string: chip cluster -->
  <template v-else-if="config.type === 'multi-string' && Array.isArray(value)">
    <div class="flex flex-wrap gap-1.5">
      <span
        v-for="option in (value as string[])"
        :key="option"
        class="inline-flex items-center text-[11.5px] px-2 py-0.5 rounded-full border font-medium"
        :style="{
          background: `color-mix(in oklab, ${config.color}, white 90%)`,
          color: `color-mix(in oklab, ${config.color}, black 30%)`,
          borderColor: `color-mix(in oklab, ${config.color}, white 70%)`
        }"
      >{{ option }}</span>
    </div>
  </template>

  <!-- medication: dose pill -->
  <template v-else-if="config.type === 'medication'">
    <span
      class="inline-flex items-baseline rounded-full px-3 py-1.5"
      :style="{ background: `color-mix(in oklab, ${config.color}, white 92%)` }"
    >
      <span
        v-if="value !== null && typeof value === 'object' && !Array.isArray(value) && (value as MedicationValue).amount"
        class="text-[14.5px] font-semibold tabular-nums"
        :style="{ color: config.color }"
      >{{ (value as MedicationValue).amount }} {{ (value as MedicationValue).unit }}</span>
      <span
        v-else
        class="text-[14.5px] font-semibold"
        :style="{ color: config.color }"
      >Logged</span>
    </span>
  </template>

  <!-- string: italic quoted -->
  <template v-else-if="config.type === 'string'">
    <span class="text-[14px] italic text-ink before:content-['“'] before:mr-0.5 after:content-['”'] after:ml-0.5">
      {{ value }}
    </span>
  </template>
</template>
