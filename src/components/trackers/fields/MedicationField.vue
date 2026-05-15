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

function autofillTime() {
  if (!time.value) {
    const now = new Date()
    time.value = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
  }
}

function emitUpdate() {
  emit('update:modelValue', { amount: amount.value, unit: unit.value, time: time.value })
}

function handleAmountOrUnitChange() {
  autofillTime()
  emitUpdate()
}

function applyPreset(preset: string) {
  const numMatch = preset.match(/^(\d+(?:\.\d+)?)/)
  if (numMatch) amount.value = parseFloat(numMatch[1])
  const matchedUnit = UNITS.find((u) => preset.includes(u))
  if (matchedUnit) unit.value = matchedUnit
  autofillTime()
  emitUpdate()
}
</script>

<template>
  <div>
  <div v-if="config.dosagePresets?.length" class="flex flex-wrap gap-1.5 mb-2">
    <button
      v-for="preset in config.dosagePresets"
      :key="preset"
      type="button"
      @click="applyPreset(preset)"
      class="text-xs px-3 py-1 rounded-full border border-edge text-ink-muted hover:border-accent hover:text-accent transition-colors"
    >
      {{ preset }}
    </button>
  </div>
  <div class="flex flex-wrap gap-2 items-center">
    <input
      v-model.number="amount"
      type="number"
      min="0"
      step="any"
      placeholder="0"
      class="w-20 border border-edge rounded-input px-2.5 py-1.5 text-sm text-ink bg-surface focus:outline-none focus:ring-2 focus:ring-accent/25 focus:border-accent transition-colors"
      @change="handleAmountOrUnitChange"
    />
    <select
      v-model="unit"
      class="border border-edge rounded-input px-2.5 py-1.5 text-sm text-ink bg-surface focus:outline-none focus:ring-2 focus:ring-accent/25 focus:border-accent transition-colors"
      @change="handleAmountOrUnitChange"
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
  </div>
</template>
