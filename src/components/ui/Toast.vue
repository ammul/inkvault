<script setup lang="ts">
import { useToastStore } from '@/stores/toast'
const toast = useToastStore()
</script>

<template>
  <div class="fixed bottom-4 right-4 flex flex-col gap-2 z-50 pointer-events-none">
    <div
      v-for="t in toast.toasts"
      :key="t.id"
      class="flex items-center gap-3 bg-gray-800 text-white text-sm px-4 py-2.5 rounded-lg shadow-lg pointer-events-auto"
    >
      <span>{{ t.text }}</span>
      <button
        @click="toast.dismiss(t.id)"
        class="text-gray-400 hover:text-white leading-none"
        aria-label="Dismiss"
      >
        ✕
      </button>
    </div>
  </div>
</template>
