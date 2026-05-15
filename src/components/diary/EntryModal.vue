<script setup lang="ts">
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type { TrackerConfig, TrackerValue } from '@/types'
import TrackerField from '@/components/trackers/TrackerField.vue'

const props = defineProps<{
  open: boolean
  config: TrackerConfig | null
  initialValue: TrackerValue
  isEdit: boolean
}>()

const emit = defineEmits<{
  save: [value: TrackerValue]
  close: []
  delete: []
}>()

const { t } = useI18n()
const localValue = ref<TrackerValue>(null)

watch(() => props.open, (val) => {
  if (val) {
    localValue.value = props.initialValue
    document.addEventListener('keydown', onKeyDown)
  } else {
    document.removeEventListener('keydown', onKeyDown)
  }
})

function onKeyDown(e: KeyboardEvent) {
  if (e.key === 'Escape') emit('close')
}
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
        v-if="open && config"
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
            v-if="open && config"
            class="bg-raised border border-edge rounded-card shadow-elevated w-full max-w-sm p-5 space-y-4"
            role="dialog"
            aria-modal="true"
          >
            <h3 class="text-sm font-semibold text-ink">
              {{ isEdit ? t('diary.editTracker', { label: config.label }) : t('diary.addTracker', { label: config.label }) }}
            </h3>
            <TrackerField
              :config="config"
              :model-value="localValue"
              @update:model-value="localValue = $event"
            />
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
                  @click="emit('save', localValue)"
                  class="text-sm px-3 py-1.5 rounded-input bg-accent text-on-accent hover:bg-accent-dim transition-colors"
                >{{ t('diary.done') }}</button>
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>
