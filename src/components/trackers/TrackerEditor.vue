<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type {
  TrackerConfig,
  TrackerType,
  TrackerValue,
  RangeConfig,
  MultiStringConfig,
  BooleanConfig,
  MedicationConfig,
  MedicationValue,
} from '@/types'
import EmojiPicker from '@/components/ui/EmojiPicker.vue'
import TrackerField from '@/components/trackers/TrackerField.vue'
import { useAppSettingsStore } from '@/stores/appSettings'

const { t } = useI18n()
const appSettings = useAppSettingsStore()

const props = defineProps<{ initial?: TrackerConfig; locked?: boolean; compact?: boolean }>()
const emit = defineEmits<{
  save: [config: Omit<TrackerConfig, 'id' | 'createdAt'>]
  cancel: []
}>()

const TYPE_EMOJIS: Record<TrackerType, string> = {
  range: '📊',
  string: '📝',
  'multi-string': '📋',
  boolean: '✅',
  medication: '💊',
}

const TYPE_OPTIONS: { value: TrackerType; emoji: string; i18nKey: string }[] = [
  { value: 'range',        emoji: '📊', i18nKey: 'range' },
  { value: 'string',       emoji: '📝', i18nKey: 'string' },
  { value: 'multi-string', emoji: '📋', i18nKey: 'multiString' },
  { value: 'boolean',      emoji: '✅', i18nKey: 'boolean' },
  { value: 'medication',   emoji: '💊', i18nKey: 'medication' },
]

const SWATCHES = ['#4f46e5', '#7c3aed', '#0d9488', '#e11d48', '#d97706', '#475569'] as const

const customColorRef = ref<HTMLInputElement | null>(null)

const label = ref('')
const color = ref('#4f46e5')
const icon = ref(props.initial?.icon ?? TYPE_EMOJIS['range'])
const type = ref<TrackerType>('range')
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

const parsedOptions = computed(() =>
  optionsRaw.value.split(',').map(s => s.trim()).filter(Boolean)
)

watch(type, (newType) => {
  if (!props.locked) icon.value = TYPE_EMOJIS[newType]
  if (props.compact) sampleValue.value = defaultSample(newType)
})

function buildConfig() {
  switch (type.value) {
    case 'range':
      return { min: rangeMin.value, max: rangeMax.value, step: rangeStep.value }
    case 'string':
      return { placeholder: placeholder.value }
    case 'multi-string':
      return { options: parsedOptions.value }
    case 'boolean':
      return { trueLabel: trueLabel.value, falseLabel: falseLabel.value }
    case 'medication':
      return {
        medication: medicationName.value.trim(),
        dosagePresets: dosagePresetsRaw.value
          .split(',')
          .map(s => s.trim())
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

defineExpose({ submit })

// ── Live preview ───────────────────────────────────────────────

function defaultSample(t: TrackerType): TrackerValue {
  switch (t) {
    case 'range': return Math.round((rangeMin.value + rangeMax.value) / 2)
    case 'string': return ''
    case 'multi-string': return parsedOptions.value.length > 0 ? [parsedOptions.value[0]] : []
    case 'boolean': return true
    case 'medication': return { amount: 0, unit: 'mg', time: '08:00' } as MedicationValue
  }
}

function initialSample(): TrackerValue {
  if (!props.initial) return defaultSample('range')
  switch (props.initial.type) {
    case 'range': {
      const c = props.initial.config as RangeConfig
      return Math.round((c.min + c.max) / 2)
    }
    case 'string': return ''
    case 'multi-string': {
      const opts = (props.initial.config as MultiStringConfig).options
      return opts.length > 0 ? [opts[0]] : []
    }
    case 'boolean': return true
    case 'medication': return { amount: 0, unit: 'mg', time: '08:00' } as MedicationValue
  }
}

const sampleValue = ref<TrackerValue>(initialSample())

const liveConfig = computed<TrackerConfig>(() => ({
  id: props.initial?.id ?? '__preview__',
  createdAt: props.initial?.createdAt ?? '',
  label: label.value || t('trackers.editor.labelPlaceholder'),
  color: color.value,
  icon: icon.value,
  type: type.value,
  config: buildConfig(),
}))
</script>

<template>
  <form
    @submit.prevent="submit"
    :class="compact ? '' : 'space-y-4 bg-raised rounded-card border border-edge shadow-card p-5'"
  >
    <h3 v-if="!compact" class="font-semibold text-ink">
      {{ initial ? t('trackers.editor.editTitle') : t('trackers.editor.newTitle') }}
    </h3>

    <div :class="compact ? 'grid grid-cols-1 md:grid-cols-[1.05fr_0.95fr]' : 'space-y-4'">

      <!-- ── Form fields (left column in compact) ─────────── -->
      <div :class="compact ? 'p-4 space-y-3' : 'space-y-4'">

        <!-- Label (always full width) -->
        <div>
          <label class="block text-[11px] font-medium text-ink-muted mb-1.5">{{ t('trackers.editor.label') }}</label>
          <input
            v-model="label"
            type="text"
            :placeholder="t('trackers.editor.labelPlaceholder')"
            required
            class="w-full border border-edge rounded-input px-3 py-2 text-sm text-ink bg-surface placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-accent/25 focus:border-accent transition-colors"
          />
        </div>

        <!-- Icon + Colour (same row) -->
        <div class="flex gap-4 items-end flex-wrap">
          <div v-if="appSettings.settings.useEmojis">
            <label class="block text-[11px] font-medium text-ink-muted mb-1.5">{{ t('trackers.editor.icon') }}</label>
            <EmojiPicker v-model="icon" />
          </div>
          <div>
            <label class="block text-[11px] font-medium text-ink-muted mb-1.5">{{ t('trackers.editor.color') }}</label>
            <div
              role="radiogroup"
              :aria-label="t('trackers.editor.colorAriaLabel')"
              class="flex items-center gap-2 flex-wrap mt-0.5"
            >
              <button
                v-for="swatch in SWATCHES"
                :key="swatch"
                type="button"
                role="radio"
                :aria-checked="color === swatch"
                @click="color = swatch"
                class="w-6 h-6 rounded-full border-2 border-surface shrink-0 transition-shadow cursor-pointer"
                :style="{
                  backgroundColor: swatch,
                  boxShadow: color === swatch
                    ? `0 0 0 1px var(--color-edge), 0 0 0 3px ${swatch}`
                    : '0 0 0 1px var(--color-edge)'
                }"
              />
              <button
                type="button"
                class="text-[11px] text-ink-muted hover:text-ink transition-colors"
                @click="customColorRef?.click()"
              >{{ t('trackers.editor.colorCustom') }}</button>
              <input
                ref="customColorRef"
                v-model="color"
                type="color"
                class="sr-only"
                tabindex="-1"
              />
            </div>
          </div>
        </div>

        <!-- Type picker -->
        <div>
          <label class="block text-[11px] font-medium text-ink-muted mb-1.5">{{ t('trackers.editor.type') }}</label>

          <!-- Locked: read-only display -->
          <div
            v-if="locked"
            class="flex items-center gap-2 px-3 py-2 border border-edge rounded-input bg-surface opacity-60 cursor-not-allowed select-none"
          >
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

        <!-- Range fields -->
        <div v-if="type === 'range'" class="grid grid-cols-3 gap-2" :class="{ 'opacity-60 select-none': locked }">
          <div>
            <label class="block text-[11px] font-medium text-ink-muted mb-1.5">{{ t('trackers.editor.range.min') }}</label>
            <input
              v-model.number="rangeMin"
              type="number"
              :disabled="locked"
              :class="locked ? 'cursor-not-allowed' : 'focus:outline-none focus:ring-2 focus:ring-accent/25 focus:border-accent transition-colors'"
              class="w-full border border-edge rounded-input px-3 py-2 text-sm text-ink bg-surface"
            />
          </div>
          <div>
            <label class="block text-[11px] font-medium text-ink-muted mb-1.5">{{ t('trackers.editor.range.max') }}</label>
            <input
              v-model.number="rangeMax"
              type="number"
              :disabled="locked"
              :class="locked ? 'cursor-not-allowed' : 'focus:outline-none focus:ring-2 focus:ring-accent/25 focus:border-accent transition-colors'"
              class="w-full border border-edge rounded-input px-3 py-2 text-sm text-ink bg-surface"
            />
          </div>
          <div>
            <label class="block text-[11px] font-medium text-ink-muted mb-1.5">{{ t('trackers.editor.range.step') }}</label>
            <input
              v-model.number="rangeStep"
              type="number"
              min="0.01"
              step="any"
              :disabled="locked"
              :class="locked ? 'cursor-not-allowed' : 'focus:outline-none focus:ring-2 focus:ring-accent/25 focus:border-accent transition-colors'"
              class="w-full border border-edge rounded-input px-3 py-2 text-sm text-ink bg-surface"
            />
          </div>
          <p v-if="locked" class="col-span-3 text-[11px] text-ink-faint">{{ t('trackers.editor.lockedFieldHint') }}</p>
        </div>

        <!-- String field -->
        <div v-if="type === 'string'" :class="{ 'opacity-60 select-none': locked }">
          <label class="block text-[11px] font-medium text-ink-muted mb-1.5">{{ t('trackers.editor.string.placeholder') }}</label>
          <input
            v-model="placeholder"
            type="text"
            :disabled="locked"
            :class="locked ? 'cursor-not-allowed' : 'focus:outline-none focus:ring-2 focus:ring-accent/25 focus:border-accent transition-colors'"
            class="w-full border border-edge rounded-input px-3 py-2 text-sm text-ink bg-surface"
          />
          <p v-if="locked" class="text-[11px] text-ink-faint mt-1">{{ t('trackers.editor.lockedFieldHint') }}</p>
        </div>

        <!-- Multi-string field -->
        <div v-if="type === 'multi-string'">
          <label class="block text-[11px] font-medium text-ink-muted mb-1.5">{{ t('trackers.editor.multiString.options') }}</label>
          <!-- Locked: chips -->
          <div v-if="locked" class="flex flex-wrap gap-1 opacity-60 select-none">
            <span
              v-for="opt in parsedOptions"
              :key="opt"
              class="text-[11px] px-2 py-0.5 rounded-full border bg-accent-tint border-accent/30 text-accent-dim font-medium"
            >{{ opt }}</span>
          </div>
          <!-- Unlocked: text input -->
          <input
            v-else
            v-model="optionsRaw"
            type="text"
            :placeholder="t('trackers.editor.multiString.optionsPlaceholder')"
            class="w-full border border-edge rounded-input px-3 py-2 text-sm text-ink bg-surface placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-accent/25 focus:border-accent transition-colors"
          />
          <p class="text-[11px] text-ink-faint mt-1">
            {{ locked ? t('trackers.editor.lockedFieldHint') : t('trackers.editor.multiString.optionsHint') }}
          </p>
        </div>

        <!-- Boolean fields -->
        <div v-if="type === 'boolean'" class="grid grid-cols-2 gap-2" :class="{ 'opacity-60 select-none': locked }">
          <div>
            <label class="block text-[11px] font-medium text-ink-muted mb-1.5">{{ t('trackers.editor.boolean.trueLabel') }}</label>
            <input
              v-model="trueLabel"
              type="text"
              :disabled="locked"
              :class="locked ? 'cursor-not-allowed' : 'focus:outline-none focus:ring-2 focus:ring-accent/25 focus:border-accent transition-colors'"
              class="w-full border border-edge rounded-input px-3 py-2 text-sm text-ink bg-surface"
            />
          </div>
          <div>
            <label class="block text-[11px] font-medium text-ink-muted mb-1.5">{{ t('trackers.editor.boolean.falseLabel') }}</label>
            <input
              v-model="falseLabel"
              type="text"
              :disabled="locked"
              :class="locked ? 'cursor-not-allowed' : 'focus:outline-none focus:ring-2 focus:ring-accent/25 focus:border-accent transition-colors'"
              class="w-full border border-edge rounded-input px-3 py-2 text-sm text-ink bg-surface"
            />
          </div>
          <p v-if="locked" class="col-span-2 text-[11px] text-ink-faint">{{ t('trackers.editor.lockedFieldHint') }}</p>
        </div>

        <!-- Medication fields -->
        <div v-if="type === 'medication'" class="space-y-3" :class="{ 'opacity-60 select-none': locked }">
          <div>
            <label class="block text-[11px] font-medium text-ink-muted mb-1.5">{{ t('trackers.editor.medication.name') }}</label>
            <input
              v-model="medicationName"
              type="text"
              :placeholder="t('trackers.editor.medication.namePlaceholder')"
              :disabled="locked"
              :class="locked ? 'cursor-not-allowed' : 'focus:outline-none focus:ring-2 focus:ring-accent/25 focus:border-accent transition-colors'"
              class="w-full border border-edge rounded-input px-3 py-2 text-sm text-ink bg-surface placeholder:text-ink-faint"
            />
          </div>
          <div>
            <label class="block text-[11px] font-medium text-ink-muted mb-1.5">{{ t('trackers.editor.medication.dosagePresets') }}</label>
            <input
              v-model="dosagePresetsRaw"
              type="text"
              :placeholder="t('trackers.editor.medication.dosagePresetsPlaceholder')"
              :disabled="locked"
              :class="locked ? 'cursor-not-allowed' : 'focus:outline-none focus:ring-2 focus:ring-accent/25 focus:border-accent transition-colors'"
              class="w-full border border-edge rounded-input px-3 py-2 text-sm text-ink bg-surface placeholder:text-ink-faint"
            />
          </div>
          <p v-if="locked" class="text-[11px] text-ink-faint">{{ t('trackers.editor.lockedFieldHint') }}</p>
        </div>

      </div>
      <!-- end form fields -->

      <!-- ── Live preview (right column, compact only) ──────── -->
      <div v-if="compact" class="p-4 bg-subtle border-t border-edge md:border-t-0 md:border-l md:border-edge">
        <div class="text-[10px] font-semibold uppercase tracking-wider text-ink-faint flex items-center gap-1.5 mb-3">
          <span class="w-1.5 h-1.5 rounded-full bg-ok shrink-0"></span>
          {{ t('trackers.preview.livePreview') }}
        </div>
        <TrackerField :config="liveConfig" v-model="sampleValue" />
      </div>

    </div>
    <!-- end grid -->

    <!-- ── Footer (non-compact only) ─────────────────────── -->
    <div v-if="!compact" class="flex gap-2 justify-end pt-1">
      <button
        type="button"
        @click="emit('cancel')"
        class="text-sm px-4 py-2 rounded-input border border-edge text-ink-muted hover:bg-subtle hover:text-ink transition-colors"
      >
        {{ t('trackers.editor.cancel') }}
      </button>
      <button
        type="submit"
        class="text-sm px-4 py-2 rounded-input bg-accent text-on-accent hover:bg-accent-dim transition-colors font-medium"
      >
        {{ initial ? t('trackers.editor.save') : t('trackers.editor.add') }}
      </button>
    </div>
  </form>
</template>
