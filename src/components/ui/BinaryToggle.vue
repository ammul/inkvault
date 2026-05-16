<script setup lang="ts" generic="T extends string | boolean">
const props = defineProps<{
  options: [{ value: T; label: string }, { value: T; label: string }]
}>()

const model = defineModel<T>({ required: true })
</script>

<template>
  <button
    v-for="opt in options"
    :key="String(opt.value)"
    type="button"
    @click="model = opt.value"
    :class="model === opt.value ? 'bg-accent text-on-accent' : 'bg-subtle text-ink-muted hover:bg-edge'"
    class="text-sm px-3 py-1.5 rounded-input transition-colors font-medium"
  >{{ opt.label }}</button>
</template>
