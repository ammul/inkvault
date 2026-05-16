<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import type { DiaryEntry, DiaryTimelineEntry, DiaryDataEntry, TrackerConfig, TrackerValue } from '@/types'
import { useDiaryStore } from '@/stores/diary'
import { useTrackersStore } from '@/stores/trackers'
import { useToastStore } from '@/stores/toast'
import { useAppSettingsStore } from '@/stores/appSettings'
import { currentHHMM, isoToHHMM, timeToISO } from '@/utils/time'
import ConfirmModal from '@/components/ui/ConfirmModal.vue'
import EntryModal from '@/components/diary/EntryModal.vue'
import EnterDayModal from '@/components/diary/EnterDayModal.vue'
import EntryValue from '@/components/diary/EntryValue.vue'
import TextEntryControls from '@/components/diary/TextEntryControls.vue'
import RadialAddMenu from '@/components/diary/RadialAddMenu.vue'
import DiaryTimelineItem from '@/components/diary/DiaryTimelineItem.vue'

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

// Deletion confirmation state
const pendingDelete = ref<(() => void) | null>(null)

// Data point entry modal state
const entryModalConfig = ref<TrackerConfig | null>(null)
const entryModalValue = ref<TrackerValue>(null)
const entryModalEditId = ref<string | null>(null)
const entryModalTime = ref<string | undefined>(undefined)

// Enter Day modal state
const showEnterDayModal = ref(false)

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

const editingTime = ref('')

function addEntry() {
  editingTime.value = currentHHMM()
  const newEntry: DiaryTimelineEntry = {
    id: crypto.randomUUID(),
    text: '',
    createdAt: timeToISO(date.value, editingTime.value),
  }
  timelineEntries.value = [...timelineEntries.value, newEntry]
  editingId.value = newEntry.id
  autoSave(true)
}

function startEdit(id: string) {
  if (editingId.value && editingId.value !== id) autoSave(true)
  editingId.value = id
  const entry = timelineEntries.value.find(e => e.id === id)
  if (entry) {
    editingTime.value = isoToHHMM(entry.createdAt)
  }
}

function updateEntryText(id: string, text: string) {
  timelineEntries.value = timelineEntries.value.map(e =>
    e.id === id ? { ...e, text } : e
  )
}

function confirmEdit() {
  if (editingId.value === null) return
  const id = editingId.value
  if (editingTime.value) {
    timelineEntries.value = timelineEntries.value.map(e =>
      e.id === id ? { ...e, createdAt: timeToISO(date.value, editingTime.value) } : e
    )
  }
  editingId.value = null
  autoSave()
}

function onTextareaBlur(e: FocusEvent) {
  const rel = e.relatedTarget as HTMLElement | null
  if (rel?.closest?.('[data-edit-controls]')) return
  confirmEdit()
}

function requestDeleteEntry(id: string) {
  pendingDelete.value = () => {
    timelineEntries.value = timelineEntries.value.filter(e => e.id !== id)
    if (editingId.value === id) editingId.value = null
    autoSave()
  }
}

// ─── Data point entries ───────────────────────────────────────────────────────

function openDataPointModal(config: TrackerConfig) {
  entryModalConfig.value = config
  entryModalValue.value = null
  entryModalEditId.value = null
  entryModalTime.value = undefined
}

function saveDataEntry(value: TrackerValue, hhmm: string) {
  const config = entryModalConfig.value
  if (!config) return
  const editId = entryModalEditId.value
  if (editId) {
    dataEntries.value = dataEntries.value.map(e =>
      e.id === editId ? { ...e, value, createdAt: timeToISO(date.value, hhmm) } : e
    )
  } else {
    dataEntries.value = [...dataEntries.value, {
      id: crypto.randomUUID(),
      configId: config.id,
      value,
      createdAt: timeToISO(date.value, hhmm),
    }]
  }
  closeDataModal()
  autoSave()
}

function closeDataModal() {
  entryModalConfig.value = null
  entryModalValue.value = null
  entryModalEditId.value = null
  entryModalTime.value = undefined
}

function editDataEntry(item: DataTimelineItem) {
  editingId.value = null
  const config = trackers.configs.find(c => c.id === item.configId)
  if (!config) return
  entryModalConfig.value = config
  entryModalValue.value = item.value
  entryModalEditId.value = item.id
  entryModalTime.value = isoToHHMM(item.createdAt)
}

function requestDeleteDataEntry(id: string) {
  pendingDelete.value = () => {
    dataEntries.value = dataEntries.value.filter(e => e.id !== id)
    autoSave()
  }
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
  requestDeleteDataEntry(id)
}

// ─── Enter Day modal ─────────────────────────────────────────────────────────

function saveEnterDay(payload: {
  textEntry?: { text: string; hhmm: string | null }
  trackerEntries: Array<{ configId: string; value: TrackerValue; hhmm: string }>
}) {
  if (payload.textEntry?.text?.trim()) {
    const hhmm = payload.textEntry.hhmm || currentHHMM()
    timelineEntries.value = [...timelineEntries.value, {
      id: crypto.randomUUID(),
      text: payload.textEntry.text,
      createdAt: timeToISO(date.value, hhmm),
    }]
  }
  for (const row of payload.trackerEntries) {
    dataEntries.value = [...dataEntries.value, {
      id: crypto.randomUUID(),
      configId: row.configId,
      value: row.value,
      createdAt: timeToISO(date.value, row.hhmm),
    }]
  }
  showEnterDayModal.value = false
  autoSave()
}

// ─── View toggle ──────────────────────────────────────────────────────────────

async function toggleDiaryView(mode: 'timeline' | 'day') {
  appSettings.settings.diaryView = mode
  await appSettings.save()
}

// ─── Radial add menu ──────────────────────────────────────────────────────────

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

// ─── Navigation ───────────────────────────────────────────────────────────────

function navigateDay(dir: 'prev' | 'next') {
  const [y, m, d] = date.value.split('-').map(Number)
  const result = new Date(y, m - 1, dir === 'prev' ? d - 1 : d + 1)
  const target = `${result.getFullYear()}-${String(result.getMonth() + 1).padStart(2, '0')}-${String(result.getDate()).padStart(2, '0')}`
  router.push(`/diary/${target}`)
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

// ─── Summary chips ────────────────────────────────────────────────────────────

const hasSummary = computed(() => allTimelineItems.value.length > 0)
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
        <!-- View toggle pill -->
        <div class="flex justify-center gap-0.5 mt-2">
          <button
            @click="toggleDiaryView('timeline')"
            :class="appSettings.settings.diaryView === 'timeline' ? 'bg-accent text-on-accent' : 'text-ink-muted hover:text-ink hover:bg-subtle'"
            class="text-[10.5px] font-semibold px-2.5 py-0.5 rounded-l-full transition-colors"
          >{{ t('diary.viewToggle.timeline') }}</button>
          <button
            @click="toggleDiaryView('day')"
            :class="appSettings.settings.diaryView === 'day' ? 'bg-accent text-on-accent' : 'text-ink-muted hover:text-ink hover:bg-subtle'"
            class="text-[10.5px] font-semibold px-2.5 py-0.5 rounded-r-full transition-colors"
          >{{ t('diary.viewToggle.day') }}</button>
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

    <!-- Timeline (timeline view) -->
    <div
      v-if="appSettings.settings.diaryView === 'timeline'"
      class="timeline relative pt-6"
      :class="{ 'timeline--dimmed': showAddMenu }"
    >
      <TransitionGroup name="timeline" tag="div">
        <template v-for="item in timelineWithDividers" :key="item.id">

          <!-- Period divider -->
          <div
            v-if="item.type === 'divider'"
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
              {{ t(`diary.period.${(item as PeriodDivider).period}`) }}
            </span>
          </div>

          <!-- Entry row -->
          <DiaryTimelineItem
            v-else
            :item="item as TimelineItem"
            :is-editing="editingId === (item as TimelineItem).id"
            :tracker-config="(item as TimelineItem).type === 'data' ? trackers.configs.find(c => c.id === (item as DataTimelineItem).configId) : undefined"
            v-model:editing-time="editingTime"
            @click="handleRowClick(item as TimelineItem)"
            @update-text="updateEntryText"
            @done="confirmEdit"
            @delete="requestDeleteEntry"
          />

        </template>
      </TransitionGroup>

      <!-- Empty state -->
      <p v-if="!allTimelineItems.length" class="mt-4 text-sm text-ink-faint text-center">
        {{ t('diary.noEntries') }}
      </p>

      <!-- Add zone -->
      <div v-if="!showAddMenu" class="mt-1 flex flex-col items-start gap-2">
        <div class="w-[52px] flex justify-center">
          <button
            @click="showAddMenu = true"
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
        <button
          @click="showEnterDayModal = true"
          class="text-[11.5px] text-ink-muted hover:text-ink underline underline-offset-2 transition-colors pl-1"
        >{{ t('diary.enterDay') }}</button>
      </div>
    </div>

    <!-- Whole-day view -->
    <div v-else class="pt-6 space-y-3">
      <!-- Empty state -->
      <p v-if="!allTimelineItems.length" class="mt-4 text-sm text-ink-faint text-center">
        {{ t('diary.noEntries') }}
      </p>

      <!-- Text entries -->
      <template v-for="entry in timelineEntries" :key="entry.id">
        <div
          class="cursor-pointer rounded-card border border-edge p-3"
          @click="startEdit(entry.id)"
        >
          <div class="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-ink-muted mb-1">{{ t('diary.noteLabel') }}</div>
          <p
            v-if="editingId !== entry.id"
            class="text-[14.5px] leading-[1.6] text-ink whitespace-pre-wrap break-words min-h-5"
          >{{ entry.text || '…' }}</p>
          <template v-else>
            <textarea
              :ref="(el: unknown) => el && nextTick(() => (el as HTMLTextAreaElement).focus())"
              :value="entry.text"
              @click.stop
              @input="updateEntryText(entry.id, ($event.target as HTMLTextAreaElement).value)"
              @blur="onTextareaBlur"
              @keydown.escape="confirmEdit"
              rows="3"
              :placeholder="t('diary.newEntryPlaceholder')"
              class="w-full text-[14.5px] leading-[1.6] text-ink bg-transparent placeholder:text-ink-faint resize-none focus:outline-none focus:ring-2 focus:ring-accent/25 rounded-sm"
            />
            <TextEntryControls
              v-model:time="editingTime"
              :entry-id="entry.id"
              @delete="requestDeleteEntry"
              @done="confirmEdit"
            />
          </template>
        </div>
      </template>

      <!-- Tracker entries -->
      <template v-for="entry in dataEntries" :key="entry.id">
        <div
          class="cursor-pointer rounded-card border border-edge p-3"
          @click="editDataEntry({ type: 'data', id: entry.id, configId: entry.configId, value: entry.value, createdAt: entry.createdAt })"
        >
          <div
            class="text-[10.5px] font-semibold uppercase tracking-[0.08em] mb-1"
            :style="{ color: trackers.configs.find(c => c.id === entry.configId)?.color ?? 'var(--color-ink-muted)' }"
          >{{ trackers.configs.find(c => c.id === entry.configId)?.label ?? '' }}</div>
          <EntryValue
            :config="trackers.configs.find(c => c.id === entry.configId)"
            :value="entry.value"
            :use-emojis="appSettings.settings.useEmojis"
          />
        </div>
      </template>

      <!-- Add button (whole-day mode) -->
      <div class="pt-2 flex justify-center">
        <button
          @click="showEnterDayModal = true"
          :disabled="saving"
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

    <!-- Radial add menu (timeline mode only) -->
    <RadialAddMenu
      v-if="showAddMenu && appSettings.settings.diaryView === 'timeline'"
      v-model="showAddMenu"
      :items="menuItems"
      :disabled="saving"
      :use-emojis="appSettings.settings.useEmojis"
    />

    <!-- Confirm delete -->
    <ConfirmModal
      :open="pendingDelete !== null"
      :message="t('diary.deleteConfirm')"
      @confirm="pendingDelete?.(); pendingDelete = null"
      @cancel="pendingDelete = null"
    />

    <!-- Data point entry modal -->
    <EntryModal
      :open="entryModalConfig !== null"
      :config="entryModalConfig"
      :initial-value="entryModalValue"
      :initial-time="entryModalTime"
      :is-edit="entryModalEditId !== null"
      @save="saveDataEntry"
      @close="closeDataModal"
      @delete="handleDeleteFromModal"
    />

    <!-- Enter Day modal -->
    <EnterDayModal
      :open="showEnterDayModal"
      :date="date"
      :tracker-configs="trackers.configs"
      @save="saveEnterDay"
      @close="showEnterDayModal = false"
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

</style>
