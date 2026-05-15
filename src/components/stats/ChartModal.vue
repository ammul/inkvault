<script setup lang="ts">
import type { TrackerConfig, TrackerValue } from '@/types'
import BaseModal from '@/components/ui/BaseModal.vue'
import ChartViewer from '@/components/charts/ChartViewer.vue'

defineProps<{
  config: TrackerConfig
  values: { date: string; value: TrackerValue }[]
}>()

const emit = defineEmits<{ close: [] }>()
</script>

<template>
  <BaseModal :title="config.label" @close="emit('close')">
    <ChartViewer :config="config" :values="values" />
  </BaseModal>
</template>
