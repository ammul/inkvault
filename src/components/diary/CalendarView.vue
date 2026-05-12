<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useDiaryStore } from '@/stores/diary'

const { t, locale } = useI18n()
const router = useRouter()
const diary = useDiaryStore()

const today = new Date()
const currentYear = ref(today.getFullYear())
const currentMonth = ref(today.getMonth())

const monthLabel = computed(() =>
  new Date(currentYear.value, currentMonth.value).toLocaleDateString(locale.value, {
    month: 'long',
    year: 'numeric',
  }),
)

function toIsoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const todayStr = toIsoDate(today)

const days = computed(() => {
  const year = currentYear.value
  const month = currentMonth.value
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const cells: Array<{
    date: string | null
    day: number | null
    hasEntry: boolean
    isToday: boolean
  }> = []

  for (let i = 0; i < firstDay; i++) {
    cells.push({ date: null, day: null, hasEntry: false, isToday: false })
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const date = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    cells.push({
      date,
      day: d,
      hasEntry: !!diary.getEntry(date),
      isToday: date === todayStr,
    })
  }

  return cells
})

function prevMonth() {
  if (currentMonth.value === 0) {
    currentMonth.value = 11
    currentYear.value--
  } else {
    currentMonth.value--
  }
}

function nextMonth() {
  if (currentMonth.value === 11) {
    currentMonth.value = 0
    currentYear.value++
  } else {
    currentMonth.value++
  }
}

function openDay(date: string | null) {
  if (date) router.push(`/diary/${date}`)
}
</script>

<template>
  <div class="bg-raised rounded-card border border-edge shadow-card p-5">
    <!-- Month navigation -->
    <div class="flex items-center justify-between mb-5">
      <button
        @click="prevMonth"
        class="w-8 h-8 flex items-center justify-center rounded-input text-ink-muted hover:bg-subtle hover:text-ink transition-colors text-lg leading-none"
      >
        ‹
      </button>
      <span class="font-semibold text-ink">{{ monthLabel }}</span>
      <button
        @click="nextMonth"
        class="w-8 h-8 flex items-center justify-center rounded-input text-ink-muted hover:bg-subtle hover:text-ink transition-colors text-lg leading-none"
      >
        ›
      </button>
    </div>

    <!-- Day-of-week headers -->
    <div class="grid grid-cols-7 gap-1 text-center text-xs font-medium text-ink-faint mb-2">
      <div v-for="(d, i) in t('diary.weekdays')" :key="i">{{ d }}</div>
    </div>

    <!-- Day grid -->
    <div class="grid grid-cols-7 gap-1">
      <div
        v-for="(cell, i) in days"
        :key="i"
        @click="openDay(cell.date)"
        :class="[
          'aspect-square flex flex-col items-center justify-center rounded-input text-sm transition-colors select-none',
          cell.date ? 'cursor-pointer' : '',
          cell.isToday
            ? 'bg-accent text-on-accent font-semibold'
            : cell.hasEntry
              ? 'bg-accent-tint text-accent font-medium hover:bg-accent/20'
              : cell.date
                ? 'text-ink hover:bg-subtle'
                : 'text-ink-faint',
        ]"
      >
        <span v-if="cell.day">{{ cell.day }}</span>
        <span v-if="cell.hasEntry && !cell.isToday" class="block w-1 h-1 rounded-pill bg-accent mt-0.5" />
      </div>
    </div>
  </div>
</template>
