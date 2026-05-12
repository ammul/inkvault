<script setup lang="ts">
import { useToastStore } from '@/stores/toast'
const toast = useToastStore()
</script>

<template>
  <div class="fixed bottom-4 left-4 right-4 sm:left-auto flex flex-col gap-2 z-50 pointer-events-none">
    <div
      v-for="t in toast.toasts"
      :key="t.id"
      class="flex items-center gap-3 bg-raised border border-edge shadow-elevated text-ink text-sm px-4 py-2.5 rounded-card pointer-events-auto"
    >
      <span>{{ t.text }}</span>
      <button
        @click="toast.dismiss(t.id)"
        class="text-ink-faint hover:text-ink leading-none transition-colors"
        aria-label="Dismiss"
      >
        ✕
      </button>
    </div>
  </div>
</template>
