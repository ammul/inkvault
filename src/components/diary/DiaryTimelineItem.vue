<script setup lang="ts">
import { computed, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import type { TrackerConfig, TrackerValue } from '@/types'
import { useAppSettingsStore } from '@/stores/appSettings'
import EntryValue from '@/components/diary/EntryValue.vue'
import TextEntryControls from '@/components/diary/TextEntryControls.vue'

const { t, locale } = useI18n()
const appSettings = useAppSettingsStore()

interface TextItem {
  type: 'text'
  id: string
  text: string
  createdAt: string
}

interface DataItem {
  type: 'data'
  id: string
  configId: string
  value: TrackerValue
  createdAt: string
}

type TimelineItem = TextItem | DataItem

const props = defineProps<{
  item: TimelineItem
  isEditing: boolean
  trackerConfig: TrackerConfig | undefined
}>()

const emit = defineEmits<{
  click: []
  'update-text': [id: string, text: string]
  done: []
  delete: [id: string]
}>()

const editingTime = defineModel<string>('editingTime', { required: true })

const is24Hour = computed(() => appSettings.settings.clockDisplay === '24h')

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

function bubbleStyle(): Record<string, string> {
  if (props.item.type === 'text') return {}
  if (!props.trackerConfig) return {}
  return { backgroundColor: props.trackerConfig.color, color: 'white' }
}

function bubbleContent(): string {
  if (props.item.type === 'text') return '✎'
  if (!props.trackerConfig) return '?'
  return appSettings.settings.useEmojis ? props.trackerConfig.icon : props.trackerConfig.label[0].toUpperCase()
}

function eyebrowLabel(): string {
  if (props.item.type === 'text') return t('diary.noteLabel')
  return props.trackerConfig?.label ?? ''
}

function eyebrowStyle(): Record<string, string> {
  if (props.item.type === 'text') return { color: 'var(--color-ink-muted)' }
  return props.trackerConfig ? { color: props.trackerConfig.color } : {}
}

function handleBlur(e: FocusEvent) {
  const rel = e.relatedTarget as HTMLElement | null
  if (rel?.closest?.('[data-edit-controls]')) return
  emit('done')
}
</script>

<template>
  <div
    class="grid grid-cols-[52px_1fr] gap-3 mb-5 cursor-pointer"
    @click="emit('click')"
  >
    <!-- Gutter: bubble + time chip -->
    <div class="flex flex-col items-center">
      <div
        aria-hidden="true"
        class="w-9 h-9 rounded-full inline-flex items-center justify-center leading-none select-none"
        :class="[
          item.type === 'text'
            ? 'bg-surface text-ink-muted border-[1.5px] border-edge-strong text-[14px]'
            : (appSettings.settings.useEmojis ? 'text-xl' : 'text-[12px] font-bold')
        ]"
        :style="[
          { boxShadow: '0 0 0 4px var(--color-surface), 0 1px 3px rgba(0,0,0,.06)' },
          bubbleStyle()
        ]"
      >{{ bubbleContent() }}</div>
      <time
        :datetime="item.createdAt"
        class="mt-1.5 text-center text-[10.5px] leading-[1.15] tabular-nums bg-surface px-[3px] rounded-[4px]"
      >
        <span class="block text-ink-muted font-semibold">{{ formatHourMin(item.createdAt) }}</span>
        <span v-if="!is24Hour" class="block text-[9px] uppercase tracking-[0.08em] text-ink-faint">
          {{ formatAmPm(item.createdAt) }}
        </span>
      </time>
    </div>

    <!-- Card content -->
    <div class="pt-1 min-w-0">
      <div class="flex items-center gap-2 mb-1">
        <span
          class="text-[10.5px] font-semibold uppercase tracking-[0.08em]"
          :style="eyebrowStyle()"
        >{{ eyebrowLabel() }}</span>
      </div>

      <template v-if="item.type === 'text'">
        <p
          v-if="!isEditing"
          class="text-[14.5px] leading-[1.6] text-ink whitespace-pre-wrap break-words min-h-5"
        >{{ (item as TextItem).text || '…' }}</p>
        <textarea
          v-else
          :ref="(el: unknown) => el && nextTick(() => (el as HTMLTextAreaElement).focus())"
          :value="(item as TextItem).text"
          @click.stop
          @input="emit('update-text', item.id, ($event.target as HTMLTextAreaElement).value)"
          @blur="handleBlur"
          @keydown.escape="emit('done')"
          rows="3"
          :placeholder="t('diary.newEntryPlaceholder')"
          class="w-full text-[14.5px] leading-[1.6] text-ink bg-transparent placeholder:text-ink-faint resize-none focus:outline-none focus:ring-2 focus:ring-accent/25 rounded-sm"
        />
        <TextEntryControls
          v-if="isEditing"
          v-model:time="editingTime"
          :entry-id="item.id"
          @delete="emit('delete', item.id)"
          @done="emit('done')"
        />
      </template>

      <EntryValue
        v-else
        :config="trackerConfig"
        :value="(item as DataItem).value"
        :use-emojis="appSettings.settings.useEmojis"
      />
    </div>
  </div>
</template>
