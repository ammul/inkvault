<script setup lang="ts">
import AppNav from './AppNav.vue'
</script>

<template>
  <div class="min-h-screen flex flex-col bg-surface">
    <AppNav />
    <main class="flex-1 container mx-auto max-w-3xl px-4 py-8">
      <slot />
    </main>
  </div>
</template>
