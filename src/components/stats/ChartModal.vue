<script setup lang="ts">
import type { DataPointConfig, DataPointValue } from '@/types'
import BaseModal from '@/components/ui/BaseModal.vue'
import ChartViewer from '@/components/charts/ChartViewer.vue'

defineProps<{
  config: DataPointConfig
  values: { date: string; value: DataPointValue }[]
}>()

const emit = defineEmits<{ close: [] }>()
</script>

<template>
  <BaseModal :title="config.label" @close="emit('close')">
    <ChartViewer :config="config" :values="values" />
  </BaseModal>
</template>
