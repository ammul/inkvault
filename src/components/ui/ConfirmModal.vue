<script setup lang="ts">
import { watch } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  open: boolean
  message: string
}>()

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()

const { t } = useI18n()

function onKeyDown(e: KeyboardEvent) {
  if (e.key === 'Escape') emit('cancel')
}

watch(() => props.open, (val) => {
  if (val) document.addEventListener('keydown', onKeyDown)
  else document.removeEventListener('keydown', onKeyDown)
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
        @click.self="emit('cancel')"
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
            class="bg-raised border border-edge rounded-card shadow-elevated w-full max-w-sm p-5 space-y-4"
            role="alertdialog"
            aria-modal="true"
          >
            <p class="text-sm text-ink">{{ message }}</p>
            <div class="flex gap-2 justify-end">
              <button
                @click="emit('cancel')"
                class="text-sm px-3 py-1.5 rounded-input text-ink-muted hover:text-ink hover:bg-subtle transition-colors"
              >{{ t('diary.cancel') }}</button>
              <button
                @click="emit('confirm')"
                class="text-sm px-3 py-1.5 rounded-input bg-danger text-white hover:opacity-90 transition-opacity"
              >{{ t('diary.confirm') }}</button>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>
