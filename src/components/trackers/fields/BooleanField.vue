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
        'text-xs px-4 py-1.5 rounded-pill border transition-colors',
        modelValue === true
          ? 'bg-accent text-on-accent border-accent'
          : 'border-edge text-ink-muted hover:border-accent hover:text-accent',
      ]"
    >
      {{ config.trueLabel }}
    </button>
    <button
      type="button"
      @click="emit('update:modelValue', false)"
      :class="[
        'text-xs px-4 py-1.5 rounded-pill border transition-colors',
        modelValue === false
          ? 'bg-accent text-on-accent border-accent'
          : 'border-edge text-ink-muted hover:border-accent hover:text-accent',
      ]"
    >
      {{ config.falseLabel }}
    </button>
  </div>
</template>
