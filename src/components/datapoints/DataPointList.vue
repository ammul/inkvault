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
      class="flex items-center gap-3 p-3 bg-raised rounded-card border border-edge"
    >
      <span class="text-lg leading-none shrink-0">{{ config.icon }}</span>
      <div class="flex-1 min-w-0">
        <p class="font-medium text-ink text-sm truncate">{{ config.label }}</p>
        <p class="text-xs text-ink-faint">{{ config.type }}</p>
      </div>
      <div
        class="w-3 h-3 rounded-pill border border-edge shrink-0"
        :style="{ backgroundColor: config.color }"
      />
      <button
        @click="emit('edit', config)"
        class="text-xs text-accent hover:text-accent-dim transition-colors px-2 py-1 rounded-input hover:bg-accent-tint"
      >
        Edit
      </button>
      <button
        @click="emit('delete', config.id)"
        class="text-xs text-danger hover:text-danger-dim transition-colors px-2 py-1 rounded-input hover:bg-danger-tint"
      >
        Delete
      </button>
    </div>

    <p v-if="!configs.length" class="text-center text-ink-faint text-sm py-10">
      No data points yet. Add one to start tracking.
    </p>
  </div>
</template>
