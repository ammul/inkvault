<script setup lang="ts">
import { ref, watch, nextTick, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { DiaryTimelineEntry } from '@/types'
import { useAppSettingsStore } from '@/stores/appSettings'

const props = defineProps<{
  entry: DiaryTimelineEntry
  isEditing: boolean
  isLast: boolean
}>()

const emit = defineEmits<{
  'update:text': [text: string]
  edit: []
  delete: []
  confirm: []
  blur: []
}>()

const { t, locale } = useI18n()
const appSettings = useAppSettingsStore()
const textareaRef = ref<HTMLTextAreaElement | null>(null)

watch(() => props.isEditing, (val) => {
  if (val) nextTick(() => textareaRef.value?.focus())
})

const formattedTime = computed(() =>
  new Date(props.entry.createdAt).toLocaleTimeString(locale.value, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: appSettings.settings.clockDisplay === 'ampm',
  })
)
</script>

<template>
  <div class="flex gap-3">
    <!-- Left: dot + connector line -->
    <div class="flex flex-col items-center w-8 shrink-0">
      <div v-if="appSettings.settings.useEmojis" class="w-4 h-4 rounded-full bg-accent shrink-0 mt-1" />
      <div v-else class="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-xs font-bold text-on-accent shrink-0">T</div>
      <div v-if="!isLast" class="w-px flex-1 bg-edge" :class="appSettings.settings.useEmojis ? 'mt-1' : ''" />
    </div>

    <!-- Right: content -->
    <div class="flex-1 pb-5">
      <!-- Timestamp + actions -->
      <div class="flex items-center justify-between mb-1">
        <span class="text-xs text-ink-faint">{{ formattedTime }}</span>
        <div v-if="!isEditing" class="flex gap-1">
          <button
            @click="emit('edit')"
            class="text-xs text-ink-muted hover:text-ink px-1.5 py-0.5 rounded-input hover:bg-subtle transition-colors"
          >{{ t('diary.editEntry') }}</button>
          <button
            @click="emit('delete')"
            class="text-xs text-danger px-1.5 py-0.5 rounded-input hover:bg-subtle transition-colors"
          >{{ t('diary.deleteEntry') }}</button>
        </div>
        <div v-else>
          <button
            @click="emit('confirm')"
            class="text-xs text-accent px-1.5 py-0.5 rounded-input hover:bg-accent-tint transition-colors"
          >{{ t('diary.done') }}</button>
        </div>
      </div>

      <!-- View mode -->
      <p
        v-if="!isEditing"
        @dblclick="emit('edit')"
        class="text-sm text-ink whitespace-pre-wrap cursor-text min-h-[1.25rem]"
      >{{ entry.text || '…' }}</p>

      <!-- Edit mode -->
      <textarea
        v-else
        ref="textareaRef"
        :value="entry.text"
        @input="emit('update:text', ($event.target as HTMLTextAreaElement).value)"
        @blur="emit('blur')"
        @keydown.escape="emit('blur')"
        rows="3"
        :placeholder="t('diary.newEntryPlaceholder')"
        class="w-full border border-edge rounded-card px-3 py-2 text-sm text-ink bg-raised placeholder:text-ink-faint resize-none focus:outline-none focus:ring-2 focus:ring-accent/25 focus:border-accent transition-colors"
      />
    </div>
  </div>
</template>
