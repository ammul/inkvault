<script setup lang="ts">
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type {
  DataPointConfig,
  DataPointType,
  RangeConfig,
  MultiStringConfig,
  BooleanConfig,
  MedicationConfig,
} from '@/types'

const { t } = useI18n()

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
    <h3 class="font-semibold text-ink">{{ initial ? t('dataPoints.editor.editTitle') : t('dataPoints.editor.newTitle') }}</h3>

    <div class="grid grid-cols-2 gap-3">
      <div>
        <label class="block text-xs font-medium text-ink-muted mb-1.5">{{ t('dataPoints.editor.label') }}</label>
        <input
          v-model="label"
          type="text"
          :placeholder="t('dataPoints.editor.labelPlaceholder')"
          required
          class="w-full border border-edge rounded-input px-3 py-2 text-sm text-ink bg-surface placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-accent/25 focus:border-accent transition-colors"
        />
      </div>
      <div>
        <label class="block text-xs font-medium text-ink-muted mb-1.5">{{ t('dataPoints.editor.icon') }}</label>
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
        <label class="block text-xs font-medium text-ink-muted mb-1.5">{{ t('dataPoints.editor.color') }}</label>
        <input
          v-model="color"
          type="color"
          class="h-9 w-full border border-edge rounded-input cursor-pointer bg-surface"
        />
      </div>
      <div>
        <label class="block text-xs font-medium text-ink-muted mb-1.5">{{ t('dataPoints.editor.type') }}</label>
        <select
          v-model="type"
          :disabled="locked"
          class="w-full border border-edge rounded-input px-3 py-2 text-sm text-ink bg-surface focus:outline-none focus:ring-2 focus:ring-accent/25 focus:border-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <option value="range">{{ t('dataPoints.editor.types.range') }}</option>
          <option value="string">{{ t('dataPoints.editor.types.string') }}</option>
          <option value="multi-string">{{ t('dataPoints.editor.types.multiString') }}</option>
          <option value="boolean">{{ t('dataPoints.editor.types.boolean') }}</option>
          <option value="medication">{{ t('dataPoints.editor.types.medication') }}</option>
        </select>
      </div>
    </div>

    <div v-if="locked" class="text-xs text-warn bg-warn-tint border border-warn/30 rounded-input px-3 py-2.5">
      {{ t('dataPoints.editor.lockedWarning') }}
    </div>

    <div v-if="type === 'range' && !locked" class="grid grid-cols-3 gap-2">
      <div>
        <label class="block text-xs font-medium text-ink-muted mb-1.5">{{ t('dataPoints.editor.range.min') }}</label>
        <input
          v-model.number="rangeMin"
          type="number"
          class="w-full border border-edge rounded-input px-3 py-2 text-sm text-ink bg-surface focus:outline-none focus:ring-2 focus:ring-accent/25 focus:border-accent transition-colors"
        />
      </div>
      <div>
        <label class="block text-xs font-medium text-ink-muted mb-1.5">{{ t('dataPoints.editor.range.max') }}</label>
        <input
          v-model.number="rangeMax"
          type="number"
          class="w-full border border-edge rounded-input px-3 py-2 text-sm text-ink bg-surface focus:outline-none focus:ring-2 focus:ring-accent/25 focus:border-accent transition-colors"
        />
      </div>
      <div>
        <label class="block text-xs font-medium text-ink-muted mb-1.5">{{ t('dataPoints.editor.range.step') }}</label>
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
      <label class="block text-xs font-medium text-ink-muted mb-1.5">{{ t('dataPoints.editor.string.placeholder') }}</label>
      <input
        v-model="placeholder"
        type="text"
        class="w-full border border-edge rounded-input px-3 py-2 text-sm text-ink bg-surface focus:outline-none focus:ring-2 focus:ring-accent/25 focus:border-accent transition-colors"
      />
    </div>

    <div v-if="type === 'multi-string' && !locked">
      <label class="block text-xs font-medium text-ink-muted mb-1.5">{{ t('dataPoints.editor.multiString.options') }}</label>
      <input
        v-model="optionsRaw"
        type="text"
        :placeholder="t('dataPoints.editor.multiString.optionsPlaceholder')"
        class="w-full border border-edge rounded-input px-3 py-2 text-sm text-ink bg-surface placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-accent/25 focus:border-accent transition-colors"
      />
    </div>

    <div v-if="type === 'medication' && !locked">
      <label class="block text-xs font-medium text-ink-muted mb-1.5">{{ t('dataPoints.editor.medication.name') }}</label>
      <input
        v-model="medicationName"
        type="text"
        :placeholder="t('dataPoints.editor.medication.namePlaceholder')"
        class="w-full border border-edge rounded-input px-3 py-2 text-sm text-ink bg-surface placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-accent/25 focus:border-accent transition-colors"
      />
    </div>

    <div v-if="type === 'boolean' && !locked" class="grid grid-cols-2 gap-2">
      <div>
        <label class="block text-xs font-medium text-ink-muted mb-1.5">{{ t('dataPoints.editor.boolean.trueLabel') }}</label>
        <input
          v-model="trueLabel"
          type="text"
          class="w-full border border-edge rounded-input px-3 py-2 text-sm text-ink bg-surface focus:outline-none focus:ring-2 focus:ring-accent/25 focus:border-accent transition-colors"
        />
      </div>
      <div>
        <label class="block text-xs font-medium text-ink-muted mb-1.5">{{ t('dataPoints.editor.boolean.falseLabel') }}</label>
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
        {{ t('dataPoints.editor.cancel') }}
      </button>
      <button
        type="submit"
        class="text-sm px-4 py-2 rounded-input bg-accent text-on-accent hover:bg-accent-dim transition-colors font-medium"
      >
        {{ initial ? t('dataPoints.editor.save') : t('dataPoints.editor.add') }}
      </button>
    </div>
  </form>
</template>
