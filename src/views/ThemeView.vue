<script setup lang="ts">
import { onMounted } from 'vue'
import { useThemeStore } from '@/stores/theme'
import type { ColorTheme, ThemeFont, ThemeMood } from '@/types'

const theme = useThemeStore()

onMounted(async () => {
  if (!theme.loaded) await theme.load()
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

const moods: { value: ThemeMood; label: string; description: string }[] = [
  { value: 'minimal', label: 'Minimal', description: 'Clean, airy, focused' },
  { value: 'cozy', label: 'Cozy', description: 'Warm, rounded, soft' },
  { value: 'dark', label: 'Dark', description: 'Dark, intimate, private' },
]

const colors: { value: ColorTheme; label: string; hex: string }[] = [
  { value: 'indigo', label: 'Indigo', hex: '#4f46e5' },
  { value: 'violet', label: 'Violet', hex: '#7c3aed' },
  { value: 'teal', label: 'Teal', hex: '#0d9488' },
  { value: 'rose', label: 'Rose', hex: '#e11d48' },
  { value: 'amber', label: 'Amber', hex: '#d97706' },
  { value: 'slate', label: 'Slate', hex: '#475569' },
]

const fonts: { value: ThemeFont; label: string; sample: string }[] = [
  { value: 'sans', label: 'Sans-serif', sample: 'system-ui, -apple-system, sans-serif' },
  { value: 'serif', label: 'Serif', sample: 'Georgia, serif' },
  { value: 'mono', label: 'Monospace', sample: 'ui-monospace, monospace' },
]
</script>

<template>
  <div class="max-w-lg mx-auto space-y-8 pb-12">
    <h1 class="text-xl font-semibold text-ink">Theme</h1>

    <!-- Mood -->
    <section class="bg-raised border border-edge rounded-card shadow-card p-6 space-y-4">
      <div>
        <h2 class="font-semibold text-ink">Mood</h2>
        <p class="text-sm text-ink-muted mt-1">Controls the overall atmosphere of the app.</p>
      </div>
      <div class="grid grid-cols-3 gap-3">
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
            {{ mood.label }}
          </span>
          <span class="text-xs text-ink-muted">{{ mood.description }}</span>
        </button>
      </div>
    </section>

    <!-- Color theme -->
    <section class="bg-raised border border-edge rounded-card shadow-card p-6 space-y-4">
      <div>
        <h2 class="font-semibold text-ink">Color</h2>
        <p class="text-sm text-ink-muted mt-1">Sets the accent color used for interactive elements.</p>
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
            {{ color.label }}
          </span>
        </button>
      </div>
    </section>

    <!-- Font -->
    <section class="bg-raised border border-edge rounded-card shadow-card p-6 space-y-4">
      <div>
        <h2 class="font-semibold text-ink">Font</h2>
        <p class="text-sm text-ink-muted mt-1">Changes the typeface used throughout the app.</p>
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
            {{ font.label }}
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
  </div>
</template>
