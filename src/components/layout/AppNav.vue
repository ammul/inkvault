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
  { to: '/diary', label: '📓 Diary' },
  { to: '/stats', label: '📊 Stats' },
  { to: '/data', label: '⚙️ Data Points' },
  { to: '/settings', label: '💾 Backup' },
]
</script>

<template>
  <nav class="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
    <router-link to="/home" class="font-bold text-indigo-600 text-lg">🔏 InkVault</router-link>
    <div class="flex gap-4 items-center">
      <router-link
        v-for="link in navLinks"
        :key="link.to"
        :to="link.to"
        class="text-sm text-gray-600 hover:text-indigo-600 transition"
        active-class="text-indigo-600 font-semibold"
      >
        {{ link.label }}
      </router-link>
      <button @click="lock" class="text-sm text-red-500 hover:text-red-700 transition ml-2">
        🔒 Lock
      </button>
    </div>
  </nav>
</template>
