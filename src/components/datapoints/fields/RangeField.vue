<script setup lang="ts">
import type { RangeConfig } from '@/types'

const props = defineProps<{
  config: RangeConfig
  modelValue: number | null
}>()

const emit = defineEmits<{ 'update:modelValue': [value: number] }>()

const currentValue = () => props.modelValue ?? props.config.min
</script>

<template>
  <div class="flex items-center gap-3">
    <span class="text-xs text-gray-400 w-6 text-right">{{ config.min }}</span>
    <input
      type="range"
      :min="config.min"
      :max="config.max"
      :step="config.step"
      :value="currentValue()"
      @input="emit('update:modelValue', Number(($event.target as HTMLInputElement).value))"
      class="flex-1 accent-indigo-600"
    />
    <span class="text-xs text-gray-400 w-6">{{ config.max }}</span>
    <span class="text-sm font-medium text-gray-700 w-8 text-right">{{ currentValue() }}</span>
  </div>
</template>
