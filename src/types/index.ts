export type DataPointType = 'range' | 'string' | 'multi-string' | 'boolean' | 'medication'

export interface RangeConfig {
  min: number
  max: number
  step: number
  labels?: string[]
}

export interface StringConfig {
  placeholder?: string
}

export interface MultiStringConfig {
  options: string[]
}

export interface BooleanConfig {
  trueLabel: string
  falseLabel: string
}

export interface MedicationConfig {
  medication: string
  dosagePresets?: string[]
}

export interface MedicationValue {
  amount: number
  unit: string
  time: string
}

export interface DataPointConfig {
  id: string
  label: string
  color: string
  icon: string
  type: DataPointType
  config: RangeConfig | StringConfig | MultiStringConfig | BooleanConfig | MedicationConfig
  createdAt: string
}

export type DataPointValue = number | string | string[] | boolean | MedicationValue | null

export interface DiaryEntry {
  date: string
  text: string
  dataValues: Record<string, DataPointValue>
  updatedAt: string
}

export interface TimeRange {
  start: string
  end: string
  label: 'week' | 'month' | 'year' | 'all'
}

export type ColorTheme = 'indigo' | 'violet' | 'teal' | 'rose' | 'amber' | 'slate'
export type ThemeFont = 'sans' | 'serif' | 'mono'
export type ThemeMood = 'minimal' | 'cozy' | 'dark' | 'system'
export type ThemeFontSize = 'sm' | 'md' | 'lg'
export type ThemeLineSpacing = 'compact' | 'normal' | 'relaxed'
export type ThemeContentWidth = 'narrow' | 'normal' | 'wide'

export interface ThemeSettings {
  colorTheme: ColorTheme
  font: ThemeFont
  mood: ThemeMood
  fontSize: ThemeFontSize
  lineSpacing: ThemeLineSpacing
  contentWidth: ThemeContentWidth
}

export interface ConfigFilter {
  rangeMin: number | null
  rangeMax: number | null
  boolValue: boolean | null
  multiStringIncludes: string[]
  stringSearch: string
  medicationAmountMin: number | null
  medicationAmountMax: number | null
}

export const DEFAULT_THEME: ThemeSettings = {
  colorTheme: 'indigo',
  font: 'sans',
  mood: 'minimal',
  fontSize: 'md',
  lineSpacing: 'normal',
  contentWidth: 'normal',
}
