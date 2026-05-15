<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import type { DiaryEntry, DiaryTimelineEntry, DiaryDataEntry, TrackerConfig, TrackerValue } from '@/types'
import { useDiaryStore } from '@/stores/diary'
import { useTrackersStore } from '@/stores/trackers'
import { useToastStore } from '@/stores/toast'
import { useAppSettingsStore } from '@/stores/appSettings'
import ConfirmModal from '@/components/ui/ConfirmModal.vue'
import EntryModal from '@/components/diary/EntryModal.vue'
import EntryValue from '@/components/diary/EntryValue.vue'

const { t, locale } = useI18n()
const route = useRoute()
const router = useRouter()
const diary = useDiaryStore()
const trackers = useTrackersStore()
const toast = useToastStore()
const appSettings = useAppSettingsStore()

const date = computed(() => route.params.date as string)
const timelineEntries = ref<DiaryTimelineEntry[]>([])
const dataEntries = ref<DiaryDataEntry[]>([])
const saving = ref(false)
const editingId = ref<string | null>(null)
const showAddMenu = ref(false)
const menuAnimated = ref(false)
let closeTimer: ReturnType<typeof setTimeout> | null = null

// Deletion confirmation state
const pendingDeleteId = ref<string | null>(null)
const pendingDeleteDataId = ref<string | null>(null)

// Data point entry modal state
const entryModalConfig = ref<TrackerConfig | null>(null)
const entryModalValue = ref<TrackerValue>(null)
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
  value: TrackerValue
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

// ─── Period dividers ──────────────────────────────────────────────────────────

type Period = 'lateNight' | 'morning' | 'afternoon' | 'evening'

interface PeriodDivider {
  type: 'divider'
  period: Period
  id: string
}

type DisplayItem = TimelineItem | PeriodDivider

function getPeriod(iso: string): Period {
  const h = new Date(iso).getHours()
  if (h < 5) return 'lateNight'
  if (h < 12) return 'morning'
  if (h < 18) return 'afternoon'
  return 'evening'
}

const timelineWithDividers = computed<DisplayItem[]>(() => {
  const result: DisplayItem[] = []
  const seen = new Set<Period>()
  for (const item of allTimelineItems.value) {
    const p = getPeriod(item.createdAt)
    if (!seen.has(p)) {
      seen.add(p)
      result.push({ type: 'divider', period: p, id: `divider-${p}` })
    }
    result.push(item)
  }
  return result
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
  closeMenu()
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

function openDataPointModal(config: TrackerConfig) {
  const existing = dataEntries.value.filter(e => e.configId === config.id).at(-1)
  entryModalConfig.value = config
  entryModalValue.value = existing?.value ?? null
  entryModalEditId.value = existing?.id ?? null
  closeMenu()
}

function saveDataEntry(value: TrackerValue) {
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
  editingId.value = null
  const config = trackers.configs.find(c => c.id === item.configId)
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

// ─── Unified edit/delete dispatch ────────────────────────────────────────────

function handleEdit(item: TimelineItem) {
  if (item.type === 'text') startEdit(item.id)
  else editDataEntry(item as DataTimelineItem)
}

function handleRowClick(item: TimelineItem) {
  if (item.type === 'text' && editingId.value === item.id) return
  handleEdit(item)
}

function handleDeleteFromModal() {
  const id = entryModalEditId.value
  if (!id) return
  closeDataModal()
  pendingDeleteDataId.value = id
}

// ─── Radial add menu ──────────────────────────────────────────────────────────

function openMenu() {
  if (closeTimer) { clearTimeout(closeTimer); closeTimer = null }
  showAddMenu.value = true
  // One rAF delay so the container renders with the closed state first, enabling CSS transitions
  requestAnimationFrame(() => { menuAnimated.value = true })
}

function closeMenu() {
  menuAnimated.value = false
  // item 0 is last to close: (n-1)*18ms stagger + 160ms transition
  const totalMs = (menuItems.value.length - 1) * 18 + 180
  closeTimer = setTimeout(() => {
    showAddMenu.value = false
    closeTimer = null
  }, totalMs)
}

const RADIAL_CIRCLE_MAX = 10
const RADIAL_R = 96
const OVERFLOW_ROW_Y = 148
const OVERFLOW_ROW_STEP = 56

const menuItems = computed(() => [
  { id: '__text__', label: t('diary.addText'), icon: '✎', color: '', action: addEntry },
  ...trackers.configs.map(c => ({
    id: c.id,
    label: c.label,
    icon: appSettings.settings.useEmojis ? c.icon : c.label[0].toUpperCase(),
    color: c.color,
    action: () => openDataPointModal(c),
  })),
])

function radialItemStyle(index: number, bgColor: string): Record<string, string> {
  const open = menuAnimated.value
  const totalInCircle = Math.min(menuItems.value.length, RADIAL_CIRCLE_MAX)
  let dx: number, dy: number

  if (index < RADIAL_CIRCLE_MAX) {
    const step = (2 * Math.PI) / totalInCircle
    const angle = -Math.PI / 2 + index * step
    dx = Math.round(Math.cos(angle) * RADIAL_R)
    dy = Math.round(Math.sin(angle) * RADIAL_R)
  } else {
    const rowIndex = index - RADIAL_CIRCLE_MAX
    const rowCount = menuItems.value.length - RADIAL_CIRCLE_MAX
    const totalWidth = (rowCount - 1) * OVERFLOW_ROW_STEP
    dx = Math.round(-totalWidth / 2 + rowIndex * OVERFLOW_ROW_STEP)
    dy = OVERFLOW_ROW_Y
  }

  const n = menuItems.value.length
  const style: Record<string, string> = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: open
      ? `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(1)`
      : `translate(-50%, -50%) scale(0.3)`,
    opacity: open ? '1' : '0',
    transition: open
      ? 'transform 240ms cubic-bezier(0.34, 1.56, 0.64, 1), opacity 200ms ease'
      : 'transform 160ms ease-in, opacity 120ms ease',
    transitionDelay: open ? `${index * 30}ms` : `${(n - 1 - index) * 18}ms`,
    pointerEvents: open ? 'auto' : 'none',
    zIndex: '10',
  }
  if (bgColor) style.backgroundColor = bgColor
  return style
}

// ─── Navigation ───────────────────────────────────────────────────────────────

const today = computed(() => new Date().toISOString().slice(0, 10))

function offsetDate(base: string, days: number): string {
  const [y, m, d] = base.split('-').map(Number)
  const result = new Date(y, m - 1, d + days)
  const yyyy = result.getFullYear()
  const mm = String(result.getMonth() + 1).padStart(2, '0')
  const dd = String(result.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

const prevDate = computed(() => offsetDate(date.value, -1))
const nextDate = computed(() => offsetDate(date.value, +1))

function navigateDay(dir: 'prev' | 'next') {
  router.push(`/diary/${dir === 'prev' ? prevDate.value : nextDate.value}`)
}

// ─── Header date formatting ───────────────────────────────────────────────────

const headerWeekday = computed(() => {
  if (!date.value) return ''
  const [y, m, d] = date.value.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString(locale.value, { weekday: 'long' })
})

const headerDate = computed(() => {
  if (!date.value) return ''
  const [y, m, d] = date.value.split('-').map(Number)
  const opts: Intl.DateTimeFormatOptions = y === new Date().getFullYear()
    ? { month: 'long', day: 'numeric' }
    : { month: 'long', day: 'numeric', year: 'numeric' }
  return new Date(y, m - 1, d).toLocaleDateString(locale.value, opts)
})

// ─── 24-hour detection ────────────────────────────────────────────────────────

const is24Hour = computed(() => {
  const f = new Intl.DateTimeFormat(locale.value, { hour: 'numeric' }).format(new Date(2000, 0, 1, 13))
  return !/[ap]m/i.test(f)
})

// ─── Summary chips ────────────────────────────────────────────────────────────

const hasSummary = computed(() => allTimelineItems.value.length > 0)

// ─── Time formatting helpers ──────────────────────────────────────────────────

function formatHourMin(iso: string): string {
  return new Date(iso).toLocaleTimeString(locale.value, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: !is24Hour.value,
  }).replace(/ ?[AP]M$/i, '')
}

function formatAmPm(iso: string): string {
  return new Date(iso).getHours() < 12 ? 'am' : 'pm'
}

// ─── Bubble helpers ───────────────────────────────────────────────────────────

function bubbleStyle(item: TimelineItem): Record<string, string> {
  if (item.type === 'text') return {}
  const config = trackers.configs.find(c => c.id === (item as DataTimelineItem).configId)
  if (!config) return {}
  return { backgroundColor: config.color, color: 'white' }
}

function bubbleContent(item: TimelineItem): string {
  if (item.type === 'text') return '✎'
  const config = trackers.configs.find(c => c.id === (item as DataTimelineItem).configId)
  if (!config) return '?'
  return appSettings.settings.useEmojis ? config.icon : config.label[0].toUpperCase()
}

function eyebrowLabel(item: TimelineItem): string {
  if (item.type === 'text') return t('diary.noteLabel')
  return trackers.configs.find(c => c.id === (item as DataTimelineItem).configId)?.label ?? ''
}

function eyebrowStyle(item: TimelineItem): Record<string, string> {
  if (item.type === 'text') return { color: 'var(--color-ink-muted)' }
  const config = trackers.configs.find(c => c.id === (item as DataTimelineItem).configId)
  return config ? { color: config.color } : {}
}

function periodLabel(period: string): string {
  const key = `diary.period.${period}`
  return t(key)
}

function asDivider(item: DisplayItem): PeriodDivider {
  return item as PeriodDivider
}

function asTimelineItem(item: DisplayItem): TimelineItem {
  return item as TimelineItem
}

function asTextItem(item: DisplayItem): TextTimelineItem {
  return item as TextTimelineItem
}

function asDataItem(item: DisplayItem): DataTimelineItem {
  return item as DataTimelineItem
}
</script>

<template>
  <div>
    <!-- Day header -->
    <div class="grid grid-cols-[32px_1fr_32px] gap-2.5 items-center pb-4 border-b border-edge">
      <!-- Prev day -->
      <button
        @click="navigateDay('prev')"
        :aria-label="t('diary.prevDay')"
        class="w-8 h-8 rounded-full flex items-center justify-center text-ink-muted hover:bg-subtle hover:text-ink transition-colors"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <path d="M10 12L6 8l4-4"/>
        </svg>
      </button>

      <!-- Date center block -->
      <div class="text-center">
        <div class="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-muted">{{ headerWeekday }}</div>
        <div class="text-[24px] font-semibold leading-[1.1] tracking-[-0.02em] text-ink">{{ headerDate }}</div>
        <div v-if="hasSummary" class="text-[11.5px] text-ink-muted mt-1">
          <b class="text-ink">{{ allTimelineItems.length }}</b> {{ allTimelineItems.length === 1 ? 'entry' : 'entries' }}
        </div>
      </div>

      <!-- Next day -->
      <button
        @click="navigateDay('next')"
        :aria-label="t('diary.nextDay')"
        class="w-8 h-8 rounded-full flex items-center justify-center text-ink-muted hover:bg-subtle hover:text-ink transition-colors"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <path d="M6 4l4 4-4 4"/>
        </svg>
      </button>
    </div>

    <!-- Timeline -->
    <div
      class="timeline relative pt-6"
      :class="{ 'timeline--dimmed': showAddMenu }"
    >
      <TransitionGroup name="timeline" tag="div">
        <template v-for="item in timelineWithDividers" :key="item.id">

          <!-- Period divider -->
          <div
            v-if="asDivider(item).type === 'divider'"
            role="presentation"
            class="grid grid-cols-[52px_1fr] gap-3 items-center mb-3 mt-0.5"
          >
            <span class="flex justify-center">
              <span
                class="block w-1.5 h-1.5 rounded-full bg-edge-strong"
                style="box-shadow: 0 0 0 4px var(--color-surface)"
              />
            </span>
            <span class="text-[10px] uppercase tracking-[0.16em] font-semibold text-ink-faint">
              {{ periodLabel(asDivider(item).period) }}
            </span>
          </div>

          <!-- Entry row -->
          <div
            v-else
            class="grid grid-cols-[52px_1fr] gap-3 mb-5 cursor-pointer"
            @click="handleRowClick(item as TimelineItem)"
          >
            <!-- Gutter: bubble + time chip -->
            <div class="flex flex-col items-center">
              <div
                aria-hidden="true"
                class="w-9 h-9 rounded-full inline-flex items-center justify-center leading-none select-none"
                :class="[
                  (item as TimelineItem).type === 'text'
                    ? 'bg-surface text-ink-muted border-[1.5px] border-edge-strong text-[14px]'
                    : (appSettings.settings.useEmojis ? 'text-xl' : 'text-[12px] font-bold')
                ]"
                :style="[
                  { boxShadow: '0 0 0 4px var(--color-surface), 0 1px 3px rgba(0,0,0,.06)' },
                  bubbleStyle(item as TimelineItem)
                ]"
              >{{ bubbleContent(item as TimelineItem) }}</div>
              <time
                :datetime="(item as TimelineItem).createdAt"
                class="mt-1.5 text-center text-[10.5px] leading-[1.15] tabular-nums bg-surface px-[3px] rounded-[4px]"
              >
                <span class="block text-ink-muted font-semibold">{{ formatHourMin((item as TimelineItem).createdAt) }}</span>
                <span v-if="!is24Hour" class="block text-[9px] uppercase tracking-[0.08em] text-ink-faint">
                  {{ formatAmPm((item as TimelineItem).createdAt) }}
                </span>
              </time>
            </div>

            <!-- Card: no border, no background -->
            <div class="pt-1 min-w-0">
              <!-- Eyebrow row -->
              <div class="flex items-center gap-2 mb-1">
                <span
                  class="text-[10.5px] font-semibold uppercase tracking-[0.08em]"
                  :style="eyebrowStyle(item as TimelineItem)"
                >{{ eyebrowLabel(item as TimelineItem) }}</span>
              </div>

              <!-- Text entry content -->
              <template v-if="(item as TimelineItem).type === 'text'">
                <p
                  v-if="editingId !== (item as TextTimelineItem).id"
                  class="text-[14.5px] leading-[1.6] text-ink whitespace-pre-wrap break-words min-h-5"
                >{{ (item as TextTimelineItem).text || '…' }}</p>
                <textarea
                  v-else
                  :ref="(el: unknown) => el && nextTick(() => (el as HTMLTextAreaElement).focus())"
                  :value="(item as TextTimelineItem).text"
                  @click.stop
                  @input="updateEntryText((item as TextTimelineItem).id, ($event.target as HTMLTextAreaElement).value)"
                  @blur="confirmEdit"
                  @keydown.escape="confirmEdit"
                  rows="3"
                  :placeholder="t('diary.newEntryPlaceholder')"
                  class="w-full text-[14.5px] leading-[1.6] text-ink bg-transparent placeholder:text-ink-faint resize-none focus:outline-none focus:ring-2 focus:ring-accent/25 rounded-sm"
                />
                <div
                  v-if="editingId === (item as TextTimelineItem).id"
                  class="flex gap-1.5 mt-1.5 justify-end"
                  @click.stop
                >
                  <button
                    @click.stop="requestDeleteEntry((item as TextTimelineItem).id)"
                    class="text-xs text-danger px-2 py-1 rounded-input hover:bg-subtle transition-colors"
                  >{{ t('diary.deleteEntry') }}</button>
                  <button
                    @click.stop="confirmEdit()"
                    class="text-xs text-accent px-2 py-1 rounded-input hover:bg-accent-tint transition-colors"
                  >{{ t('diary.done') }}</button>
                </div>
              </template>

              <!-- Data entry value -->
              <EntryValue
                v-else
                :config="trackers.configs.find(c => c.id === (item as DataTimelineItem).configId)"
                :value="(item as DataTimelineItem).value"
                :use-emojis="appSettings.settings.useEmojis"
              />
            </div>
          </div>

        </template>
      </TransitionGroup>

      <!-- Empty state -->
      <p v-if="!allTimelineItems.length" class="mt-4 text-sm text-ink-faint text-center">
        {{ t('diary.noEntries') }}
      </p>

      <!-- Add zone -->
      <div v-if="!showAddMenu" class="mt-1 w-[52px] flex justify-center">
        <button
          @click="openMenu()"
          :disabled="saving"
          :aria-label="t('diary.addEntry')"
          class="w-10 h-10 rounded-full bg-accent text-on-accent flex items-center justify-center hover:bg-accent-dim disabled:opacity-50 transition-colors"
          style="box-shadow: 0 6px 16px rgba(79,70,229,.35), 0 0 0 5px var(--color-surface)"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
            <line x1="9" y1="2" x2="9" y2="16"/>
            <line x1="2" y1="9" x2="16" y2="9"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- Radial backdrop (full-viewport click catcher) -->
    <div
      v-if="showAddMenu"
      class="fixed inset-0 z-[9]"
      @click="closeMenu()"
      aria-hidden="true"
    />

    <!-- Radial menu (fixed, centered in viewport) -->
    <div
      v-if="showAddMenu"
      class="fixed z-10 w-0 h-0"
      style="left: 50%; top: 50%; transform: translate(-50%, -50%)"
    >
      <!-- Radial items -->
      <button
        v-for="(menuItem, i) in menuItems"
        :key="menuItem.id"
        :disabled="saving"
        :aria-label="menuItem.label"
        :style="[
          radialItemStyle(i, menuItem.id === '__text__' ? '' : menuItem.color),
          menuItem.id !== '__text__' && !appSettings.settings.useEmojis
            ? { color: 'white', fontSize: '0.75rem', fontWeight: '700' }
            : {},
        ]"
        @click="menuItem.action()"
        class="w-12 h-12 rounded-full flex items-center justify-center text-xl leading-none shadow-card disabled:opacity-50"
        :class="menuItem.id === '__text__' ? 'bg-accent text-on-accent hover:bg-accent-dim' : 'hover:opacity-80'"
      >{{ menuItem.icon }}</button>

      <!-- Close button at center -->
      <button
        @click="closeMenu()"
        :aria-label="t('diary.closeAddMenu')"
        class="w-14 h-14 rounded-full bg-accent text-on-accent flex items-center justify-center hover:bg-accent-dim shadow-card z-20 radial-x-btn"
        style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%)"
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
          <line x1="3" y1="3" x2="15" y2="15"/>
          <line x1="15" y1="3" x2="3" y2="15"/>
        </svg>
      </button>
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
      @delete="handleDeleteFromModal"
    />
  </div>
</template>

<style scoped>
/* Rope: left rail at x=25px, fades at both ends */
.timeline {
  isolation: isolate;
}

.timeline::before {
  content: "";
  position: absolute;
  left: 25px;
  top: 30px;
  bottom: 56px;
  width: 2px;
  background: linear-gradient(
    180deg,
    transparent 0,
    var(--color-edge) 12px,
    var(--color-edge) calc(100% - 14px),
    transparent 100%
  );
  pointer-events: none;
  z-index: -1;
}

/* Dim timeline when radial menu is open */
.timeline--dimmed {
  opacity: 0.35;
  pointer-events: none;
}

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

/* Close button: spin + scale in */
@keyframes radial-x-in {
  from {
    opacity: 0;
    transform: translate(-50%, -50%) rotate(-120deg) scale(0.2);
  }
  to {
    opacity: 1;
    transform: translate(-50%, -50%) rotate(0deg) scale(1);
  }
}

.radial-x-btn {
  animation: radial-x-in 320ms cubic-bezier(0.34, 1.56, 0.64, 1) both;
}
</style>
