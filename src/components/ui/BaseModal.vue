<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'

const props = defineProps<{ title: string }>()
const emit = defineEmits<{ close: [] }>()

function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape') emit('close')
}

onMounted(() => document.addEventListener('keydown', onKey))
onUnmounted(() => document.removeEventListener('keydown', onKey))
</script>

<template>
  <Teleport to="body">
    <div
      class="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      :aria-label="props.title"
    >
      <!-- Backdrop -->
      <div
        class="absolute inset-0 bg-black/40 backdrop-blur-sm"
        @click="emit('close')"
      />

      <!-- Panel -->
      <div class="relative w-full max-w-lg bg-raised border border-edge rounded-card shadow-card p-5 z-10">
        <div class="flex items-center justify-between mb-4">
          <h2 class="font-semibold text-ink">{{ props.title }}</h2>
          <button
            @click="emit('close')"
            class="text-ink-muted hover:text-ink transition-colors leading-none text-lg"
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <slot />
      </div>
    </div>
  </Teleport>
</template>
