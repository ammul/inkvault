<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { DataPointConfig } from '@/types'
import DataPointIcon from '@/components/ui/DataPointIcon.vue'

const { t } = useI18n()

defineProps<{ configs: DataPointConfig[] }>()

const emit = defineEmits<{
  edit: [config: DataPointConfig]
  delete: [id: string]
}>()
</script>

<template>
  <div>
    <TransitionGroup name="list" tag="div" class="space-y-2">
      <div
        v-for="config in configs"
        :key="config.id"
        class="flex items-center gap-3 p-3 bg-raised rounded-card border border-edge"
      >
        <DataPointIcon :icon="config.icon" :color="config.color" :label="config.label" />
        <div class="flex-1 min-w-0">
          <p class="font-medium text-ink text-sm truncate">{{ config.label }}</p>
          <p class="text-xs text-ink-faint">{{ config.type }}</p>
        </div>
        <button
          @click="emit('edit', config)"
          class="text-xs text-accent hover:text-accent-dim transition-colors px-2 py-1 rounded-input hover:bg-accent-tint"
        >
          {{ t('dataPoints.edit') }}
        </button>
        <button
          @click="emit('delete', config.id)"
          class="text-xs text-danger hover:text-danger-dim transition-colors px-2 py-1 rounded-input hover:bg-danger-tint"
        >
          {{ t('dataPoints.delete') }}
        </button>
      </div>
    </TransitionGroup>

    <p v-if="!configs.length" class="text-center text-ink-faint text-sm py-10">
      {{ t('dataPoints.empty') }}
    </p>
  </div>
</template>

<style scoped>
.list-enter-active {
  transition: opacity 200ms ease, transform 200ms ease;
}
.list-leave-active {
  transition: opacity 150ms ease, transform 150ms ease;
}
.list-enter-from {
  opacity: 0;
  transform: translateY(6px);
}
.list-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
.list-move {
  transition: transform 200ms ease;
}
</style>
