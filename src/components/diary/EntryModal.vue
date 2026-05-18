<script setup lang="ts">
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type { TrackerConfig, TrackerValue } from '@/types'
import { currentHHMM } from '@/utils/time'
import SlideModal from '@/components/ui/SlideModal.vue'
import TrackerField from '@/components/trackers/TrackerField.vue'

const props = defineProps<{
  open: boolean
  config: TrackerConfig | null
  initialValue: TrackerValue
  initialTime?: string
  isEdit: boolean
}>()

const emit = defineEmits<{
  save: [value: TrackerValue, time: string]
  close: []
  delete: []
}>()

const { t } = useI18n()
const localValue = ref<TrackerValue>(null)
const entryTime = ref('')

watch(() => props.open, (val) => {
  if (val) {
    localValue.value = props.initialValue
    entryTime.value = props.initialTime ?? currentHHMM()
  }
})
</script>

<template>
  <SlideModal :open="open && config !== null" @close="emit('close')">
    <h3 class="text-sm font-semibold text-ink">
      {{ isEdit ? t('diary.editTracker', { label: config!.label }) : t('diary.addTracker', { label: config!.label }) }}
    </h3>
    <TrackerField
      :config="config!"
      :model-value="localValue"
      @update:model-value="localValue = $event"
    />
    <div class="flex items-center gap-2">
      <label for="entry-modal-time" class="text-xs text-ink-muted shrink-0">{{ t('diary.timeLabel') }}</label>
      <input
        id="entry-modal-time"
        type="time"
        v-model="entryTime"
        class="text-sm text-ink bg-subtle border border-edge rounded-input px-2 py-1 focus:outline-none focus:ring-2 focus:ring-accent/25"
      />
    </div>
    <div class="flex gap-2 items-center">
      <button
        v-if="isEdit"
        @click="emit('delete')"
        class="text-sm px-3 py-1.5 rounded-input text-danger hover:bg-subtle transition-colors"
      >{{ t('diary.deleteEntry') }}</button>
      <div class="flex gap-2 ml-auto">
        <button
          @click="emit('close')"
          class="text-sm px-3 py-1.5 rounded-input text-ink-muted hover:text-ink hover:bg-subtle transition-colors"
        >{{ t('diary.cancel') }}</button>
        <button
          @click="emit('save', localValue, entryTime)"
          class="text-sm px-3 py-1.5 rounded-input bg-accent text-on-accent hover:bg-accent-dim transition-colors"
        >{{ t('diary.done') }}</button>
      </div>
    </div>
  </SlideModal>
</template>
