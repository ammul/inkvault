<script setup lang="ts">
import { ref, watch } from 'vue'
import type { MedicationConfig, MedicationValue } from '@/types'

const UNITS = ['mg', 'g', 'µg', 'ml', 'IU', 'tablets', 'capsules', 'drops', 'puffs']

const props = defineProps<{
  config: MedicationConfig
  modelValue: MedicationValue | null
}>()

const emit = defineEmits<{ 'update:modelValue': [value: MedicationValue] }>()

const amount = ref(props.modelValue?.amount ?? 0)
const unit = ref(props.modelValue?.unit ?? 'mg')
const time = ref(props.modelValue?.time ?? '')

watch(
  () => props.modelValue,
  (v) => {
    if (v) {
      amount.value = v.amount
      unit.value = v.unit
      time.value = v.time
    }
  },
)

function emitUpdate() {
  emit('update:modelValue', { amount: amount.value, unit: unit.value, time: time.value })
}
</script>

<template>
  <div class="flex flex-wrap gap-2 items-center">
    <input
      v-model.number="amount"
      type="number"
      min="0"
      step="any"
      placeholder="0"
      class="w-20 border border-edge rounded-input px-2.5 py-1.5 text-sm text-ink bg-surface focus:outline-none focus:ring-2 focus:ring-accent/25 focus:border-accent transition-colors"
      @change="emitUpdate"
    />
    <select
      v-model="unit"
      class="border border-edge rounded-input px-2.5 py-1.5 text-sm text-ink bg-surface focus:outline-none focus:ring-2 focus:ring-accent/25 focus:border-accent transition-colors"
      @change="emitUpdate"
    >
      <option v-for="u in UNITS" :key="u" :value="u">{{ u }}</option>
    </select>
    <span class="text-xs text-ink-faint">at</span>
    <input
      v-model="time"
      type="time"
      class="border border-edge rounded-input px-2.5 py-1.5 text-sm text-ink bg-surface focus:outline-none focus:ring-2 focus:ring-accent/25 focus:border-accent transition-colors"
      @change="emitUpdate"
    />
  </div>
</template>
