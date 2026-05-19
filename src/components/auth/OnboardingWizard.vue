<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useThemeStore } from '@/stores/theme'
import { useAppSettingsStore } from '@/stores/appSettings'
import { useAuthStore } from '@/stores/auth'
import type { ThemeMood } from '@/types'

const { t } = useI18n()
const theme = useThemeStore()
const appSettings = useAppSettingsStore()
const auth = useAuthStore()

const TOTAL = 4
const step = ref(0)
const saving = ref(false)

const moods: ThemeMood[] = ['minimal', 'cozy', 'dark', 'system']

async function setMood(mood: ThemeMood) {
  theme.settings.mood = mood
  theme.apply()
  await theme.save()
}

async function dismiss() {
  if (saving.value) return
  saving.value = true
  try {
    await appSettings.save()
  } finally {
    saving.value = false
    auth.isNewVault = false
  }
}

async function next() {
  if (step.value < TOTAL - 1) {
    step.value++
  } else {
    await dismiss()
  }
}

function back() {
  if (step.value > 0) step.value--
}
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-surface p-4">
    <div class="w-full max-w-sm">

      <!-- Header: step dots + skip -->
      <div class="flex items-center justify-between mb-6">
        <div class="flex gap-1.5">
          <div
            v-for="i in TOTAL"
            :key="i"
            class="w-2 h-2 rounded-full transition-colors"
            :class="i - 1 <= step ? 'bg-accent' : 'bg-edge-strong'"
          />
        </div>
        <button
          @click="dismiss"
          :disabled="saving"
          class="text-sm text-ink-muted hover:text-ink transition-colors disabled:opacity-50"
        >
          {{ t('onboarding.skip') }}
        </button>
      </div>

      <!-- Card -->
      <div class="bg-raised rounded-card border border-edge shadow-elevated p-6 space-y-5">

        <!-- Step 1: Mood -->
        <template v-if="step === 0">
          <div>
            <h2 class="font-semibold text-ink">{{ t('onboarding.mood.title') }}</h2>
            <p class="text-sm text-ink-muted mt-1">{{ t('onboarding.mood.description') }}</p>
          </div>
          <div class="grid grid-cols-2 gap-2">
            <button
              v-for="mood in moods"
              :key="mood"
              @click="setMood(mood)"
              :class="[
                'flex flex-col items-start gap-1 p-3 rounded-card border-2 transition-all text-left',
                theme.settings.mood === mood
                  ? 'border-accent bg-accent-tint'
                  : 'border-edge hover:border-accent/40 hover:bg-subtle',
              ]"
            >
              <span class="text-sm font-medium" :class="theme.settings.mood === mood ? 'text-accent' : 'text-ink'">
                {{ t(`theme.mood.${mood}.label`) }}
              </span>
              <span class="text-xs text-ink-muted">{{ t(`theme.mood.${mood}.description`) }}</span>
            </button>
          </div>
        </template>

        <!-- Step 2: Clock display -->
        <template v-else-if="step === 1">
          <div>
            <h2 class="font-semibold text-ink">{{ t('onboarding.clock.title') }}</h2>
            <p class="text-sm text-ink-muted mt-1">{{ t('onboarding.clock.description') }}</p>
          </div>
          <div class="grid grid-cols-2 gap-2">
            <button
              v-for="opt in ([
                { value: '24h', example: '14:30', label: t('appSettings.clockDisplay24h') },
                { value: 'ampm', example: '2:30 PM', label: t('appSettings.clockDisplayAmpm') },
              ] as const)"
              :key="opt.value"
              @click="appSettings.settings.clockDisplay = opt.value"
              :class="[
                'flex flex-col items-center gap-2 p-4 rounded-card border-2 transition-all',
                appSettings.settings.clockDisplay === opt.value
                  ? 'border-accent bg-accent-tint'
                  : 'border-edge hover:border-accent/40 hover:bg-subtle',
              ]"
            >
              <span
                class="text-xl font-mono font-medium tabular-nums"
                :class="appSettings.settings.clockDisplay === opt.value ? 'text-accent' : 'text-ink'"
              >{{ opt.example }}</span>
              <span class="text-xs text-ink-muted">{{ opt.label }}</span>
            </button>
          </div>
        </template>

        <!-- Step 3: Date format -->
        <template v-else-if="step === 2">
          <div>
            <h2 class="font-semibold text-ink">{{ t('onboarding.date.title') }}</h2>
            <p class="text-sm text-ink-muted mt-1">{{ t('onboarding.date.description') }}</p>
          </div>
          <div class="grid grid-cols-2 gap-2">
            <button
              v-for="opt in ([
                { value: 'locale', example: 'Dec 25', label: t('appSettings.dateFormatLocale') },
                { value: 'dmy', example: '25.12.2025', label: t('appSettings.dateFormatDmy') },
              ] as const)"
              :key="opt.value"
              @click="appSettings.settings.dateFormat = opt.value"
              :class="[
                'flex flex-col items-center gap-2 p-4 rounded-card border-2 transition-all',
                appSettings.settings.dateFormat === opt.value
                  ? 'border-accent bg-accent-tint'
                  : 'border-edge hover:border-accent/40 hover:bg-subtle',
              ]"
            >
              <span
                class="text-base font-medium"
                :class="appSettings.settings.dateFormat === opt.value ? 'text-accent' : 'text-ink'"
              >{{ opt.example }}</span>
              <span class="text-xs text-ink-muted">{{ opt.label }}</span>
            </button>
          </div>
        </template>

        <!-- Step 4: Emojis -->
        <template v-else-if="step === 3">
          <div>
            <h2 class="font-semibold text-ink">{{ t('onboarding.emojis.title') }}</h2>
            <p class="text-sm text-ink-muted mt-1">{{ t('onboarding.emojis.description') }}</p>
          </div>
          <div class="grid grid-cols-2 gap-2">
            <button
              v-for="opt in ([
                { value: true, example: '😊 Mood', label: t('onboarding.emojis.on') },
                { value: false, example: 'M Mood', label: t('onboarding.emojis.off') },
              ] as const)"
              :key="String(opt.value)"
              @click="appSettings.settings.useEmojis = opt.value"
              :class="[
                'flex flex-col items-center gap-2 p-4 rounded-card border-2 transition-all',
                appSettings.settings.useEmojis === opt.value
                  ? 'border-accent bg-accent-tint'
                  : 'border-edge hover:border-accent/40 hover:bg-subtle',
              ]"
            >
              <span
                class="text-base font-medium"
                :class="appSettings.settings.useEmojis === opt.value ? 'text-accent' : 'text-ink'"
              >{{ opt.example }}</span>
              <span class="text-xs text-ink-muted">{{ opt.label }}</span>
            </button>
          </div>
        </template>

        <!-- Navigation -->
        <div class="flex gap-2 pt-1">
          <button
            v-if="step > 0"
            @click="back"
            class="flex-1 border border-edge text-ink-muted rounded-input px-4 py-2.5 text-sm font-medium hover:bg-subtle transition-colors"
          >
            {{ t('onboarding.back') }}
          </button>
          <button
            @click="next"
            :disabled="saving"
            class="flex-1 bg-accent text-on-accent rounded-input px-4 py-2.5 text-sm font-semibold hover:bg-accent-dim disabled:opacity-50 transition-colors"
          >
            {{ step === TOTAL - 1 ? t('onboarding.finish') : t('onboarding.next') }}
          </button>
        </div>
      </div>

    </div>
  </div>
</template>
