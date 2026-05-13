<script setup lang="ts">
import AppNav from './AppNav.vue'
</script>

<template>
  <div class="min-h-screen flex flex-col bg-surface">
    <AppNav />
    <main class="flex-1 container mx-auto max-w-content px-4 py-8">
      <RouterView v-slot="{ Component, route }">
        <Transition name="page" mode="out-in">
          <component :is="Component" :key="route.path" />
        </Transition>
      </RouterView>
    </main>
  </div>
</template>

<style scoped>
.page-enter-active,
.page-leave-active {
  transition: opacity 180ms ease, transform 180ms ease;
}
.page-enter-from {
  opacity: 0;
  transform: translateY(6px);
}
.page-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
