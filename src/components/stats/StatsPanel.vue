<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { DataPointConfig, TimeRange, DataPointValue, ConfigFilter, MedicationValue } from '@/types'
import { useDiaryStore } from '@/stores/diary'

const { t } = useI18n()

const props = defineProps<{
  config: DataPointConfig
  timeRange: TimeRange
  filter: ConfigFilter | null
}>()

const diary = useDiaryStore()

const values = computed(() => {
  let list = [...diary.entries.values()]
    .filter((e) => e.date >= props.timeRange.start && e.date <= props.timeRange.end)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((e) => ({ date: e.date, value: e.dataValues[props.config.id] ?? null }))
    .filter((v) => v.value !== null && !(Array.isArray(v.value) && v.value.length === 0))

  if (!props.filter) return list

  if (props.config.type === 'range') {
    if (props.filter.rangeMin !== null)
      list = list.filter((v) => (v.value as number) >= props.filter!.rangeMin!)
    if (props.filter.rangeMax !== null)
      list = list.filter((v) => (v.value as number) <= props.filter!.rangeMax!)
  } else if (props.config.type === 'boolean') {
    if (props.filter.boolValue !== null)
      list = list.filter((v) => v.value === props.filter!.boolValue)
  } else if (props.config.type === 'multi-string') {
    if (props.filter.multiStringIncludes.length > 0)
      list = list.filter((v) =>
        (v.value as string[]).some((o) => props.filter!.multiStringIncludes.includes(o)),
      )
  } else if (props.config.type === 'string') {
    const q = props.filter.stringSearch.trim().toLowerCase()
    if (q) list = list.filter((v) => (v.value as string).toLowerCase().includes(q))
  } else if (props.config.type === 'medication') {
    if (props.filter.medicationAmountMin !== null)
      list = list.filter(
        (v) => (v.value as MedicationValue).amount >= props.filter!.medicationAmountMin!,
      )
    if (props.filter.medicationAmountMax !== null)
      list = list.filter(
        (v) => (v.value as MedicationValue).amount <= props.filter!.medicationAmountMax!,
      )
  }

  return list
})

const average = computed(() => {
  if (props.config.type !== 'range') return null
  const nums = values.value.map((v) => v.value as number)
  if (!nums.length) return null
  return (nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(1)
})

function formatValue(v: DataPointValue): string {
  if (v === null) return '—'
  if (Array.isArray(v)) return v.join(', ')
  if (typeof v === 'object') return `${v.amount} ${v.unit}${v.time ? ' at ' + v.time : ''}`
  return String(v)
}
</script>

<template>
  <div class="bg-raised rounded-card border border-edge shadow-card p-4">
    <div class="flex items-center gap-2 mb-3">
      <span class="text-lg">{{ config.icon }}</span>
      <h3 class="font-semibold text-ink">{{ config.label }}</h3>
      <span v-if="average !== null" class="ml-auto text-sm text-ink-muted">
        {{ t('statistics.avg') }} <span class="font-medium text-ink">{{ average }}</span>
      </span>
    </div>

    <div v-if="values.length" class="space-y-1">
      <div
        v-for="item in values"
        :key="item.date"
        class="flex justify-between text-sm py-0.5"
      >
        <span class="text-ink-faint">{{ item.date }}</span>
        <span class="text-ink">{{ formatValue(item.value) }}</span>
      </div>
    </div>
    <p v-else class="text-sm text-ink-faint text-center py-3">{{ t('statistics.noData') }}</p>
  </div>
</template>
