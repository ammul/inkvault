<script setup lang="ts">
import { useAppSettingsStore } from '@/stores/appSettings'

const props = defineProps<{
  icon: string
  color: string
  label: string
  size?: 'sm' | 'md' | 'lg'
}>()

const appSettings = useAppSettingsStore()
</script>

<template>
  <div
    class="rounded-full flex items-center justify-center shrink-0 leading-none"
    :class="[
      size === 'sm' ? 'w-5 h-5' : size === 'lg' ? 'w-12 h-12' : 'w-8 h-8',
      appSettings.settings.useEmojis
        ? (size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-2xl' : 'text-base')
        : (size === 'sm' ? 'text-[9px] font-bold' : size === 'lg' ? 'text-sm font-bold' : 'text-xs font-bold'),
    ]"
    :style="{
      backgroundColor: color,
      color: appSettings.settings.useEmojis ? undefined : 'white',
    }"
  >{{ appSettings.settings.useEmojis ? icon : label[0].toUpperCase() }}</div>
</template>
