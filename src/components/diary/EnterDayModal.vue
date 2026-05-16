<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { TrackerConfig, TrackerValue, MedicationValue } from '@/types'
import EntryModal from '@/components/diary/EntryModal.vue'

const props = defineProps<{
  open: boolean
  date: string
  trackerConfigs: TrackerConfig[]
}>()

const emit = defineEmits<{
  save: [payload: {
    textEntry?: { text: string; hhmm: string | null }
    trackerEntries: Array<{ configId: string; value: TrackerValue; hhmm: string }>
  }]
  close: []
}>()

const { t, locale } = useI18n()

interface PendingRow {
  id: string
  configId: string
  label: string
  color: string
  value: TrackerValue
  hhmm: string
}

const text = ref('')
const textTime = ref<string | null>(null)
const pendingRows = ref<PendingRow[]>([])
const innerModalConfig = ref<TrackerConfig | null>(null)
const showTrackerPicker = ref(false)

function resetState() {
  text.value = ''
  textTime.value = null
  pendingRows.value = []
  innerModalConfig.value = null
  showTrackerPicker.value = false
}

watch(() => props.open, (val) => {
  if (!val) {
    resetState()
    document.removeEventListener('keydown', onKeyDown)
  } else {
    document.addEventListener('keydown', onKeyDown)
  }
})

function onKeyDown(e: KeyboardEvent) {
  if (e.key === 'Escape') emit('close')
}

function addPendingRow(config: TrackerConfig, value: TrackerValue, hhmm: string) {
  pendingRows.value.push({
    id: crypto.randomUUID(),
    configId: config.id,
    label: config.label,
    color: config.color,
    value,
    hhmm,
  })
  innerModalConfig.value = null
}

function removePendingRow(id: string) {
  pendingRows.value = pendingRows.value.filter(r => r.id !== id)
}

function openTrackerPicker() {
  showTrackerPicker.value = !showTrackerPicker.value
}

function selectTracker(config: TrackerConfig) {
  showTrackerPicker.value = false
  innerModalConfig.value = config
}

function handleSave() {
  emit('save', {
    textEntry: text.value.trim()
      ? { text: text.value.trim(), hhmm: textTime.value }
      : undefined,
    trackerEntries: pendingRows.value,
  })
}

function valueSummary(value: TrackerValue): string {
  if (value === null || value === undefined) return '—'
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (typeof value === 'number') return String(value)
  if (typeof value === 'string') return value.length > 24 ? value.slice(0, 24) + '…' : value
  if (Array.isArray(value)) return value.join(', ')
  if (typeof value === 'object' && 'amount' in value) {
    const med = value as MedicationValue
    return `${med.amount} ${med.unit}`
  }
  return '—'
}

const formattedDate = computed(() => {
  if (!props.date) return ''
  const [y, m, d] = props.date.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString(locale.value, { month: 'long', day: 'numeric' })
})
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-200"
      leave-active-class="transition-opacity duration-200"
      enter-from-class="opacity-0"
      leave-to-class="opacity-0"
    >
      <div
        v-if="open"
        class="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
        @click.self="emit('close')"
      >
        <Transition
          enter-active-class="transition-all duration-200"
          leave-active-class="transition-all duration-150"
          enter-from-class="opacity-0 scale-95"
          leave-to-class="opacity-0 scale-95"
          appear
        >
          <div
            v-if="open"
            class="bg-raised border border-edge rounded-card shadow-elevated w-full max-w-sm p-5 space-y-4 max-h-[85vh] overflow-y-auto"
            role="dialog"
            aria-modal="true"
          >
            <!-- Header -->
            <h3 class="text-sm font-semibold text-ink">
              {{ t('diary.enterDayTitle') }}
              <span class="font-normal text-ink-muted ml-1">— {{ formattedDate }}</span>
            </h3>

            <!-- Text entry section -->
            <div class="space-y-2">
              <label class="text-xs font-semibold text-ink-muted uppercase tracking-wider">
                {{ t('diary.textEntry') }}
              </label>
              <textarea
                v-model="text"
                rows="4"
                :placeholder="t('diary.newEntryPlaceholder')"
                class="w-full text-[14px] leading-[1.6] text-ink bg-subtle border border-edge rounded-input px-3 py-2 placeholder:text-ink-faint resize-none focus:outline-none focus:ring-2 focus:ring-accent/25"
              />
              <div class="flex items-center gap-2">
                <label class="text-xs text-ink-muted shrink-0">{{ t('diary.timeLabel') }}</label>
                <input
                  type="time"
                  v-model="textTime"
                  :placeholder="t('diary.timeNow')"
                  class="text-sm text-ink bg-subtle border border-edge rounded-input px-2 py-1 focus:outline-none focus:ring-2 focus:ring-accent/25"
                />
              </div>
            </div>

            <!-- Tracker entries section -->
            <div v-if="trackerConfigs.length > 0" class="space-y-2">
              <label class="text-xs font-semibold text-ink-muted uppercase tracking-wider">
                {{ t('diary.trackerEntries') }}
              </label>

              <!-- Pending rows -->
              <div v-if="pendingRows.length > 0" class="space-y-1.5">
                <div
                  v-for="row in pendingRows"
                  :key="row.id"
                  class="flex items-center gap-2 rounded-input bg-subtle px-2 py-1.5"
                >
                  <span
                    class="w-2 h-2 rounded-full shrink-0"
                    :style="{ backgroundColor: row.color }"
                  />
                  <span class="text-xs font-semibold text-ink shrink-0">{{ row.label }}</span>
                  <span class="text-xs text-ink-muted flex-1 truncate">{{ valueSummary(row.value) }}</span>
                  <span class="text-xs text-ink-faint tabular-nums shrink-0">{{ row.hhmm }}</span>
                  <button
                    @click="removePendingRow(row.id)"
                    class="text-ink-faint hover:text-danger transition-colors shrink-0"
                    aria-label="Remove"
                  >
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                      <line x1="2" y1="2" x2="10" y2="10"/>
                      <line x1="10" y1="2" x2="2" y2="10"/>
                    </svg>
                  </button>
                </div>
              </div>

              <!-- Add tracker button + picker -->
              <div>
                <button
                  @click="openTrackerPicker"
                  class="text-sm text-accent hover:text-accent-dim transition-colors"
                >{{ t('diary.addTrackerEntry') }}</button>

                <div v-if="showTrackerPicker" class="flex flex-wrap gap-1.5 mt-2">
                  <button
                    v-for="config in trackerConfigs"
                    :key="config.id"
                    @click="selectTracker(config)"
                    class="text-xs font-semibold px-2.5 py-1 rounded-full text-white transition-opacity hover:opacity-80"
                    :style="{ backgroundColor: config.color }"
                  >{{ config.label }}</button>
                </div>
              </div>
            </div>

            <!-- Actions -->
            <div class="flex gap-2 justify-end pt-1">
              <button
                @click="emit('close')"
                class="text-sm px-3 py-1.5 rounded-input text-ink-muted hover:text-ink hover:bg-subtle transition-colors"
              >{{ t('diary.cancel') }}</button>
              <button
                @click="handleSave"
                :disabled="!text.trim() && pendingRows.length === 0"
                class="text-sm px-3 py-1.5 rounded-input bg-accent text-on-accent hover:bg-accent-dim transition-colors disabled:opacity-40"
              >{{ t('diary.saveAll') }}</button>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>

  <!-- Inner tracker entry modal -->
  <EntryModal
    :open="innerModalConfig !== null"
    :config="innerModalConfig"
    :initial-value="null"
    :is-edit="false"
    @save="(value, hhmm) => innerModalConfig && addPendingRow(innerModalConfig, value, hhmm)"
    @close="innerModalConfig = null"
    @delete="innerModalConfig = null"
  />
</template>
