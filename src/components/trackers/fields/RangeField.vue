<script setup lang="ts">
import type { RangeConfig } from '@/types'

const props = defineProps<{
  config: RangeConfig
  modelValue: number | null
  label?: string
}>()

const emit = defineEmits<{ 'update:modelValue': [value: number] }>()

const currentValue = () => props.modelValue ?? props.config.min
</script>

<template>
  <div class="flex items-center gap-3">
    <span class="text-xs text-ink-faint w-6 text-right shrink-0">{{ config.min }}</span>
    <input
      type="range"
      :min="config.min"
      :max="config.max"
      :step="config.step"
      :value="currentValue()"
      :aria-label="label"
      @input="emit('update:modelValue', Number(($event.target as HTMLInputElement).value))"
      class="flex-1 accent-accent"
    />
    <span class="text-xs text-ink-faint w-6 shrink-0">{{ config.max }}</span>
    <span class="text-sm font-semibold text-ink w-8 text-right shrink-0">{{ currentValue() }}</span>
  </div>
</template>
