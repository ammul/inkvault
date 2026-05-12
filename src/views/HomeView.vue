<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const router = useRouter()

const cards = computed(() => [
  {
    icon: '📓',
    title: t('home.cards.diary.title'),
    description: t('home.cards.diary.description'),
    to: '/diary',
  },
  {
    icon: '📊',
    title: t('home.cards.statistics.title'),
    description: t('home.cards.statistics.description'),
    to: '/stats',
  },
  {
    icon: '⚙️',
    title: t('home.cards.dataPoints.title'),
    description: t('home.cards.dataPoints.description'),
    to: '/data',
  },
])
</script>

<template>
  <div class="max-w-md mx-auto mt-4 space-y-3">
    <h1 class="text-xl font-semibold text-ink mb-6">{{ t('home.welcomeBack') }}</h1>
    <button
      v-for="card in cards"
      :key="card.to"
      @click="router.push(card.to)"
      class="w-full flex items-start gap-4 p-5 bg-raised rounded-card border border-edge shadow-card hover:border-accent/40 hover:shadow-elevated transition-all text-left"
    >
      <span class="text-2xl leading-none mt-0.5">{{ card.icon }}</span>
      <div>
        <p class="font-medium text-ink">{{ card.title }}</p>
        <p class="text-sm text-ink-muted mt-0.5">{{ card.description }}</p>
      </div>
    </button>
  </div>
</template>
