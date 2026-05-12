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
  <div class="flex flex-wrap gap-2">
    <button
      v-for="option in config.options"
      :key="option"
      type="button"
      @click="toggle(option)"
      :class="[
        'text-xs px-2 py-1 rounded-full border transition',
        isSelected(option)
          ? 'bg-indigo-600 text-white border-indigo-600'
          : 'border-gray-300 text-gray-600 hover:border-indigo-400',
      ]"
    >
      {{ option }}
    </button>
  </div>
</template>
