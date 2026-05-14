<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type {
  DataPointConfig,
  DataPointType,
  RangeConfig,
  MultiStringConfig,
  BooleanConfig,
  MedicationConfig,
} from '@/types'
import EmojiPicker from '@/components/ui/EmojiPicker.vue'
import { useAppSettingsStore } from '@/stores/appSettings'

const { t } = useI18n()
const appSettings = useAppSettingsStore()

const props = defineProps<{ initial?: DataPointConfig; locked?: boolean }>()
const emit = defineEmits<{
  save: [config: Omit<DataPointConfig, 'id' | 'createdAt'>]
  cancel: []
}>()

const TYPE_EMOJIS: Record<DataPointType, string> = {
  range: '📊',
  string: '📝',
  'multi-string': '📋',
  boolean: '✅',
  medication: '💊',
}

const TYPE_OPTIONS: { value: DataPointType; emoji: string; i18nKey: string }[] = [
  { value: 'range',        emoji: '📊', i18nKey: 'range' },
  { value: 'string',       emoji: '📝', i18nKey: 'string' },
  { value: 'multi-string', emoji: '📋', i18nKey: 'multiString' },
  { value: 'boolean',      emoji: '✅', i18nKey: 'boolean' },
  { value: 'medication',   emoji: '💊', i18nKey: 'medication' },
]

const label = ref('')
const color = ref('#6366f1')
const icon = ref(props.initial?.icon ?? TYPE_EMOJIS['range'])
const type = ref<DataPointType>('range')
const rangeMin = ref(0)
const rangeMax = ref(10)
const rangeStep = ref(1)
const optionsRaw = ref('')
const trueLabel = ref('Yes')
const falseLabel = ref('No')
const placeholder = ref('')
const medicationName = ref('')
const dosagePresetsRaw = ref('')

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
      dosagePresetsRaw.value = (v.config as MedicationConfig).dosagePresets?.join(', ') ?? ''
    }
  },
  { immediate: true },
)

const currentTypeOption = computed(() => TYPE_OPTIONS.find(o => o.value === type.value)!)

watch(type, (newType) => {
  if (!props.locked) icon.value = TYPE_EMOJIS[newType]
})

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
      return {
        medication: medicationName.value.trim(),
        dosagePresets: dosagePresetsRaw.value
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
      }
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

    <!-- Label + icon + color in one row -->
    <div class="flex gap-3 items-end">
      <div class="flex-1">
        <label class="block text-xs font-medium text-ink-muted mb-1.5">{{ t('dataPoints.editor.label') }}</label>
        <input
          v-model="label"
          type="text"
          :placeholder="t('dataPoints.editor.labelPlaceholder')"
          required
          class="w-full border border-edge rounded-input px-3 py-2 text-sm text-ink bg-surface placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-accent/25 focus:border-accent transition-colors"
        />
      </div>
      <div v-if="appSettings.settings.useEmojis">
        <label class="block text-xs font-medium text-ink-muted mb-1.5">{{ t('dataPoints.editor.icon') }}</label>
        <EmojiPicker v-model="icon" />
      </div>
      <div>
        <label class="block text-xs font-medium text-ink-muted mb-1.5">{{ t('dataPoints.editor.color') }}</label>
        <input
          v-model="color"
          type="color"
          class="h-10 w-14 border border-edge rounded-input cursor-pointer bg-surface"
        />
      </div>
    </div>

    <!-- Type picker -->
    <div>
      <label class="block text-xs font-medium text-ink-muted mb-1.5">{{ t('dataPoints.editor.type') }}</label>

      <!-- Locked: read-only display, no interaction possible -->
      <div v-if="locked" class="flex items-center gap-2 px-3 py-2 border border-edge rounded-input bg-surface opacity-60 cursor-not-allowed select-none">
        <span v-if="appSettings.settings.useEmojis" class="text-xl leading-none">{{ currentTypeOption.emoji }}</span>
        <span class="text-sm text-ink">{{ t(`dataPoints.editor.types.${currentTypeOption.i18nKey}.label`) }}</span>
      </div>

      <!-- Unlocked, no-emoji mode: dropdown -->
      <select
        v-else-if="!appSettings.settings.useEmojis"
        v-model="type"
        class="w-full border border-edge rounded-input px-3 py-2 text-sm text-ink bg-surface focus:outline-none focus:ring-2 focus:ring-accent/25 focus:border-accent transition-colors"
      >
        <option v-for="opt in TYPE_OPTIONS" :key="opt.value" :value="opt.value">
          {{ t(`dataPoints.editor.types.${opt.i18nKey}.label`) }}
        </option>
      </select>

      <!-- Unlocked, emoji mode: button grid -->
      <div v-else class="grid grid-cols-5 gap-2">
        <button
          v-for="opt in TYPE_OPTIONS"
          :key="opt.value"
          type="button"
          @click="type = opt.value"
          :class="[
            'flex flex-col items-center gap-0.5 py-2.5 px-1 rounded-card border-2 transition-colors text-center cursor-pointer',
            type === opt.value
              ? 'border-accent bg-accent-tint'
              : 'border-edge hover:border-accent/40 hover:bg-subtle'
          ]"
        >
          <span class="text-xl leading-none">{{ opt.emoji }}</span>
          <span class="text-[11px] font-medium text-ink leading-tight mt-0.5">
            {{ t(`dataPoints.editor.types.${opt.i18nKey}.label`) }}
          </span>
          <span class="text-[10px] text-ink-faint leading-tight hidden sm:block">
            {{ t(`dataPoints.editor.types.${opt.i18nKey}.description`) }}
          </span>
        </button>
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
      <p class="text-xs text-ink-faint mt-1">{{ t('dataPoints.editor.multiString.optionsHint') }}</p>
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

    <div v-if="type === 'medication' && !locked">
      <label class="block text-xs font-medium text-ink-muted mb-1.5">{{ t('dataPoints.editor.medication.dosagePresets') }}</label>
      <input
        v-model="dosagePresetsRaw"
        type="text"
        :placeholder="t('dataPoints.editor.medication.dosagePresetsPlaceholder')"
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
