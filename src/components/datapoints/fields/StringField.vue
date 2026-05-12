<script setup lang="ts">
import type { StringConfig } from '@/types'

defineProps<{
  config: StringConfig
  modelValue: string | null
}>()

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()
</script>

<template>
  <input
    type="text"
    :value="modelValue ?? ''"
    :placeholder="config.placeholder ?? ''"
    @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    class="w-full border border-edge rounded-input px-2.5 py-1.5 text-sm text-ink bg-surface placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-accent/25 focus:border-accent transition-colors"
  />
</template>
