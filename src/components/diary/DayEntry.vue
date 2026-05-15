<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import type { DiaryEntry, DiaryTimelineEntry, DiaryDataEntry, DataPointConfig, DataPointValue, MedicationValue } from '@/types'
import { useDiaryStore } from '@/stores/diary'
import { useDataPointsStore } from '@/stores/datapoints'
import { useToastStore } from '@/stores/toast'
import { useAppSettingsStore } from '@/stores/appSettings'
import ConfirmModal from '@/components/ui/ConfirmModal.vue'
import EntryModal from '@/components/diary/EntryModal.vue'
import DataPointIcon from '@/components/ui/DataPointIcon.vue'

const { t, locale } = useI18n()
const route = useRoute()
const router = useRouter()
const diary = useDiaryStore()
const datapoints = useDataPointsStore()
const toast = useToastStore()
const appSettings = useAppSettingsStore()

const date = computed(() => route.params.date as string)
const timelineEntries = ref<DiaryTimelineEntry[]>([])
const dataEntries = ref<DiaryDataEntry[]>([])
const saving = ref(false)
const editingId = ref<string | null>(null)
const showAddMenu = ref(false)

// Deletion confirmation state
const pendingDeleteId = ref<string | null>(null)
const pendingDeleteDataId = ref<string | null>(null)

// Data point entry modal state
const entryModalConfig = ref<DataPointConfig | null>(null)
const entryModalValue = ref<DataPointValue>(null)
const entryModalEditId = ref<string | null>(null)

// ─── Unified timeline ────────────────────────────────────────────────────────

interface TextTimelineItem {
  type: 'text'
  id: string
  text: string
  createdAt: string
}

interface DataTimelineItem {
  type: 'data'
  id: string
  configId: string
  value: DataPointValue
  createdAt: string
}

type TimelineItem = TextTimelineItem | DataTimelineItem

const allTimelineItems = computed<TimelineItem[]>(() => {
  const textItems: TextTimelineItem[] = timelineEntries.value.map(e => ({
    type: 'text',
    id: e.id,
    text: e.text,
    createdAt: e.createdAt,
  }))
  const dataItems: DataTimelineItem[] = dataEntries.value.map(e => ({
    type: 'data',
    id: e.id,
    configId: e.configId,
    value: e.value,
    createdAt: e.createdAt,
  }))
  return [...textItems, ...dataItems].sort((a, b) => a.createdAt.localeCompare(b.createdAt))
})

// ─── Load / migrate ──────────────────────────────────────────────────────────

function load() {
  const entry = diary.getEntry(date.value)
  if (!entry) {
    timelineEntries.value = []
    dataEntries.value = []
    return
  }

  // Migrate legacy text field
  const hasLegacyText = entry.text && (!entry.entries || entry.entries.length === 0)
  timelineEntries.value = hasLegacyText
    ? [{ id: crypto.randomUUID(), text: entry.text, createdAt: entry.updatedAt }]
    : (entry.entries ? [...entry.entries] : [])

  // Migrate legacy dataValues → dataEntries
  if (!entry.dataEntries || entry.dataEntries.length === 0) {
    const vals = entry.dataValues ?? {}
    if (Object.keys(vals).length > 0) {
      dataEntries.value = Object.entries(vals).map(([configId, value]) => ({
        id: crypto.randomUUID(),
        configId,
        value,
        createdAt: entry.updatedAt,
      }))
      autoSave()
      return
    }
    dataEntries.value = []
  } else {
    dataEntries.value = [...entry.dataEntries]
  }

  if (hasLegacyText) {
    autoSave()
  }
}

onMounted(load)
watch(date, load)
watch(() => diary.entries.get(date.value), (entry) => { if (entry !== undefined) load() })

// ─── Persistence ─────────────────────────────────────────────────────────────

async function autoSave(silent = false) {
  saving.value = true
  const entry: DiaryEntry = {
    date: date.value,
    text: '',
    entries: timelineEntries.value,
    dataEntries: dataEntries.value,
    dataValues: {},
    updatedAt: new Date().toISOString(),
  }
  await diary.saveEntry(entry)
  saving.value = false
  if (!silent) toast.show(t('diary.entrySaved'))
}

// ─── Text entries ─────────────────────────────────────────────────────────────

function addEntry() {
  const newEntry: DiaryTimelineEntry = {
    id: crypto.randomUUID(),
    text: '',
    createdAt: new Date().toISOString(),
  }
  timelineEntries.value = [...timelineEntries.value, newEntry]
  editingId.value = newEntry.id
  showAddMenu.value = false
  autoSave(true)
}

function startEdit(id: string) {
  if (editingId.value && editingId.value !== id) autoSave(true)
  editingId.value = id
}

function updateEntryText(id: string, text: string) {
  timelineEntries.value = timelineEntries.value.map(e =>
    e.id === id ? { ...e, text } : e
  )
}

function confirmEdit() {
  if (editingId.value === null) return
  editingId.value = null
  autoSave()
}

function requestDeleteEntry(id: string) {
  pendingDeleteId.value = id
}

function confirmDeleteEntry() {
  const id = pendingDeleteId.value
  if (!id) return
  timelineEntries.value = timelineEntries.value.filter(e => e.id !== id)
  if (editingId.value === id) editingId.value = null
  pendingDeleteId.value = null
  autoSave()
}

// ─── Data point entries ───────────────────────────────────────────────────────

function openDataPointModal(config: DataPointConfig) {
  const existing = dataEntries.value.filter(e => e.configId === config.id).at(-1)
  entryModalConfig.value = config
  entryModalValue.value = existing?.value ?? null
  entryModalEditId.value = existing?.id ?? null
  showAddMenu.value = false
}

function saveDataEntry(value: DataPointValue) {
  const config = entryModalConfig.value
  if (!config) return
  const editId = entryModalEditId.value
  if (editId) {
    dataEntries.value = dataEntries.value.map(e =>
      e.id === editId ? { ...e, value } : e
    )
  } else {
    dataEntries.value = [...dataEntries.value, {
      id: crypto.randomUUID(),
      configId: config.id,
      value,
      createdAt: new Date().toISOString(),
    }]
  }
  closeDataModal()
  autoSave()
}

function closeDataModal() {
  entryModalConfig.value = null
  entryModalValue.value = null
  entryModalEditId.value = null
}

function editDataEntry(item: DataTimelineItem) {
  const config = datapoints.configs.find(c => c.id === item.configId)
  if (!config) return
  entryModalConfig.value = config
  entryModalValue.value = item.value
  entryModalEditId.value = item.id
}

function requestDeleteDataEntry(id: string) {
  pendingDeleteDataId.value = id
}

function confirmDeleteDataEntry() {
  const id = pendingDeleteDataId.value
  if (!id) return
  dataEntries.value = dataEntries.value.filter(e => e.id !== id)
  pendingDeleteDataId.value = null
  autoSave()
}

// ─── Radial add menu ──────────────────────────────────────────────────────────

const RADIAL_STEP = Math.PI / 5        // 36° between items
const RADIAL_MAX_ROW1 = 6              // items before second ring kicks in
const RADIAL_R1 = 88                   // px — inner ring radius
const RADIAL_R2 = 150                  // px — outer ring radius

const menuItems = computed(() => [
  { id: '__text__', label: t('diary.addText'), icon: '✎', color: '', action: addEntry },
  ...datapoints.configs.map(c => ({
    id: c.id,
    label: c.label,
    icon: appSettings.settings.useEmojis ? c.icon : c.label[0].toUpperCase(),
    color: c.color,
    action: () => openDataPointModal(c),
  })),
])

function radialItemStyle(index: number, bgColor: string): Record<string, string> {
  const row = index < RADIAL_MAX_ROW1 ? 0 : 1
  const indexInRow = index % RADIAL_MAX_ROW1
  const countInRow = row === 0
    ? Math.min(menuItems.value.length, RADIAL_MAX_ROW1)
    : menuItems.value.length - RADIAL_MAX_ROW1
  const radius = row === 0 ? RADIAL_R1 : RADIAL_R2

  // Start at 12 o'clock (−π/2), fan clockwise (right side only)
  const angle = -Math.PI / 2 + indexInRow * RADIAL_STEP

  const dx = Math.round(Math.cos(angle) * radius)
  const dy = Math.round(Math.sin(angle) * radius)
  const open = showAddMenu.value
  const style: Record<string, string> = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: open
      ? `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(1)`
      : `translate(-50%, -50%) scale(0.3)`,
    opacity: open ? '1' : '0',
    transition: 'transform 240ms cubic-bezier(0.34, 1.56, 0.64, 1), opacity 200ms ease',
    transitionDelay: open ? `${index * 30}ms` : '0ms',
    pointerEvents: open ? 'auto' : 'none',
    zIndex: '10',
  }
  if (bgColor) style.backgroundColor = bgColor
  return style
}

// ─── Value display ────────────────────────────────────────────────────────────

function formatDataValue(item: DataTimelineItem): string {
  const config = datapoints.configs.find(c => c.id === item.configId)
  if (!config || item.value === null) return '—'
  const v = item.value
  switch (config.type) {
    case 'range': return String(v)
    case 'string': return typeof v === 'string' ? v : '—'
    case 'multi-string': return Array.isArray(v) ? (v as string[]).join(', ') : '—'
    case 'boolean': {
      const bc = config.config as { trueLabel: string; falseLabel: string }
      return v === true ? bc.trueLabel : bc.falseLabel
    }
    case 'medication': {
      if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
        const mv = v as MedicationValue
        return `${mv.amount} ${mv.unit} · ${mv.time}`
      }
      return '—'
    }
    default: return '—'
  }
}

// ─── Display helpers ──────────────────────────────────────────────────────────

const displayDate = computed(() => {
  if (!date.value) return ''
  const [y, m, d] = date.value.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString(locale.value, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
})
</script>

<template>
  <div class="space-y-5">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <h2 class="text-lg font-semibold text-ink">{{ displayDate }}</h2>
      <button
        @click="router.push('/diary')"
        class="text-sm text-ink-muted hover:text-ink transition-colors px-2 py-1 rounded-input hover:bg-subtle"
      >
        {{ t('diary.back') }}
      </button>
    </div>

    <!-- Timeline: centered beads on a continuous rope -->
    <div class="relative flex flex-col items-center pt-6">
      <!-- Continuous rope line — spans from center of first bead to center of + button,
           sits behind everything (z-index below z-10 elements) -->
      <div
        v-if="allTimelineItems.length > 0"
        class="absolute left-1/2 -translate-x-px w-0.5 bg-edge-strong pointer-events-none"
        style="top: 24px; bottom: 28px"
      />

      <TransitionGroup name="timeline" tag="div" class="w-full flex flex-col items-center">
        <div
          v-for="(item, index) in allTimelineItems"
          :key="item.id"
          class="w-full flex flex-col items-center"
        >
          <!-- Gap between beads — rope is visible through here -->
          <div v-if="index > 0" class="h-10" />

          <!-- Text entry -->
          <template v-if="item.type === 'text'">
            <div class="relative w-full">
            <div
              class="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-accent text-on-accent flex items-center justify-center shadow-card select-none"
              :class="appSettings.settings.useEmojis ? 'text-2xl' : 'text-sm font-bold'"
            >{{ appSettings.settings.useEmojis ? '✎' : 'T' }}</div>
            <!-- Entry box — bubble overlaps top border -->
            <div class="relative z-10 w-full bg-raised border border-edge-strong rounded-card px-3 pt-8 pb-3">
              <div class="flex items-start justify-between mb-2">
                <span class="text-sm font-semibold text-ink leading-tight">{{ t('diary.noteLabel') }}</span>
                <div class="flex items-center gap-2 shrink-0 ml-2">
                  <span class="text-xs text-ink-faint">
                    {{ new Date(item.createdAt).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' }) }}
                  </span>
                  <div v-if="editingId !== item.id" class="flex gap-1">
                    <button
                      @click="startEdit(item.id)"
                      class="text-xs text-ink-muted hover:text-ink px-1.5 py-0.5 rounded-input hover:bg-subtle transition-colors"
                    >{{ t('diary.editEntry') }}</button>
                    <button
                      @click="requestDeleteEntry(item.id)"
                      class="text-xs text-danger px-1.5 py-0.5 rounded-input hover:bg-subtle transition-colors"
                    >{{ t('diary.deleteEntry') }}</button>
                  </div>
                  <button
                    v-else
                    @click="confirmEdit"
                    class="text-xs text-accent px-1.5 py-0.5 rounded-input hover:bg-accent-tint transition-colors"
                  >{{ t('diary.done') }}</button>
                </div>
              </div>
              <p
                v-if="editingId !== item.id"
                @dblclick="startEdit(item.id)"
                class="text-sm text-ink whitespace-pre-wrap cursor-text min-h-5"
              >{{ (item as TextTimelineItem).text || '…' }}</p>
              <textarea
                v-else
                :ref="(el: any) => el && nextTick(() => (el as HTMLTextAreaElement).focus())"
                :value="(item as TextTimelineItem).text"
                @input="updateEntryText(item.id, ($event.target as HTMLTextAreaElement).value)"
                @blur="confirmEdit"
                @keydown.escape="confirmEdit"
                rows="3"
                :placeholder="t('diary.newEntryPlaceholder')"
                class="w-full border border-edge rounded-card px-3 py-2 text-sm text-ink bg-raised placeholder:text-ink-faint resize-none focus:outline-none focus:ring-2 focus:ring-accent/25 focus:border-accent transition-colors"
              />
            </div>
            </div>
          </template>

          <!-- Data point entry -->
          <template v-else>
            <div class="relative w-full">
            <div class="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
              <DataPointIcon
                :icon="datapoints.configs.find(c => c.id === (item as DataTimelineItem).configId)?.icon ?? ''"
                :color="datapoints.configs.find(c => c.id === (item as DataTimelineItem).configId)?.color ?? 'var(--color-accent)'"
                :label="datapoints.configs.find(c => c.id === (item as DataTimelineItem).configId)?.label ?? ''"
                size="lg"
                class="shadow-card"
              />
            </div>
            <!-- Entry box — bubble overlaps top border -->
            <div class="relative z-10 w-full bg-raised border border-edge-strong rounded-card px-3 pt-8 pb-3">
              <div class="flex items-start justify-between mb-1">
                <span class="text-sm font-semibold text-ink leading-tight">
                  {{ datapoints.configs.find(c => c.id === (item as DataTimelineItem).configId)?.label }}
                </span>
                <div class="flex items-center gap-2 shrink-0 ml-2">
                  <span class="text-xs text-ink-faint">
                    {{ new Date(item.createdAt).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' }) }}
                  </span>
                  <div class="flex gap-1">
                    <button
                      @click="editDataEntry(item as DataTimelineItem)"
                      class="text-xs text-ink-muted hover:text-ink px-1.5 py-0.5 rounded-input hover:bg-subtle transition-colors"
                    >{{ t('diary.editEntry') }}</button>
                    <button
                      @click="requestDeleteDataEntry(item.id)"
                      class="text-xs text-danger px-1.5 py-0.5 rounded-input hover:bg-subtle transition-colors"
                    >{{ t('diary.deleteEntry') }}</button>
                  </div>
                </div>
              </div>
              <span class="text-sm text-ink">{{ formatDataValue(item as DataTimelineItem) }}</span>
            </div>
            </div>
          </template>
        </div>
      </TransitionGroup>

      <!-- Gap before + button — rope visible here -->
      <div v-if="allTimelineItems.length > 0" class="h-10" />

      <!-- + button bead -->
      <div class="relative z-10 w-14 h-14">
        <button
          @click="showAddMenu = !showAddMenu"
          :disabled="saving"
          :aria-label="showAddMenu ? t('diary.closeAddMenu') : t('diary.addEntry')"
          class="w-14 h-14 rounded-full bg-accent text-on-accent flex items-center justify-center text-3xl leading-none hover:bg-accent-dim disabled:opacity-50 shadow-card"
          :style="{ transform: showAddMenu ? 'rotate(45deg)' : 'rotate(0deg)', transition: 'transform 240ms cubic-bezier(0.34, 1.56, 0.64, 1)' }"
        >+</button>

        <!-- Radial items -->
        <button
          v-for="(menuItem, i) in menuItems"
          :key="menuItem.id"
          :disabled="saving"
          :aria-label="menuItem.label"
          :style="[
            radialItemStyle(i, menuItem.id === '__text__' ? '' : menuItem.color),
            menuItem.id !== '__text__' && !appSettings.settings.useEmojis ? { color: 'white', fontSize: '0.75rem', fontWeight: '700' } : {},
          ]"
          @click="menuItem.action()"
          class="w-12 h-12 rounded-full flex items-center justify-center text-xl leading-none shadow-card disabled:opacity-50"
          :class="menuItem.id === '__text__' ? 'bg-accent text-on-accent hover:bg-accent-dim' : 'hover:opacity-80'"
        >{{ menuItem.icon }}</button>
      </div>

      <!-- Empty-state hint -->
      <p v-if="!allTimelineItems.length" class="mt-4 text-sm text-ink-faint text-center">
        {{ t('diary.noEntries') }}
      </p>
    </div>

    <!-- Confirm delete: text entry -->
    <ConfirmModal
      :open="pendingDeleteId !== null"
      :message="t('diary.deleteConfirm')"
      @confirm="confirmDeleteEntry"
      @cancel="pendingDeleteId = null"
    />

    <!-- Confirm delete: data entry -->
    <ConfirmModal
      :open="pendingDeleteDataId !== null"
      :message="t('diary.deleteConfirm')"
      @confirm="confirmDeleteDataEntry"
      @cancel="pendingDeleteDataId = null"
    />

    <!-- Data point entry modal -->
    <EntryModal
      :open="entryModalConfig !== null"
      :config="entryModalConfig"
      :initial-value="entryModalValue"
      :is-edit="entryModalEditId !== null"
      @save="saveDataEntry"
      @close="closeDataModal"
    />
  </div>
</template>

<style scoped>
.timeline-enter-active {
  transition: opacity 200ms ease, transform 200ms ease;
}
.timeline-leave-active {
  transition: opacity 150ms ease, transform 150ms ease;
}
.timeline-enter-from {
  opacity: 0;
  transform: translateY(8px);
}
.timeline-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
