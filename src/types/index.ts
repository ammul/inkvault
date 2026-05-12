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
