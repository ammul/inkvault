<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import { useDiaryStore } from '@/stores/diary'
import { useDataPointsStore } from '@/stores/datapoints'

const { t } = useI18n()
const router = useRouter()
const auth = useAuthStore()
const diary = useDiaryStore()
const datapoints = useDataPointsStore()

const menuOpen = ref(false)

function lock() {
  menuOpen.value = false
  auth.lock()
  diary.reset()
  datapoints.reset()
  router.push('/')
}

function closeMenu() {
  menuOpen.value = false
}

function onKeyDown(e: KeyboardEvent) {
  if (e.key === 'Escape') closeMenu()
}

watch(menuOpen, (open) => {
  if (open) document.addEventListener('keydown', onKeyDown)
  else document.removeEventListener('keydown', onKeyDown)
})

const navLinks = [
  { to: '/diary', key: 'nav.diary' },
  { to: '/stats', key: 'nav.stats' },
  { to: '/data', key: 'nav.dataPoints' },
  { to: '/theme', key: 'nav.theme' },
  { to: '/about', key: 'nav.about' },
  { to: '/settings', key: 'nav.backup' },
]
</script>

<template>
  <nav class="bg-raised border-b border-edge sticky top-0 z-40">
    <div class="px-4 py-3 flex items-center justify-between">
      <router-link
        to="/home"
        class="font-bold text-accent text-base tracking-tight"
        @click="closeMenu"
      >
        InkVault
      </router-link>

      <!-- Desktop nav -->
      <div class="hidden md:flex gap-1 items-center">
        <router-link
          v-for="link in navLinks"
          :key="link.to"
          :to="link.to"
          class="text-sm text-ink-muted hover:text-ink px-3 py-1.5 rounded-input transition-colors"
          active-class="text-accent bg-accent-tint font-medium"
        >
          {{ t(link.key) }}
        </router-link>
        <button
          @click="lock"
          class="text-sm text-danger hover:text-danger-dim px-3 py-1.5 rounded-input transition-colors ml-1"
        >
          {{ t('nav.lock') }}
        </button>
      </div>

      <!-- Mobile burger -->
      <button
        class="md:hidden p-1.5 text-ink-muted hover:text-ink transition-colors"
        :aria-expanded="menuOpen"
        :aria-label="t('nav.toggleMenu')"
        @click="menuOpen = !menuOpen"
      >
        <svg v-if="!menuOpen" width="20" height="20" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <rect y="3" width="20" height="2" rx="1"/>
          <rect y="9" width="20" height="2" rx="1"/>
          <rect y="15" width="20" height="2" rx="1"/>
        </svg>
        <svg v-else width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
          <line x1="4" y1="4" x2="16" y2="16"/>
          <line x1="16" y1="4" x2="4" y2="16"/>
        </svg>
      </button>
    </div>

  </nav>

  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-200"
      leave-active-class="transition-opacity duration-200"
      enter-from-class="opacity-0"
      leave-to-class="opacity-0"
    >
      <div
        v-if="menuOpen"
        class="fixed inset-0 bg-black/40 z-40 md:hidden"
        aria-hidden="true"
        @click="closeMenu"
      />
    </Transition>

    <Transition
      enter-active-class="transition-transform duration-200"
      leave-active-class="transition-transform duration-200"
      enter-from-class="translate-x-full"
      leave-to-class="translate-x-full"
    >
      <div
        v-if="menuOpen"
        class="fixed top-0 right-0 h-full w-64 bg-raised border-l border-edge shadow-elevated z-50 flex flex-col pt-4 pb-6 px-4 md:hidden"
        role="dialog"
        aria-modal="true"
        :aria-label="t('nav.toggleMenu')"
      >
        <div class="flex justify-end mb-4">
          <button
            @click="closeMenu"
            class="p-1.5 text-ink-muted hover:text-ink transition-colors"
            :aria-label="t('nav.toggleMenu')"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
              <line x1="4" y1="4" x2="16" y2="16"/>
              <line x1="16" y1="4" x2="4" y2="16"/>
            </svg>
          </button>
        </div>
        <router-link
          v-for="link in navLinks"
          :key="link.to"
          :to="link.to"
          class="text-sm text-ink-muted hover:text-ink px-3 py-3 rounded-input transition-colors"
          active-class="text-accent bg-accent-tint font-medium"
          @click="closeMenu"
        >
          {{ t(link.key) }}
        </router-link>
        <button
          @click="lock"
          class="text-sm text-danger hover:text-danger-dim px-3 py-3 rounded-input transition-colors text-left mt-auto"
        >
          {{ t('nav.lock') }}
        </button>
      </div>
    </Transition>
  </Teleport>
</template>
