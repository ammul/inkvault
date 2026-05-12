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
  <div class="max-w-md mx-auto mt-8 space-y-4">
    <h1 class="text-2xl font-bold text-gray-800 text-center mb-6">Welcome to InkVault</h1>
    <button
      v-for="card in cards"
      :key="card.to"
      @click="router.push(card.to)"
      class="w-full flex items-start gap-4 p-5 bg-white rounded-xl border border-gray-200 hover:border-indigo-300 hover:shadow-sm transition text-left"
    >
      <span class="text-3xl leading-none">{{ card.icon }}</span>
      <div>
        <p class="font-semibold text-gray-800">{{ card.title }}</p>
        <p class="text-sm text-gray-500 mt-0.5">{{ card.description }}</p>
      </div>
    </button>
  </div>
</template>
