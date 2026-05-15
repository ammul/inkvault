<script setup lang="ts">
import type { MultiStringConfig } from '@/types'

const props = defineProps<{
  config: MultiStringConfig
  modelValue: string[] | null
}>()

const emit = defineEmits<{ 'update:modelValue': [value: string[]] }>()

function toggle(option: string) {
  const current = Array.isArray(props.modelValue) ? props.modelValue : []
  const next = current.includes(option)
    ? current.filter((o) => o !== option)
    : [...current, option]
  emit('update:modelValue', next)
}

function isSelected(option: string): boolean {
  return Array.isArray(props.modelValue) && props.modelValue.includes(option)
}
</script>

<template>
  <div class="flex flex-wrap gap-1.5">
    <button
      v-for="option in config.options"
      :key="option"
      type="button"
      @click="toggle(option)"
      :class="[
        'text-xs px-3 py-1 rounded-pill border transition-colors',
        isSelected(option)
          ? 'bg-accent text-on-accent border-accent'
          : 'border-edge text-ink-muted hover:border-accent hover:text-accent',
      ]"
    >
      {{ option }}
    </button>
  </div>
</template>
