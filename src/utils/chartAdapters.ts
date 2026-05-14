import type { DataPointConfig, DataPointType, DataPointValue, MedicationValue } from '@/types'

export interface ChartPoint {
  date: string
  y: number
  tooltip?: string
}

export interface ChartSeries {
  points: ChartPoint[]
  yMin: number
  yMax: number
  yLabels?: Record<number, string>
  color: string
  label: string
}

export interface FrequencyBar {
  label: string
  count: number
}

export interface FrequencySeries {
  bars: FrequencyBar[]
  color: string
  label: string
}

type ValueEntry = { date: string; value: DataPointValue }

type LineAdapterFn = (config: DataPointConfig, values: ValueEntry[]) => ChartSeries | null
type FreqAdapterFn = (config: DataPointConfig, values: ValueEntry[]) => FrequencySeries | null

export type ChartResult =
  | { kind: 'line'; series: ChartSeries }
  | { kind: 'frequency'; series: FrequencySeries }
  | null

function rangeAdapter(config: DataPointConfig, values: ValueEntry[]): ChartSeries | null {
  const points = values
    .filter((v) => typeof v.value === 'number')
    .map((v) => ({ date: v.date, y: v.value as number, tooltip: String(v.value) }))
  if (!points.length) return null
  const ys = points.map((p) => p.y)
  return { points, yMin: Math.min(...ys), yMax: Math.max(...ys), color: config.color, label: config.label }
}

function booleanAdapter(config: DataPointConfig, values: ValueEntry[]): ChartSeries | null {
  const points = values
    .filter((v) => typeof v.value === 'boolean')
    .map((v) => {
      const bool = v.value as boolean
      return { date: v.date, y: bool ? 1 : 0, tooltip: bool ? 'Yes' : 'No' }
    })
  if (!points.length) return null
  return {
    points,
    yMin: 0,
    yMax: 1,
    yLabels: { 0: 'No', 1: 'Yes' },
    color: config.color,
    label: config.label,
  }
}

function medicationAdapter(config: DataPointConfig, values: ValueEntry[]): ChartSeries | null {
  const points = values
    .filter((v) => v.value !== null && typeof v.value === 'object' && !Array.isArray(v.value))
    .map((v) => {
      const med = v.value as MedicationValue
      return { date: v.date, y: med.amount, tooltip: `${med.amount} ${med.unit}` }
    })
  if (!points.length) return null
  const ys = points.map((p) => p.y)
  return { points, yMin: Math.min(...ys), yMax: Math.max(...ys), color: config.color, label: config.label }
}

function stringFreqAdapter(config: DataPointConfig, values: ValueEntry[]): FrequencySeries | null {
  const counts = new Map<string, number>()
  for (const v of values) {
    if (typeof v.value === 'string' && v.value.trim()) {
      counts.set(v.value, (counts.get(v.value) ?? 0) + 1)
    }
  }
  if (!counts.size) return null
  const bars = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([label, count]) => ({ label, count }))
  return { bars, color: config.color, label: config.label }
}

function multiStringFreqAdapter(config: DataPointConfig, values: ValueEntry[]): FrequencySeries | null {
  const counts = new Map<string, number>()
  for (const v of values) {
    if (Array.isArray(v.value)) {
      for (const opt of v.value as string[]) {
        counts.set(opt, (counts.get(opt) ?? 0) + 1)
      }
    }
  }
  if (!counts.size) return null
  const bars = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([label, count]) => ({ label, count }))
  return { bars, color: config.color, label: config.label }
}

const lineAdapters: Partial<Record<DataPointType, LineAdapterFn>> = {
  range: rangeAdapter,
  boolean: booleanAdapter,
  medication: medicationAdapter,
}

const freqAdapters: Partial<Record<DataPointType, FreqAdapterFn>> = {
  string: stringFreqAdapter,
  'multi-string': multiStringFreqAdapter,
}

export function toChartResult(config: DataPointConfig, values: ValueEntry[]): ChartResult {
  const lineAdapter = lineAdapters[config.type]
  if (lineAdapter) {
    const series = lineAdapter(config, values)
    return series ? { kind: 'line', series } : null
  }
  const freqAdapter = freqAdapters[config.type]
  if (freqAdapter) {
    const series = freqAdapter(config, values)
    return series ? { kind: 'frequency', series } : null
  }
  return null
}
