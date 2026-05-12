<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useDiaryStore } from '@/stores/diary'
import { useDataPointsStore } from '@/stores/datapoints'
import CalendarView from '@/components/diary/CalendarView.vue'
import DayEntry from '@/components/diary/DayEntry.vue'

const { t } = useI18n()
const route = useRoute()
const diary = useDiaryStore()
const datapoints = useDataPointsStore()

const selectedDate = computed(() => route.params.date as string | undefined)

onMounted(async () => {
  if (!diary.loaded) await diary.loadEntries()
  if (!datapoints.loaded) await datapoints.loadConfigs()
})
</script>

<template>
  <div>
    <h1 v-if="!selectedDate" class="text-xl font-semibold text-ink mb-6">{{ t('diary.title') }}</h1>
    <CalendarView v-if="!selectedDate" />
    <DayEntry v-else />
  </div>
</template>
