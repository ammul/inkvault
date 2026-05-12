<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useDiaryStore } from '@/stores/diary'

const router = useRouter()
const diary = useDiaryStore()

const today = new Date()
const currentYear = ref(today.getFullYear())
const currentMonth = ref(today.getMonth())

const monthLabel = computed(() =>
  new Date(currentYear.value, currentMonth.value).toLocaleDateString('en-US', {
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
  <div>
    <div class="flex items-center justify-between mb-4">
      <button @click="prevMonth" class="px-3 py-1 rounded hover:bg-gray-100 transition text-lg">
        ‹
      </button>
      <span class="font-semibold text-gray-800">{{ monthLabel }}</span>
      <button @click="nextMonth" class="px-3 py-1 rounded hover:bg-gray-100 transition text-lg">
        ›
      </button>
    </div>

    <div class="grid grid-cols-7 gap-1 text-center text-xs text-gray-400 mb-1">
      <div v-for="d in ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']" :key="d">{{ d }}</div>
    </div>

    <div class="grid grid-cols-7 gap-1">
      <div
        v-for="(cell, i) in days"
        :key="i"
        @click="openDay(cell.date)"
        :class="[
          'aspect-square flex flex-col items-center justify-center rounded-lg text-sm transition select-none',
          cell.date ? 'cursor-pointer hover:bg-indigo-50' : '',
          cell.isToday ? 'bg-indigo-100 font-bold text-indigo-700' : '',
          cell.hasEntry && !cell.isToday ? 'bg-emerald-50 text-emerald-700 font-medium' : '',
          !cell.hasEntry && !cell.isToday && cell.date ? 'text-gray-700' : '',
        ]"
      >
        <span v-if="cell.day">{{ cell.day }}</span>
        <span v-if="cell.hasEntry" class="block w-1 h-1 rounded-full bg-current mt-0.5" />
      </div>
    </div>
  </div>
</template>
