<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { ConfigFilter, MultiStringConfig, BooleanConfig } from '@/types'
import { useTrackersStore } from '@/stores/trackers'
import TrackerIcon from '@/components/ui/TrackerIcon.vue'

const { t } = useI18n()
const trackers = useTrackersStore()

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

function parseNullableNumber(val: string): number | null {
  return val === '' ? null : Number(val)
}

const expandedFilterConfigs = computed(() =>
  trackers.configs.filter(c => expandedFilterIds.value.includes(c.id)),
)

const hasActiveFilter = computed(() => trackers.configs.some(c => isFilterActive(c.id)))

defineExpose({ configFilters, hasActiveFilter, isFilterActive })
</script>

<template>
  <div class="bg-raised border border-edge rounded-card p-4 mb-4 space-y-4">
    <!-- Pill buttons -->
    <div>
      <p class="text-xs font-medium text-ink-muted mb-2">{{ t('statistics.filter.trackers') }}</p>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="config in trackers.configs"
          :key="config.id"
          @click="togglePill(config.id)"
          class="relative inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full border transition-colors"
          :class="expandedFilterIds.includes(config.id)
            ? 'border-accent text-accent bg-accent/5'
            : 'border-edge text-ink hover:border-ink-muted'"
        >
          <TrackerIcon :icon="config.icon" :color="config.color" :label="config.label" size="sm" />
          <span>{{ config.label }}</span>
          <span v-if="isFilterActive(config.id)" class="w-1.5 h-1.5 rounded-full bg-accent flex-shrink-0" />
        </button>
      </div>
    </div>

    <!-- Per-config filter sections -->
    <template v-for="config in expandedFilterConfigs" :key="config.id">
      <div class="border-t border-edge pt-3">
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs font-medium text-ink flex items-center gap-1.5">
            <TrackerIcon :icon="config.icon" :color="config.color" :label="config.label" size="sm" />
            <span>{{ config.label }}</span>
          </span>
          <button
            v-if="isFilterActive(config.id)"
            @click="clearConfigFilter(config.id)"
            class="text-xs text-ink-muted hover:text-ink transition-colors leading-none"
            :aria-label="t('statistics.filter.clear')"
          >×</button>
        </div>

        <!-- Range -->
        <div v-if="config.type === 'range'" class="flex items-center gap-2">
          <input
            type="number"
            :value="configFilters[config.id].rangeMin ?? ''"
            @input="configFilters[config.id].rangeMin = parseNullableNumber(($event.target as HTMLInputElement).value)"
            :placeholder="t('statistics.filter.min')"
            class="w-24 border border-edge rounded-input px-3 py-2 text-sm text-ink bg-surface focus:outline-none focus:ring-2 focus:ring-accent/25 focus:border-accent transition-colors"
          />
          <span class="text-ink-muted">–</span>
          <input
            type="number"
            :value="configFilters[config.id].rangeMax ?? ''"
            @input="configFilters[config.id].rangeMax = parseNullableNumber(($event.target as HTMLInputElement).value)"
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
            :class="configFilters[config.id].boolValue === opt
              ? 'border-accent text-accent bg-accent/5'
              : 'border-edge text-ink-muted hover:text-ink hover:border-ink-muted'"
          >
            {{ opt === null ? t('statistics.filter.boolAll') : opt ? (config.config as BooleanConfig).trueLabel : (config.config as BooleanConfig).falseLabel }}
          </button>
        </div>

        <!-- Multi-string -->
        <div v-else-if="config.type === 'multi-string'" class="flex flex-wrap gap-2">
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
            @input="configFilters[config.id].medicationAmountMin = parseNullableNumber(($event.target as HTMLInputElement).value)"
            :placeholder="t('statistics.filter.min')"
            class="w-24 border border-edge rounded-input px-3 py-2 text-sm text-ink bg-surface focus:outline-none focus:ring-2 focus:ring-accent/25 focus:border-accent transition-colors"
          />
          <span class="text-ink-muted">–</span>
          <input
            type="number"
            :value="configFilters[config.id].medicationAmountMax ?? ''"
            @input="configFilters[config.id].medicationAmountMax = parseNullableNumber(($event.target as HTMLInputElement).value)"
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
      >{{ t('statistics.filter.clear') }}</button>
    </div>
  </div>
</template>
