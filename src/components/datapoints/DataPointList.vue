<script setup lang="ts">
import type { DataPointConfig } from '@/types'

defineProps<{ configs: DataPointConfig[] }>()

const emit = defineEmits<{
  edit: [config: DataPointConfig]
  delete: [id: string]
}>()
</script>

<template>
  <div class="space-y-2">
    <div
      v-for="config in configs"
      :key="config.id"
      class="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-100"
    >
      <span class="text-xl">{{ config.icon }}</span>
      <div class="flex-1 min-w-0">
        <p class="font-medium text-gray-800 text-sm truncate">{{ config.label }}</p>
        <p class="text-xs text-gray-400">{{ config.type }}</p>
      </div>
      <div
        class="w-3 h-3 rounded-full border border-gray-200 shrink-0"
        :style="{ backgroundColor: config.color }"
      />
      <button
        @click="emit('edit', config)"
        class="text-xs text-indigo-600 hover:text-indigo-800 transition"
      >
        Edit
      </button>
      <button
        @click="emit('delete', config.id)"
        class="text-xs text-red-400 hover:text-red-600 transition"
      >
        Delete
      </button>
    </div>

    <p v-if="!configs.length" class="text-center text-gray-400 text-sm py-8">
      No data points yet. Add one to start tracking.
    </p>
  </div>
</template>
