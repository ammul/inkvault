<script setup lang="ts">
defineProps<{ title: string; description: string }>()
</script>

<template>
  <div class="bg-raised border border-edge rounded-card p-4 flex items-start justify-between gap-4">
    <div>
      <p class="text-sm font-medium text-ink">{{ title }}</p>
      <p class="text-xs text-ink-muted mt-0.5">{{ description }}</p>
    </div>
    <div class="flex gap-1 shrink-0">
      <slot />
    </div>
  </div>
</template>
