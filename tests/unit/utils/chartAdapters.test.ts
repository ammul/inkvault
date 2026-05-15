import { toChartResult } from '@/utils/chartAdapters'
import type { TrackerConfig, TrackerType } from '@/types'

function makeConfig(type: TrackerType, label = 'Test', color = '#6366f1'): TrackerConfig {
  const configMap: Record<TrackerType, TrackerConfig['config']> = {
    range: { min: 0, max: 10, step: 1 },
    boolean: { trueLabel: 'Yes', falseLabel: 'No' },
    medication: { medication: 'Aspirin' },
    string: { placeholder: 'Enter text' },
    'multi-string': { options: ['A', 'B'] },
  }
  return {
    id: 'test-id',
    label,
    color,
    icon: '📊',
    type,
    config: configMap[type],
    createdAt: new Date().toISOString(),
  }
}

describe('toChartResult', () => {
  test('range type produces a line chart with correct yMin, yMax, and points', () => {
    const config = makeConfig('range')
    const values = [
      { date: '2024-06-01', value: 5 },
      { date: '2024-06-02', value: 8 },
      { date: '2024-06-03', value: 3 },
    ]
    const result = toChartResult(config, values)
    expect(result?.kind).toBe('line')
    if (result?.kind === 'line') {
      expect(result.series.yMin).toBe(3)
      expect(result.series.yMax).toBe(8)
      expect(result.series.points).toHaveLength(3)
      expect(result.series.color).toBe('#6366f1')
    }
  })

  test('range type with no numeric values returns null', () => {
    const config = makeConfig('range')
    const result = toChartResult(config, [{ date: '2024-06-01', value: 'not a number' }])
    expect(result).toBeNull()
  })

  test('boolean type produces a line chart with yMin=0, yMax=1, and yLabels', () => {
    const config = makeConfig('boolean')
    const values = [
      { date: '2024-06-01', value: true },
      { date: '2024-06-02', value: false },
    ]
    const result = toChartResult(config, values)
    expect(result?.kind).toBe('line')
    if (result?.kind === 'line') {
      expect(result.series.yMin).toBe(0)
      expect(result.series.yMax).toBe(1)
      expect(result.series.yLabels).toEqual({ 0: 'No', 1: 'Yes' })
      expect(result.series.points[0].y).toBe(1)
      expect(result.series.points[1].y).toBe(0)
    }
  })

  test('medication type produces a line chart using the amount field', () => {
    const config = makeConfig('medication')
    const values = [
      { date: '2024-06-01', value: { amount: 100, unit: 'mg', time: '08:00' } },
      { date: '2024-06-02', value: { amount: 200, unit: 'mg', time: '09:00' } },
    ]
    const result = toChartResult(config, values)
    expect(result?.kind).toBe('line')
    if (result?.kind === 'line') {
      expect(result.series.yMin).toBe(100)
      expect(result.series.yMax).toBe(200)
      expect(result.series.points[0].y).toBe(100)
    }
  })

  test('string type produces a frequency chart sorted by count descending', () => {
    const config = makeConfig('string')
    const values = [
      { date: '2024-06-01', value: 'happy' },
      { date: '2024-06-02', value: 'sad' },
      { date: '2024-06-03', value: 'happy' },
      { date: '2024-06-04', value: 'happy' },
    ]
    const result = toChartResult(config, values)
    expect(result?.kind).toBe('frequency')
    if (result?.kind === 'frequency') {
      expect(result.series.bars[0]).toEqual({ label: 'happy', count: 3 })
      expect(result.series.bars[1]).toEqual({ label: 'sad', count: 1 })
    }
  })

  test('multi-string type produces a frequency chart with per-option counts', () => {
    const config = makeConfig('multi-string')
    const values = [
      { date: '2024-06-01', value: ['A', 'B'] },
      { date: '2024-06-02', value: ['A', 'C'] },
      { date: '2024-06-03', value: ['B'] },
    ]
    const result = toChartResult(config, values)
    expect(result?.kind).toBe('frequency')
    if (result?.kind === 'frequency') {
      const byLabel = Object.fromEntries(result.series.bars.map((b) => [b.label, b.count]))
      expect(byLabel['A']).toBe(2)
      expect(byLabel['B']).toBe(2)
      expect(byLabel['C']).toBe(1)
    }
  })

  test('string type with all blank values returns null', () => {
    const config = makeConfig('string')
    const result = toChartResult(config, [
      { date: '2024-06-01', value: '' },
      { date: '2024-06-02', value: '   ' },
    ])
    expect(result).toBeNull()
  })

  test('multi-string type with no array values returns null', () => {
    const config = makeConfig('multi-string')
    const result = toChartResult(config, [{ date: '2024-06-01', value: 'not an array' }])
    expect(result).toBeNull()
  })

  test('unsupported config type returns null', () => {
    const config = { ...makeConfig('range'), type: 'unknown' as TrackerType }
    const result = toChartResult(config, [{ date: '2024-06-01', value: 5 }])
    expect(result).toBeNull()
  })
})
