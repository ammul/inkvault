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
    class="w-full border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
  />
</template>
