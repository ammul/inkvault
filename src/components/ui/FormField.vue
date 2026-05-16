<script setup lang="ts">
defineProps<{ label: string }>()
</script>

<template>
  <div>
    <label class="block text-[11px] font-medium text-ink-muted mb-1.5">{{ label }}</label>
    <slot />
  </div>
</template>
