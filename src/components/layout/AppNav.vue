<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useDiaryStore } from '@/stores/diary'
import { useDataPointsStore } from '@/stores/datapoints'

const router = useRouter()
const auth = useAuthStore()
const diary = useDiaryStore()
const datapoints = useDataPointsStore()

function lock() {
  auth.lock()
  diary.reset()
  datapoints.reset()
  router.push('/')
}

const navLinks = [
  { to: '/diary', label: 'Diary' },
  { to: '/stats', label: 'Stats' },
  { to: '/data', label: 'Data Points' },
  { to: '/theme', label: 'Theme' },
  { to: '/settings', label: 'Backup' },
]
</script>

<template>
  <nav class="bg-raised border-b border-edge px-4 py-3 flex items-center justify-between sticky top-0 z-40">
    <router-link
      to="/home"
      class="font-bold text-accent text-base tracking-tight"
    >
      InkVault
    </router-link>
    <div class="flex gap-1 items-center">
      <router-link
        v-for="link in navLinks"
        :key="link.to"
        :to="link.to"
        class="text-sm text-ink-muted hover:text-ink px-3 py-1.5 rounded-input transition-colors"
        active-class="text-accent bg-accent-tint font-medium"
      >
        {{ link.label }}
      </router-link>
      <button
        @click="lock"
        class="text-sm text-danger hover:text-danger-dim px-3 py-1.5 rounded-input transition-colors ml-1"
      >
        Lock
      </button>
    </div>
  </nav>
</template>
