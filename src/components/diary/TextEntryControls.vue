<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const props = defineProps<{ entryId: string }>()
const emit = defineEmits<{ delete: [id: string]; done: [] }>()
const time = defineModel<string>('time', { required: true })
</script>

<template>
  <div
    data-edit-controls
    class="flex flex-wrap gap-1.5 mt-1.5 items-center justify-end"
    @click.stop
  >
    <div class="flex items-center gap-1 mr-auto" @click.stop>
      <label class="text-[10.5px] text-ink-muted">{{ t('diary.timeLabel') }}</label>
      <input
        type="time"
        v-model="time"
        class="text-xs text-ink bg-subtle border border-edge rounded-input px-1.5 py-0.5 focus:outline-none focus:ring-2 focus:ring-accent/25"
      />
    </div>
    <button
      @click.stop="emit('delete', props.entryId)"
      class="text-xs text-danger px-2 py-1 rounded-input hover:bg-subtle transition-colors"
    >{{ t('diary.deleteEntry') }}</button>
    <button
      @click.stop="emit('done')"
      class="text-xs text-accent px-2 py-1 rounded-input hover:bg-accent-tint transition-colors"
    >{{ t('diary.done') }}</button>
  </div>
</template>
