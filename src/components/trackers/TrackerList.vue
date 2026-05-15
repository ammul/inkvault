<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type { TrackerConfig, TrackerType } from '@/types'
import TrackerIcon from '@/components/ui/TrackerIcon.vue'
import TrackerPreview from '@/components/trackers/TrackerPreview.vue'
import TrackerEditor from '@/components/trackers/TrackerEditor.vue'

const { t } = useI18n()

const props = defineProps<{
  configs: TrackerConfig[]
  storedData: (id: string) => number
}>()

const emit = defineEmits<{
  save: [data: Omit<TrackerConfig, 'id' | 'createdAt'>, existingId: string | null, locked: boolean]
  delete: [id: string]
}>()

// ── Expand state ────────────────────────────────────────────────

const DRAFT_ID = '__draft__'

const expandedId = ref<string | null>(null)
const editorRef = ref<InstanceType<typeof TrackerEditor> | null>(null)

function setEditorRef(el: unknown) {
  editorRef.value = el as InstanceType<typeof TrackerEditor> | null
}

const showDraft = computed(() => expandedId.value === DRAFT_ID)

const DRAFT_CONFIG: TrackerConfig = {
  id: DRAFT_ID,
  label: '',
  color: '#4f46e5',
  icon: '📊',
  type: 'range',
  config: { min: 0, max: 10, step: 1 },
  createdAt: '',
}

function toggle(id: string) {
  expandedId.value = expandedId.value === id ? null : id
}

function openDraft() {
  expandedId.value = DRAFT_ID
}

function cancelEdit() {
  expandedId.value = null
}

function onEditorSave(data: Omit<TrackerConfig, 'id' | 'createdAt'>) {
  const existingId = expandedId.value !== DRAFT_ID ? expandedId.value : null
  const locked = existingId ? props.storedData(existingId) > 0 : false
  emit('save', data, existingId, locked)
  expandedId.value = null
}

function saveCurrentRow() {
  editorRef.value?.submit()
}

function onDeleteFromFoot(id: string) {
  expandedId.value = null
  emit('delete', id)
}

// collapse if deleted config was expanded
watch(() => props.configs, (newConfigs) => {
  if (expandedId.value && expandedId.value !== DRAFT_ID) {
    if (!newConfigs.find(c => c.id === expandedId.value)) {
      expandedId.value = null
    }
  }
})

// ── Sub-line helpers ────────────────────────────────────────────

const TYPE_KEY_MAP: Record<TrackerType, string> = {
  range: 'range',
  string: 'string',
  'multi-string': 'multiString',
  boolean: 'boolean',
  medication: 'medication',
}

function typeLabel(type: TrackerType): string {
  return t(`trackers.editor.types.${TYPE_KEY_MAP[type]}.label`)
}

function subLine(config: TrackerConfig): string {
  const tl = typeLabel(config.type)
  switch (config.type) {
    case 'range': {
      const c = config.config as { min: number; max: number; step: number }
      return `${tl} · ${c.min}–${c.max} · ${t('trackers.sub.rangeStep', { step: c.step })}`
    }
    case 'string':
      return tl
    case 'multi-string': {
      const c = config.config as { options: string[] }
      return `${tl} · ${t('trackers.sub.multiOptions', { n: c.options.length })}`
    }
    case 'boolean':
      return tl
    case 'medication': {
      const c = config.config as { medication: string; dosagePresets?: string[] }
      const presets = c.dosagePresets ?? []
      const shown = presets.slice(0, 3).join(t('trackers.sub.medPresetsJoin'))
      const ellipsis = presets.length > 3 ? '…' : ''
      return presets.length > 0 ? `${tl} · ${shown}${ellipsis}` : tl
    }
  }
}
</script>

<template>
  <div>

    <!-- ── Page header ────────────────────────────────────── -->
    <div class="flex items-center justify-between mb-3.5">
      <div>
        <h1 class="text-xl font-semibold text-ink">{{ t('trackers.title') }}</h1>
        <p class="text-xs text-ink-muted mt-0.5">{{ t('trackers.helper') }}</p>
      </div>
      <button
        @click="openDraft"
        class="text-sm bg-accent text-on-accent px-4 py-2 rounded-input hover:bg-accent-dim transition-colors font-medium shrink-0"
      >
        {{ t('trackers.add') }}
      </button>
    </div>

    <!-- ── List ───────────────────────────────────────────── -->
    <div class="flex flex-col gap-1.5">

      <!-- Draft row (always first when present) -->
      <div
        v-if="showDraft"
        class="border rounded-card overflow-hidden border-accent bg-surface"
        :style="{ boxShadow: '0 0 0 3px var(--color-accent-tint)' }"
      >
        <!-- Draft head -->
        <div class="grid grid-cols-[auto_1fr_auto] items-center gap-3.5 px-4 py-3.5 border-b border-edge">
          <TrackerIcon icon="📊" color="#4f46e5" label="New" />
          <div class="min-w-0">
            <p class="text-sm font-semibold text-ink-muted">{{ t('trackers.editor.newTitle') }}</p>
          </div>
          <button
            type="button"
            @click="cancelEdit"
            :aria-label="t('trackers.actions.collapse')"
            class="w-7 h-7 flex items-center justify-center rounded-md hover:bg-subtle text-ink-muted transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3,10 8,5 13,10"/>
            </svg>
          </button>
        </div>

        <!-- Draft editor body -->
        <TrackerEditor
          :ref="setEditorRef"
          :compact="true"
          @save="onEditorSave"
        />

        <!-- Draft foot -->
        <div class="flex justify-end items-center gap-2 px-4 py-2.5 border-t border-edge bg-subtle">
          <button
            type="button"
            @click="cancelEdit"
            class="text-sm px-4 py-2 rounded-input border border-edge text-ink-muted hover:bg-subtle hover:text-ink transition-colors"
          >
            {{ t('trackers.editor.cancel') }}
          </button>
          <button
            type="button"
            @click="saveCurrentRow"
            class="text-sm px-4 py-2 rounded-input bg-accent text-on-accent hover:bg-accent-dim transition-colors font-medium"
          >
            {{ t('trackers.editor.add') }}
          </button>
        </div>
      </div>

      <!-- Existing config rows -->
      <template v-for="config in configs" :key="config.id">

        <!-- ── Collapsed row ──────────────────────────────── -->
        <div
          v-if="expandedId !== config.id"
          role="button"
          tabindex="0"
          :aria-expanded="false"
          class="group grid grid-cols-[auto_1fr_auto_auto] items-center gap-3.5 px-3.5 py-3 border border-edge rounded-card bg-raised hover:bg-subtle transition-colors duration-100 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
          @click="toggle(config.id)"
          @keydown.enter.prevent="toggle(config.id)"
          @keydown.space.prevent="toggle(config.id)"
        >
          <!-- Icon -->
          <TrackerIcon :icon="config.icon" :color="config.color" :label="config.label" />

          <!-- Meta -->
          <div class="min-w-0">
            <p class="text-sm font-semibold text-ink truncate">{{ config.label }}</p>
            <p class="text-[11.5px] text-ink-faint">{{ subLine(config) }}</p>
          </div>

          <!-- Preview slot -->
          <div class="hidden sm:block min-w-[200px] max-w-[240px]">
            <TrackerPreview :config="config" />
          </div>

          <!-- Actions -->
          <div class="flex gap-0.5 opacity-40 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-100">
            <!-- Drag handle (DnD is a follow-up) -->
            <button
              type="button"
              :aria-label="t('trackers.actions.reorder')"
              class="w-7 h-7 flex items-center justify-center rounded-md hover:bg-subtle text-ink-muted cursor-grab transition-colors"
              @click.stop
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" stroke="none">
                <circle cx="5.5" cy="4" r="1.1"/><circle cx="10.5" cy="4" r="1.1"/>
                <circle cx="5.5" cy="8" r="1.1"/><circle cx="10.5" cy="8" r="1.1"/>
                <circle cx="5.5" cy="12" r="1.1"/><circle cx="10.5" cy="12" r="1.1"/>
              </svg>
            </button>
            <!-- Delete -->
            <button
              type="button"
              :aria-label="t('trackers.delete')"
              class="w-7 h-7 flex items-center justify-center rounded-md hover:bg-danger-tint hover:text-danger text-ink-muted transition-colors"
              @click.stop="emit('delete', config.id)"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="2,4 14,4"/>
                <path d="M5 4V2h6v2"/>
                <path d="M3 4l1 10h8l1-10"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- ── Expanded row ───────────────────────────────── -->
        <div
          v-else
          class="border rounded-card overflow-hidden border-accent bg-surface"
          :style="{ boxShadow: '0 0 0 3px var(--color-accent-tint)' }"
        >
          <!-- Expanded head -->
          <div class="grid grid-cols-[auto_1fr_auto] items-center gap-3.5 px-4 py-3.5 border-b border-edge">
            <TrackerIcon :icon="config.icon" :color="config.color" :label="config.label" />
            <div class="min-w-0">
              <p class="text-sm font-semibold text-ink truncate">{{ config.label }}</p>
              <p class="text-[11.5px] text-ink-faint">{{ subLine(config) }}</p>
            </div>
            <div class="flex items-center gap-2">
              <!-- Locked pill -->
              <span
                v-if="storedData(config.id) > 0"
                class="inline-flex items-center gap-1.5 text-[11px] text-warn bg-warn-tint border border-warn/30 px-2 py-0.5 rounded-full whitespace-nowrap"
              >
                🔒 {{ t('trackers.editor.lockedRowPill', { n: storedData(config.id) }) }}
              </span>
              <!-- Collapse caret -->
              <button
                type="button"
                :aria-label="t('trackers.actions.collapse')"
                class="w-7 h-7 flex items-center justify-center rounded-md hover:bg-subtle text-ink-muted transition-colors"
                @click="toggle(config.id)"
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="3,10 8,5 13,10"/>
                </svg>
              </button>
            </div>
          </div>

          <!-- Expanded editor body -->
          <TrackerEditor
            :ref="setEditorRef"
            :initial="config"
            :locked="storedData(config.id) > 0"
            :compact="true"
            @save="onEditorSave"
          />

          <!-- Expanded foot -->
          <div class="flex justify-between items-center px-4 py-2.5 border-t border-edge bg-subtle">
            <button
              type="button"
              class="text-xs text-danger hover:underline transition-colors"
              @click="onDeleteFromFoot(config.id)"
            >
              {{ t('trackers.actions.deleteTracker') }}
            </button>
            <div class="flex gap-2">
              <button
                type="button"
                @click="cancelEdit"
                class="text-sm px-4 py-2 rounded-input border border-edge text-ink-muted hover:bg-subtle hover:text-ink transition-colors"
              >
                {{ t('trackers.editor.cancel') }}
              </button>
              <button
                type="button"
                @click="saveCurrentRow"
                class="text-sm px-4 py-2 rounded-input bg-accent text-on-accent hover:bg-accent-dim transition-colors font-medium"
              >
                {{ t('trackers.editor.save') }}
              </button>
            </div>
          </div>
        </div>

      </template>

      <!-- ── Add another dashed button ─────────────────────── -->
      <button
        v-if="configs.length > 0 && !showDraft"
        type="button"
        @click="openDraft"
        class="w-full mt-1.5 flex items-center justify-center gap-1.5 py-2.5 border border-dashed border-edge-strong rounded-card text-ink-muted text-sm font-medium hover:border-accent hover:bg-accent-tint hover:text-accent-dim transition-colors duration-100"
      >
        {{ t('trackers.addAnother') }}
      </button>

      <!-- ── Empty state ─────────────────────────────────── -->
      <div v-if="configs.length === 0 && !showDraft" class="text-center py-10">
        <p class="text-ink-faint text-sm">{{ t('trackers.empty') }}</p>
      </div>

    </div>
    <!-- end list -->

  </div>
</template>
