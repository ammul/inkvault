<script setup lang="ts">
import { computed, onMounted, onUnmounted, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useThemeStore } from '@/stores/theme'
import { useAppSettingsStore } from '@/stores/appSettings'
import UnlockScreen from '@/components/auth/UnlockScreen.vue'
import OnboardingWizard from '@/components/auth/OnboardingWizard.vue'
import AppShell from '@/components/layout/AppShell.vue'
import Toast from '@/components/ui/Toast.vue'

const auth = useAuthStore()
const theme = useThemeStore()
const appSettings = useAppSettingsStore()

const showWizard = computed(() => auth.isNewVault && appSettings.loaded && theme.loaded)

const IDLE_TIMEOUT_MS = 10 * 60 * 1000
let idleTimer: ReturnType<typeof setTimeout> | null = null

function lockVault() {
  clearIdleTimer()
  if (auth.isUnlocked) auth.lock()
}

function clearIdleTimer() {
  if (idleTimer !== null) {
    clearTimeout(idleTimer)
    idleTimer = null
  }
}

function resetIdleTimer() {
  clearIdleTimer()
  idleTimer = setTimeout(lockVault, IDLE_TIMEOUT_MS)
}

const IDLE_EVENTS = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'] as const

function attachIdleListeners() {
  for (const ev of IDLE_EVENTS) document.addEventListener(ev, resetIdleTimer, { passive: true })
  resetIdleTimer()
}

function detachIdleListeners() {
  for (const ev of IDLE_EVENTS) document.removeEventListener(ev, resetIdleTimer)
  clearIdleTimer()
}

function handleVisibilityChange() {
  if (document.visibilityState === 'hidden') lockVault()
}

watch(
  () => auth.isUnlocked,
  async (unlocked) => {
    if (unlocked) {
      attachIdleListeners()
      if (!theme.loaded) await theme.load()
      if (!appSettings.loaded) await appSettings.load()
    } else {
      detachIdleListeners()
    }
  },
)

onMounted(() => {
  auth.checkInitialized()
  document.addEventListener('visibilitychange', handleVisibilityChange)
  if (auth.isUnlocked) attachIdleListeners()
})

onUnmounted(() => {
  document.removeEventListener('visibilitychange', handleVisibilityChange)
  detachIdleListeners()
})
</script>

<template>
  <UnlockScreen v-if="!auth.isUnlocked" />
  <template v-else>
    <AppShell>
      <RouterView />
    </AppShell>
    <OnboardingWizard v-if="showWizard" />
  </template>
  <Toast />
</template>
