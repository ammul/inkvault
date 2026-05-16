<script setup lang="ts">
import { watch } from 'vue'

const props = defineProps<{ open: boolean; scrollable?: boolean }>()
const emit = defineEmits<{ close: [] }>()

function onKeyDown(e: KeyboardEvent) {
  if (e.key === 'Escape') emit('close')
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
            v-if="open"
            class="bg-raised border border-edge rounded-card shadow-elevated w-full max-w-sm p-5 space-y-4"
            :class="scrollable ? 'max-h-[85vh] overflow-y-auto' : ''"
            role="dialog"
            aria-modal="true"
          >
            <slot />
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>
