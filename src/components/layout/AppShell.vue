<script setup lang="ts">
import AppNav from './AppNav.vue'
</script>

<template>
  <div class="min-h-screen flex flex-col bg-gray-50">
    <AppNav />
    <main class="flex-1 container mx-auto max-w-3xl px-4 py-6">
      <slot />
    </main>
  </div>
</template>
