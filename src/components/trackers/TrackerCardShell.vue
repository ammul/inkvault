<script setup lang="ts">
defineProps<{ footClass?: string }>()
</script>

<template>
  <div
    class="border rounded-card overflow-hidden border-accent bg-surface"
    :style="{ boxShadow: '0 0 0 3px var(--color-accent-tint)' }"
  >
    <div class="grid grid-cols-[auto_1fr_auto] items-center gap-3.5 px-4 py-3.5 border-b border-edge">
      <slot name="head" />
    </div>
    <slot />
    <div :class="['flex items-center gap-2 px-4 py-2.5 border-t border-edge bg-subtle', footClass ?? 'justify-end']">
      <slot name="foot" />
    </div>
  </div>
</template>
