<script setup lang="ts">
import { ref, watch } from 'vue'
import type {
  DataPointConfig,
  DataPointType,
  RangeConfig,
  MultiStringConfig,
  BooleanConfig,
  MedicationConfig,
} from '@/types'

const props = defineProps<{ initial?: DataPointConfig; locked?: boolean }>()
const emit = defineEmits<{
  save: [config: Omit<DataPointConfig, 'id' | 'createdAt'>]
  cancel: []
}>()

const label = ref('')
const color = ref('#6366f1')
const icon = ref('📝')
const type = ref<DataPointType>('range')
const rangeMin = ref(0)
const rangeMax = ref(10)
const rangeStep = ref(1)
const optionsRaw = ref('')
const trueLabel = ref('Yes')
const falseLabel = ref('No')
const placeholder = ref('')
const medicationName = ref('')

watch(
  () => props.initial,
  (v) => {
    if (!v) return
    label.value = v.label
    color.value = v.color
    icon.value = v.icon
    type.value = v.type
    if (v.type === 'range') {
      const c = v.config as RangeConfig
      rangeMin.value = c.min
      rangeMax.value = c.max
      rangeStep.value = c.step
    } else if (v.type === 'multi-string') {
      optionsRaw.value = (v.config as MultiStringConfig).options.join(', ')
    } else if (v.type === 'boolean') {
      const c = v.config as BooleanConfig
      trueLabel.value = c.trueLabel
      falseLabel.value = c.falseLabel
    } else if (v.type === 'medication') {
      medicationName.value = (v.config as MedicationConfig).medication
    }
  },
  { immediate: true },
)

function buildConfig() {
  switch (type.value) {
    case 'range':
      return { min: rangeMin.value, max: rangeMax.value, step: rangeStep.value }
    case 'string':
      return { placeholder: placeholder.value }
    case 'multi-string':
      return {
        options: optionsRaw.value
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
      }
    case 'boolean':
      return { trueLabel: trueLabel.value, falseLabel: falseLabel.value }
    case 'medication':
      return { medication: medicationName.value.trim() }
  }
}

function submit() {
  if (!label.value.trim()) return
  emit('save', {
    label: label.value.trim(),
    color: color.value,
    icon: icon.value,
    type: type.value,
    config: buildConfig(),
  })
}
</script>

<template>
  <form @submit.prevent="submit" class="space-y-4 bg-raised rounded-card border border-edge shadow-card p-5">
    <h3 class="font-semibold text-ink">{{ initial ? 'Edit' : 'New' }} Data Point</h3>

    <div class="grid grid-cols-2 gap-3">
      <div>
        <label class="block text-xs font-medium text-ink-muted mb-1.5">Label</label>
        <input
          v-model="label"
          type="text"
          placeholder="e.g. Mood"
          required
          class="w-full border border-edge rounded-input px-3 py-2 text-sm text-ink bg-surface placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-accent/25 focus:border-accent transition-colors"
        />
      </div>
      <div>
        <label class="block text-xs font-medium text-ink-muted mb-1.5">Icon (emoji)</label>
        <input
          v-model="icon"
          type="text"
          placeholder="😊"
          class="w-full border border-edge rounded-input px-3 py-2 text-sm text-ink bg-surface placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-accent/25 focus:border-accent transition-colors"
        />
      </div>
    </div>

    <div class="grid grid-cols-2 gap-3">
      <div>
        <label class="block text-xs font-medium text-ink-muted mb-1.5">Color</label>
        <input
          v-model="color"
          type="color"
          class="h-9 w-full border border-edge rounded-input cursor-pointer bg-surface"
        />
      </div>
      <div>
        <label class="block text-xs font-medium text-ink-muted mb-1.5">Type</label>
        <select
          v-model="type"
          :disabled="locked"
          class="w-full border border-edge rounded-input px-3 py-2 text-sm text-ink bg-surface focus:outline-none focus:ring-2 focus:ring-accent/25 focus:border-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <option value="range">Range (slider)</option>
          <option value="string">Text</option>
          <option value="multi-string">Multiple choice</option>
          <option value="boolean">Yes / No</option>
          <option value="medication">Medication</option>
        </select>
      </div>
    </div>

    <div v-if="locked" class="text-xs text-warn bg-warn-tint border border-warn/30 rounded-input px-3 py-2.5">
      Type and configuration are locked because this data point has stored values.
    </div>

    <div v-if="type === 'range' && !locked" class="grid grid-cols-3 gap-2">
      <div>
        <label class="block text-xs font-medium text-ink-muted mb-1.5">Min</label>
        <input
          v-model.number="rangeMin"
          type="number"
          class="w-full border border-edge rounded-input px-3 py-2 text-sm text-ink bg-surface focus:outline-none focus:ring-2 focus:ring-accent/25 focus:border-accent transition-colors"
        />
      </div>
      <div>
        <label class="block text-xs font-medium text-ink-muted mb-1.5">Max</label>
        <input
          v-model.number="rangeMax"
          type="number"
          class="w-full border border-edge rounded-input px-3 py-2 text-sm text-ink bg-surface focus:outline-none focus:ring-2 focus:ring-accent/25 focus:border-accent transition-colors"
        />
      </div>
      <div>
        <label class="block text-xs font-medium text-ink-muted mb-1.5">Step</label>
        <input
          v-model.number="rangeStep"
          type="number"
          min="0.01"
          step="any"
          class="w-full border border-edge rounded-input px-3 py-2 text-sm text-ink bg-surface focus:outline-none focus:ring-2 focus:ring-accent/25 focus:border-accent transition-colors"
        />
      </div>
    </div>

    <div v-if="type === 'string' && !locked">
      <label class="block text-xs font-medium text-ink-muted mb-1.5">Placeholder text</label>
      <input
        v-model="placeholder"
        type="text"
        class="w-full border border-edge rounded-input px-3 py-2 text-sm text-ink bg-surface focus:outline-none focus:ring-2 focus:ring-accent/25 focus:border-accent transition-colors"
      />
    </div>

    <div v-if="type === 'multi-string' && !locked">
      <label class="block text-xs font-medium text-ink-muted mb-1.5">Options (comma-separated)</label>
      <input
        v-model="optionsRaw"
        type="text"
        placeholder="Good, Neutral, Bad"
        class="w-full border border-edge rounded-input px-3 py-2 text-sm text-ink bg-surface placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-accent/25 focus:border-accent transition-colors"
      />
    </div>

    <div v-if="type === 'medication' && !locked">
      <label class="block text-xs font-medium text-ink-muted mb-1.5">Medication name</label>
      <input
        v-model="medicationName"
        type="text"
        placeholder="e.g. Ibuprofen"
        class="w-full border border-edge rounded-input px-3 py-2 text-sm text-ink bg-surface placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-accent/25 focus:border-accent transition-colors"
      />
    </div>

    <div v-if="type === 'boolean' && !locked" class="grid grid-cols-2 gap-2">
      <div>
        <label class="block text-xs font-medium text-ink-muted mb-1.5">True label</label>
        <input
          v-model="trueLabel"
          type="text"
          class="w-full border border-edge rounded-input px-3 py-2 text-sm text-ink bg-surface focus:outline-none focus:ring-2 focus:ring-accent/25 focus:border-accent transition-colors"
        />
      </div>
      <div>
        <label class="block text-xs font-medium text-ink-muted mb-1.5">False label</label>
        <input
          v-model="falseLabel"
          type="text"
          class="w-full border border-edge rounded-input px-3 py-2 text-sm text-ink bg-surface focus:outline-none focus:ring-2 focus:ring-accent/25 focus:border-accent transition-colors"
        />
      </div>
    </div>

    <div class="flex gap-2 justify-end pt-1">
      <button
        type="button"
        @click="emit('cancel')"
        class="text-sm px-4 py-2 rounded-input border border-edge text-ink-muted hover:bg-subtle hover:text-ink transition-colors"
      >
        Cancel
      </button>
      <button
        type="submit"
        class="text-sm px-4 py-2 rounded-input bg-accent text-on-accent hover:bg-accent-dim transition-colors font-medium"
      >
        {{ initial ? 'Save Changes' : 'Add Data Point' }}
      </button>
    </div>
  </form>
</template>
