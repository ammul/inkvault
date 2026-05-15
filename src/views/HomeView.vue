<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const router = useRouter()
</script>

<template>
  <div class="max-w-md mx-auto mt-4 space-y-3">
    <h1 class="text-xl font-semibold text-ink mb-6">{{ t('home.welcomeBack') }}</h1>

    <!-- Primary CTA -->
    <button
      @click="router.push('/diary')"
      class="w-full p-5 bg-accent rounded-card shadow-card hover:bg-accent-dim active:scale-[0.99] transition-all text-left"
    >
      <p class="font-semibold text-on-accent text-base">{{ t('home.cards.diary.title') }}</p>
      <p class="text-sm text-on-accent/70 mt-0.5">{{ t('home.cards.diary.description') }}</p>
    </button>

    <!-- Secondary CTA -->
    <button
      @click="router.push('/stats')"
      class="w-full p-5 bg-raised rounded-card border-2 border-accent/30 hover:border-accent/60 active:scale-[0.99] transition-all text-left"
    >
      <p class="font-semibold text-ink text-base">{{ t('home.cards.statistics.title') }}</p>
      <p class="text-sm text-ink-muted mt-0.5">{{ t('home.cards.statistics.description') }}</p>
    </button>

    <!-- Secondary CTA -->
    <button
      @click="router.push('/data')"
      class="w-full p-5 bg-raised rounded-card border-2 border-accent/30 hover:border-accent/60 active:scale-[0.99] transition-all text-left"
    >
      <p class="font-semibold text-ink text-base">{{ t('home.cards.trackers.title') }}</p>
      <p class="text-sm text-ink-muted mt-0.5">{{ t('home.cards.trackers.description') }}</p>
    </button>
  </div>
</template>
