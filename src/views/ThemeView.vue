<script setup lang="ts">
import { onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useThemeStore } from '@/stores/theme'
import { useAppSettingsStore } from '@/stores/appSettings'
import type { ColorTheme, ThemeFont, ThemeMood, ThemeFontSize } from '@/types'

const { t } = useI18n()
const theme = useThemeStore()
const appSettings = useAppSettingsStore()

onMounted(async () => {
  if (!theme.loaded) await theme.load()
  if (!appSettings.loaded) await appSettings.load()
})

async function setMood(mood: ThemeMood) {
  theme.settings.mood = mood
  theme.apply()
  await theme.save()
}

async function setColor(colorTheme: ColorTheme) {
  theme.settings.colorTheme = colorTheme
  theme.apply()
  await theme.save()
}

async function setFont(font: ThemeFont) {
  theme.settings.font = font
  theme.apply()
  await theme.save()
}

async function setFontSize(fontSize: ThemeFontSize) {
  theme.settings.fontSize = fontSize
  theme.apply()
  await theme.save()
}

async function setAnimations(val: boolean) {
  appSettings.settings.animations = val
  appSettings.apply()
  await appSettings.save()
}

async function setUseEmojis(val: boolean) {
  appSettings.settings.useEmojis = val
  await appSettings.save()
}

const moods: { value: ThemeMood }[] = [
  { value: 'minimal' },
  { value: 'cozy' },
  { value: 'dark' },
  { value: 'system' },
]

const colors: { value: ColorTheme; hex: string }[] = [
  { value: 'indigo', hex: '#4f46e5' },
  { value: 'violet', hex: '#7c3aed' },
  { value: 'teal', hex: '#0d9488' },
  { value: 'rose', hex: '#e11d48' },
  { value: 'amber', hex: '#d97706' },
  { value: 'slate', hex: '#475569' },
]

const fonts: { value: ThemeFont; sample: string }[] = [
  { value: 'sans', sample: 'system-ui, -apple-system, sans-serif' },
  { value: 'serif', sample: 'Georgia, serif' },
  { value: 'mono', sample: 'ui-monospace, monospace' },
]

const fontSizes: { value: ThemeFontSize }[] = [
  { value: 'sm' },
  { value: 'md' },
  { value: 'lg' },
]
</script>

<template>
  <div class="max-w-lg mx-auto space-y-8 pb-12">
    <h1 class="text-xl font-semibold text-ink">{{ t('theme.title') }}</h1>

    <!-- Mood -->
    <section class="bg-raised border border-edge rounded-card shadow-card p-6 space-y-4">
      <div>
        <h2 class="font-semibold text-ink">{{ t('theme.mood.title') }}</h2>
        <p class="text-sm text-ink-muted mt-1">{{ t('theme.mood.subtitle') }}</p>
      </div>
      <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <button
          v-for="mood in moods"
          :key="mood.value"
          @click="setMood(mood.value)"
          :class="[
            'flex flex-col items-center gap-2 p-4 rounded-card border-2 transition-all text-center',
            theme.settings.mood === mood.value
              ? 'border-accent bg-accent-tint'
              : 'border-edge hover:border-accent/40 hover:bg-subtle',
          ]"
        >
          <span
            class="text-sm font-medium"
            :class="theme.settings.mood === mood.value ? 'text-accent' : 'text-ink'"
          >
            {{ t(`theme.mood.${mood.value}.label`) }}
          </span>
          <span class="text-xs text-ink-muted">{{ t(`theme.mood.${mood.value}.description`) }}</span>
        </button>
      </div>
    </section>

    <!-- Color theme -->
    <section class="bg-raised border border-edge rounded-card shadow-card p-6 space-y-4">
      <div>
        <h2 class="font-semibold text-ink">{{ t('theme.color.title') }}</h2>
        <p class="text-sm text-ink-muted mt-1">{{ t('theme.color.subtitle') }}</p>
      </div>
      <div class="grid grid-cols-3 gap-2">
        <button
          v-for="color in colors"
          :key="color.value"
          @click="setColor(color.value)"
          :class="[
            'flex items-center gap-2.5 px-3 py-2.5 rounded-card border-2 transition-all',
            theme.settings.colorTheme === color.value
              ? 'border-accent bg-accent-tint'
              : 'border-edge hover:border-edge-strong',
          ]"
        >
          <span
            class="w-4 h-4 rounded-pill shrink-0"
            :style="{ backgroundColor: color.hex }"
          />
          <span
            class="text-sm font-medium"
            :class="theme.settings.colorTheme === color.value ? 'text-accent' : 'text-ink'"
          >
            {{ t(`theme.color.${color.value}`) }}
          </span>
        </button>
      </div>
    </section>

    <!-- Font -->
    <section class="bg-raised border border-edge rounded-card shadow-card p-6 space-y-4">
      <div>
        <h2 class="font-semibold text-ink">{{ t('theme.font.title') }}</h2>
        <p class="text-sm text-ink-muted mt-1">{{ t('theme.font.subtitle') }}</p>
      </div>
      <div class="space-y-2">
        <button
          v-for="font in fonts"
          :key="font.value"
          @click="setFont(font.value)"
          :class="[
            'w-full flex items-center justify-between px-4 py-3 rounded-card border-2 transition-all text-left',
            theme.settings.font === font.value
              ? 'border-accent bg-accent-tint'
              : 'border-edge hover:border-accent/40 hover:bg-subtle',
          ]"
        >
          <span
            class="font-medium text-sm"
            :class="theme.settings.font === font.value ? 'text-accent' : 'text-ink'"
            :style="{ fontFamily: font.sample }"
          >
            {{ t(`theme.font.${font.value}`) }}
          </span>
          <span
            class="text-xs text-ink-faint"
            :style="{ fontFamily: font.sample }"
          >
            Aa Bb Cc
          </span>
        </button>
      </div>
    </section>

    <!-- Text size -->
    <section class="bg-raised border border-edge rounded-card shadow-card p-6 space-y-4">
      <div>
        <h2 class="font-semibold text-ink">{{ t('theme.fontSize.title') }}</h2>
        <p class="text-sm text-ink-muted mt-1">{{ t('theme.fontSize.subtitle') }}</p>
      </div>
      <div class="grid grid-cols-3 gap-3">
        <button
          v-for="size in fontSizes"
          :key="size.value"
          @click="setFontSize(size.value)"
          :class="[
            'flex flex-col items-center gap-2 p-4 rounded-card border-2 transition-all text-center',
            theme.settings.fontSize === size.value
              ? 'border-accent bg-accent-tint'
              : 'border-edge hover:border-accent/40 hover:bg-subtle',
          ]"
        >
          <span
            class="font-medium text-sm"
            :class="theme.settings.fontSize === size.value ? 'text-accent' : 'text-ink'"
          >
            {{ t(`theme.fontSize.${size.value}.label`) }}
          </span>
          <span class="text-xs text-ink-muted">{{ t(`theme.fontSize.${size.value}.description`) }}</span>
        </button>
      </div>
    </section>

    <!-- Behavior -->
    <section class="bg-raised border border-edge rounded-card shadow-card p-6 space-y-3">
      <div class="mb-1">
        <h2 class="font-semibold text-ink">{{ t('appSettings.appearance') }}</h2>
      </div>

      <div class="flex items-start justify-between gap-4">
        <div>
          <p class="text-sm font-medium text-ink">{{ t('appSettings.animations') }}</p>
          <p class="text-xs text-ink-muted mt-0.5">{{ t('appSettings.animationsDescription') }}</p>
        </div>
        <div class="flex gap-1 shrink-0">
          <button
            @click="setAnimations(true)"
            :class="appSettings.settings.animations
              ? 'bg-accent text-on-accent'
              : 'bg-subtle text-ink-muted hover:bg-edge'"
            class="text-sm px-3 py-1.5 rounded-input transition-colors font-medium"
          >{{ t('appSettings.on') }}</button>
          <button
            @click="setAnimations(false)"
            :class="!appSettings.settings.animations
              ? 'bg-accent text-on-accent'
              : 'bg-subtle text-ink-muted hover:bg-edge'"
            class="text-sm px-3 py-1.5 rounded-input transition-colors font-medium"
          >{{ t('appSettings.off') }}</button>
        </div>
      </div>

      <div class="border-t border-edge pt-3 flex items-start justify-between gap-4">
        <div>
          <p class="text-sm font-medium text-ink">{{ t('appSettings.useEmojis') }}</p>
          <p class="text-xs text-ink-muted mt-0.5">{{ t('appSettings.useEmojisDescription') }}</p>
        </div>
        <div class="flex gap-1 shrink-0">
          <button
            @click="setUseEmojis(true)"
            :class="appSettings.settings.useEmojis
              ? 'bg-accent text-on-accent'
              : 'bg-subtle text-ink-muted hover:bg-edge'"
            class="text-sm px-3 py-1.5 rounded-input transition-colors font-medium"
          >{{ t('appSettings.on') }}</button>
          <button
            @click="setUseEmojis(false)"
            :class="!appSettings.settings.useEmojis
              ? 'bg-accent text-on-accent'
              : 'bg-subtle text-ink-muted hover:bg-edge'"
            class="text-sm px-3 py-1.5 rounded-input transition-colors font-medium"
          >{{ t('appSettings.off') }}</button>
        </div>
      </div>
    </section>
  </div>
</template>
