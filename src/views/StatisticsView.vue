<script setup lang="ts">
import { ref, computed, reactive, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import type { TimeRange, ConfigFilter, MultiStringConfig, BooleanConfig } from '@/types'
import { useDiaryStore } from '@/stores/diary'
import { useDataPointsStore } from '@/stores/datapoints'
import StatsPanel from '@/components/stats/StatsPanel.vue'

const { t } = useI18n()
const diary = useDiaryStore()
const datapoints = useDataPointsStore()

onMounted(async () => {
  if (!diary.loaded) await diary.loadEntries()
  if (!datapoints.loaded) await datapoints.loadConfigs()
})

const rangeLabel = ref<'week' | 'month' | 'year' | 'all'>('month')

const timeRange = computed((): TimeRange => {
  const today = new Date()
  const end = today.toISOString().slice(0, 10)
  let start: string

  if (rangeLabel.value === 'week') {
    const d = new Date(today)
    d.setDate(d.getDate() - 7)
    start = d.toISOString().slice(0, 10)
  } else if (rangeLabel.value === 'month') {
    const d = new Date(today)
    d.setMonth(d.getMonth() - 1)
    start = d.toISOString().slice(0, 10)
  } else if (rangeLabel.value === 'year') {
    const d = new Date(today)
    d.setFullYear(d.getFullYear() - 1)
    start = d.toISOString().slice(0, 10)
  } else {
    start = '0000-01-01'
  }

  return { start, end, label: rangeLabel.value }
})

const showFilters = ref(false)
const expandedFilterIds = ref<string[]>([])
const configFilters = reactive<Record<string, ConfigFilter>>({})

function emptyFilter(): ConfigFilter {
  return {
    rangeMin: null,
    rangeMax: null,
    boolValue: null,
    multiStringIncludes: [],
    stringSearch: '',
    medicationAmountMin: null,
    medicationAmountMax: null,
  }
}

function togglePill(id: string) {
  const idx = expandedFilterIds.value.indexOf(id)
  if (idx === -1) {
    if (!configFilters[id]) configFilters[id] = emptyFilter()
    expandedFilterIds.value.push(id)
  } else {
    expandedFilterIds.value.splice(idx, 1)
  }
}

function isFilterActive(id: string): boolean {
  const f = configFilters[id]
  if (!f) return false
  return (
    f.rangeMin !== null ||
    f.rangeMax !== null ||
    f.boolValue !== null ||
    f.multiStringIncludes.length > 0 ||
    f.stringSearch.trim().length > 0 ||
    f.medicationAmountMin !== null ||
    f.medicationAmountMax !== null
  )
}

function clearConfigFilter(id: string) {
  configFilters[id] = emptyFilter()
}

function clearAllFilters() {
  for (const id of Object.keys(configFilters)) {
    configFilters[id] = emptyFilter()
  }
}

const hasActiveFilter = computed(() => datapoints.configs.some((c) => isFilterActive(c.id)))

const visibleConfigs = computed(() => {
  if (!hasActiveFilter.value) return datapoints.configs
  return datapoints.configs.filter((c) => isFilterActive(c.id))
})

const expandedFilterConfigs = computed(() =>
  datapoints.configs.filter((c) => expandedFilterIds.value.includes(c.id)),
)

function parseNullableNumber(val: string): number | null {
  return val === '' ? null : Number(val)
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-3">
      <div class="flex items-center gap-2">
        <h1 class="text-xl font-semibold text-ink">{{ t('statistics.title') }}</h1>
        <span
          v-if="hasActiveFilter && !showFilters"
          class="text-xs px-1.5 py-0.5 rounded bg-accent/15 text-accent font-medium"
        >
          {{ t('statistics.filter.activeHint') }}
        </span>
      </div>
      <div class="flex items-center gap-2">
        <select
          v-model="rangeLabel"
          class="border border-edge rounded-input px-3 py-2 text-sm text-ink bg-raised focus:outline-none focus:ring-2 focus:ring-accent/25 focus:border-accent transition-colors"
        >
          <option value="week">{{ t('statistics.range.week') }}</option>
          <option value="month">{{ t('statistics.range.month') }}</option>
          <option value="year">{{ t('statistics.range.year') }}</option>
          <option value="all">{{ t('statistics.range.all') }}</option>
        </select>
        <button
          @click="showFilters = !showFilters"
          class="relative border border-edge rounded-input px-3 py-2 text-sm text-ink bg-raised hover:bg-surface focus:outline-none focus:ring-2 focus:ring-accent/25 focus:border-accent transition-colors flex items-center gap-1.5"
          :class="showFilters ? 'border-accent text-accent' : ''"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="w-4 h-4"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fill-rule="evenodd"
              d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L13 10.414V17a1 1 0 01-.553.894l-4 2A1 1 0 017 19v-8.586L3.293 6.707A1 1 0 013 6V3z"
              clip-rule="evenodd"
            />
          </svg>
          {{ t('statistics.filter.label') }}
          <span
            v-if="hasActiveFilter"
            class="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-accent"
          />
        </button>
      </div>
    </div>

    <div
      v-if="showFilters"
      class="bg-raised border border-edge rounded-card p-4 mb-4 space-y-4"
    >
      <!-- Pill buttons — one per data point -->
      <div>
        <p class="text-xs font-medium text-ink-muted mb-2">
          {{ t('statistics.filter.dataPoints') }}
        </p>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="config in datapoints.configs"
            :key="config.id"
            @click="togglePill(config.id)"
            class="relative inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full border transition-colors"
            :class="
              expandedFilterIds.includes(config.id)
                ? 'border-accent text-accent bg-accent/5'
                : 'border-edge text-ink hover:border-ink-muted'
            "
          >
            <span>{{ config.icon }}</span>
            <span>{{ config.label }}</span>
            <span
              v-if="isFilterActive(config.id)"
              class="w-1.5 h-1.5 rounded-full bg-accent flex-shrink-0"
            />
          </button>
        </div>
      </div>

      <!-- Per-config filter sections for expanded pills -->
      <template v-for="config in expandedFilterConfigs" :key="config.id">
        <div class="border-t border-edge pt-3">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs font-medium text-ink flex items-center gap-1.5">
              <span>{{ config.icon }}</span>
              <span>{{ config.label }}</span>
            </span>
            <button
              v-if="isFilterActive(config.id)"
              @click="clearConfigFilter(config.id)"
              class="text-xs text-ink-muted hover:text-ink transition-colors leading-none"
              :aria-label="t('statistics.filter.clear')"
            >
              ×
            </button>
          </div>

          <!-- Range -->
          <div v-if="config.type === 'range'" class="flex items-center gap-2">
            <input
              type="number"
              :value="configFilters[config.id].rangeMin ?? ''"
              @input="
                configFilters[config.id].rangeMin = parseNullableNumber(
                  ($event.target as HTMLInputElement).value,
                )
              "
              :placeholder="t('statistics.filter.min')"
              class="w-24 border border-edge rounded-input px-3 py-2 text-sm text-ink bg-surface focus:outline-none focus:ring-2 focus:ring-accent/25 focus:border-accent transition-colors"
            />
            <span class="text-ink-muted">–</span>
            <input
              type="number"
              :value="configFilters[config.id].rangeMax ?? ''"
              @input="
                configFilters[config.id].rangeMax = parseNullableNumber(
                  ($event.target as HTMLInputElement).value,
                )
              "
              :placeholder="t('statistics.filter.max')"
              class="w-24 border border-edge rounded-input px-3 py-2 text-sm text-ink bg-surface focus:outline-none focus:ring-2 focus:ring-accent/25 focus:border-accent transition-colors"
            />
          </div>

          <!-- Boolean -->
          <div v-else-if="config.type === 'boolean'" class="flex gap-1.5">
            <button
              v-for="opt in ([null, true, false] as const)"
              :key="String(opt)"
              @click="configFilters[config.id].boolValue = opt"
              class="text-sm px-3 py-1.5 rounded-input border transition-colors"
              :class="
                configFilters[config.id].boolValue === opt
                  ? 'border-accent text-accent bg-accent/5'
                  : 'border-edge text-ink-muted hover:text-ink hover:border-ink-muted'
              "
            >
              {{
                opt === null
                  ? t('statistics.filter.boolAll')
                  : opt
                    ? (config.config as BooleanConfig).trueLabel
                    : (config.config as BooleanConfig).falseLabel
              }}
            </button>
          </div>

          <!-- Multi-string -->
          <div
            v-else-if="config.type === 'multi-string'"
            class="flex flex-wrap gap-2"
          >
            <label
              v-for="opt in (config.config as MultiStringConfig).options"
              :key="opt"
              class="flex items-center gap-1.5 cursor-pointer"
            >
              <input
                type="checkbox"
                :value="opt"
                v-model="configFilters[config.id].multiStringIncludes"
                class="rounded border-edge accent-accent"
              />
              <span class="text-sm text-ink">{{ opt }}</span>
            </label>
          </div>

          <!-- String -->
          <input
            v-else-if="config.type === 'string'"
            v-model="configFilters[config.id].stringSearch"
            type="text"
            :placeholder="t('statistics.filter.stringSearchPlaceholder')"
            class="w-full border border-edge rounded-input px-3 py-2 text-sm text-ink bg-surface focus:outline-none focus:ring-2 focus:ring-accent/25 focus:border-accent transition-colors"
          />

          <!-- Medication -->
          <div v-else-if="config.type === 'medication'" class="flex items-center gap-2">
            <input
              type="number"
              :value="configFilters[config.id].medicationAmountMin ?? ''"
              @input="
                configFilters[config.id].medicationAmountMin = parseNullableNumber(
                  ($event.target as HTMLInputElement).value,
                )
              "
              :placeholder="t('statistics.filter.min')"
              class="w-24 border border-edge rounded-input px-3 py-2 text-sm text-ink bg-surface focus:outline-none focus:ring-2 focus:ring-accent/25 focus:border-accent transition-colors"
            />
            <span class="text-ink-muted">–</span>
            <input
              type="number"
              :value="configFilters[config.id].medicationAmountMax ?? ''"
              @input="
                configFilters[config.id].medicationAmountMax = parseNullableNumber(
                  ($event.target as HTMLInputElement).value,
                )
              "
              :placeholder="t('statistics.filter.max')"
              class="w-24 border border-edge rounded-input px-3 py-2 text-sm text-ink bg-surface focus:outline-none focus:ring-2 focus:ring-accent/25 focus:border-accent transition-colors"
            />
          </div>
        </div>
      </template>

      <div v-if="hasActiveFilter" class="flex justify-end border-t border-edge pt-3">
        <button
          @click="clearAllFilters"
          class="text-sm px-3 py-1.5 rounded-input border border-edge text-ink-muted hover:text-ink hover:border-accent transition-colors"
        >
          {{ t('statistics.filter.clear') }}
        </button>
      </div>
    </div>

    <div v-if="datapoints.configs.length" class="space-y-4">
      <StatsPanel
        v-for="config in visibleConfigs"
        :key="config.id"
        :config="config"
        :time-range="timeRange"
        :filter="configFilters[config.id] ?? null"
      />
    </div>
    <p v-else class="text-center text-ink-faint text-sm py-16">
      {{ t('statistics.noDataPointsPrefix') }}
      <router-link to="/data" class="text-accent hover:text-accent-dim transition-colors">{{
        t('statistics.noDataPointsLink')
      }}</router-link>.
    </p>
  </div>
</template>
