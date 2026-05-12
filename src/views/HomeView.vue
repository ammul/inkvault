<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

const cards = [
  {
    icon: '📓',
    title: 'Diary',
    description: 'Write your daily entries and track how each day unfolds.',
    to: '/diary',
  },
  {
    icon: '📊',
    title: 'Statistics',
    description: 'Visualize your tracked data over time — spot trends and patterns.',
    to: '/stats',
  },
  {
    icon: '⚙️',
    title: 'Data Points',
    description: 'Configure what you track: mood, medication, habits, and more.',
    to: '/data',
  },
]
</script>

<template>
  <div class="max-w-md mx-auto mt-4 space-y-3">
    <h1 class="text-xl font-semibold text-ink mb-6">Welcome back</h1>
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
