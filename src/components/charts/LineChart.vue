<script setup lang="ts">
import { computed } from 'vue'
import type { ChartSeries } from '@/utils/chartAdapters'

const props = defineProps<{ series: ChartSeries }>()

const W = 400
const H = 180
const PAD = { top: 12, right: 16, bottom: 32, left: 44 }

const innerW = W - PAD.left - PAD.right
const innerH = H - PAD.top - PAD.bottom

const points = computed(() => props.series.points)
const yMin = computed(() => props.series.yMin)
const yMax = computed(() => props.series.yMax)
const yRange = computed(() => yMax.value - yMin.value || 1)

function xOf(i: number): number {
  if (points.value.length === 1) return PAD.left + innerW / 2
  return PAD.left + (i / (points.value.length - 1)) * innerW
}

function yOf(y: number): number {
  return PAD.top + innerH - ((y - yMin.value) / yRange.value) * innerH
}

const polyline = computed(() =>
  points.value.map((p, i) => `${xOf(i)},${yOf(p.y)}`).join(' '),
)

const xLabels = computed(() => {
  const pts = points.value
  if (!pts.length) return []
  if (pts.length === 1) return [{ label: pts[0].date.slice(5), x: xOf(0) }]
  const indices = new Set<number>([0, pts.length - 1])
  if (pts.length > 4) indices.add(Math.round((pts.length - 1) / 2))
  return [...indices].sort((a, b) => a - b).map((i) => ({
    label: pts[i].date.slice(5),
    x: xOf(i),
  }))
})

const yTicks = computed(() => {
  const labels = props.series.yLabels
  if (labels) {
    return Object.entries(labels).map(([v, text]) => ({
      y: yOf(Number(v)),
      text,
    }))
  }
  return [
    { y: yOf(yMin.value), text: String(yMin.value) },
    { y: yOf(yMax.value), text: String(yMax.value) },
  ]
})
</script>

<template>
  <svg
    :viewBox="`0 0 ${W} ${H}`"
    width="100%"
    :height="H"
    aria-hidden="true"
    class="overflow-visible"
  >
    <!-- Y-axis grid lines + labels -->
    <g v-for="tick in yTicks" :key="tick.text">
      <line
        :x1="PAD.left"
        :y1="tick.y"
        :x2="PAD.left + innerW"
        :y2="tick.y"
        class="stroke-edge"
        stroke-width="1"
        stroke-dasharray="3 3"
      />
      <text
        :x="PAD.left - 6"
        :y="tick.y"
        text-anchor="end"
        dominant-baseline="middle"
        class="fill-ink-faint"
        font-size="10"
      >{{ tick.text }}</text>
    </g>

    <!-- Line -->
    <polyline
      v-if="points.length > 1"
      :points="polyline"
      fill="none"
      :stroke="series.color"
      stroke-width="2"
      stroke-linejoin="round"
      stroke-linecap="round"
    />

    <!-- Dots + tooltips -->
    <g v-for="(pt, i) in points" :key="pt.date">
      <title>{{ pt.date }}: {{ pt.tooltip ?? pt.y }}</title>
      <circle
        :cx="xOf(i)"
        :cy="yOf(pt.y)"
        r="3.5"
        :fill="series.color"
        class="opacity-90"
      />
    </g>

    <!-- X-axis labels -->
    <text
      v-for="lbl in xLabels"
      :key="lbl.x"
      :x="lbl.x"
      :y="PAD.top + innerH + 18"
      text-anchor="middle"
      class="fill-ink-faint"
      font-size="10"
    >{{ lbl.label }}</text>
  </svg>
</template>
