<script setup lang="ts">
import type { DataPointConfig, DataPointValue, RangeConfig, StringConfig, MultiStringConfig, BooleanConfig, MedicationConfig, MedicationValue } from '@/types'
import RangeField from './fields/RangeField.vue'
import StringField from './fields/StringField.vue'
import MultiStringField from './fields/MultiStringField.vue'
import BooleanField from './fields/BooleanField.vue'
import MedicationField from './fields/MedicationField.vue'

defineProps<{
  config: DataPointConfig
  modelValue: DataPointValue
}>()

const emit = defineEmits<{
  'update:modelValue': [value: DataPointValue]
}>()
</script>

<template>
  <div class="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-100">
    <span class="text-xl leading-none mt-0.5" :style="{ color: config.color }">
      {{ config.icon }}
    </span>
    <div class="flex-1">
      <p class="text-sm font-medium text-gray-700 mb-1.5">{{ config.label }}</p>
      <RangeField
        v-if="config.type === 'range'"
        :config="(config.config as RangeConfig)"
        :model-value="typeof modelValue === 'number' ? modelValue : null"
        @update:model-value="emit('update:modelValue', $event)"
      />
      <StringField
        v-else-if="config.type === 'string'"
        :config="(config.config as StringConfig)"
        :model-value="typeof modelValue === 'string' ? modelValue : null"
        @update:model-value="emit('update:modelValue', $event)"
      />
      <MultiStringField
        v-else-if="config.type === 'multi-string'"
        :config="(config.config as MultiStringConfig)"
        :model-value="Array.isArray(modelValue) ? modelValue : null"
        @update:model-value="emit('update:modelValue', $event)"
      />
      <BooleanField
        v-else-if="config.type === 'boolean'"
        :config="(config.config as BooleanConfig)"
        :model-value="typeof modelValue === 'boolean' ? modelValue : null"
        @update:model-value="emit('update:modelValue', $event)"
      />
      <MedicationField
        v-else-if="config.type === 'medication'"
        :config="(config.config as MedicationConfig)"
        :model-value="(modelValue !== null && typeof modelValue === 'object' && !Array.isArray(modelValue)) ? (modelValue as MedicationValue) : null"
        @update:model-value="emit('update:modelValue', $event)"
      />
    </div>
  </div>
</template>
