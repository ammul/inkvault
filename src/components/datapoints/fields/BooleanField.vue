<script setup lang="ts">
import type { BooleanConfig } from '@/types'

defineProps<{
  config: BooleanConfig
  modelValue: boolean | null
}>()

const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>()
</script>

<template>
  <div class="flex gap-2">
    <button
      type="button"
      @click="emit('update:modelValue', true)"
      :class="[
        'text-xs px-3 py-1 rounded-full border transition',
        modelValue === true
          ? 'bg-indigo-600 text-white border-indigo-600'
          : 'border-gray-300 text-gray-600 hover:border-indigo-400',
      ]"
    >
      {{ config.trueLabel }}
    </button>
    <button
      type="button"
      @click="emit('update:modelValue', false)"
      :class="[
        'text-xs px-3 py-1 rounded-full border transition',
        modelValue === false
          ? 'bg-indigo-600 text-white border-indigo-600'
          : 'border-gray-300 text-gray-600 hover:border-indigo-400',
      ]"
    >
      {{ config.falseLabel }}
    </button>
  </div>
</template>
