import type { TrackerConfig, DiaryEntry, ThemeSettings } from '@/types'
import { DEFAULT_THEME } from '@/types'
import { useDiaryStore } from '@/stores/diary'
import { useTrackersStore } from '@/stores/trackers'
import { useThemeStore } from '@/stores/theme'
import { useAppSettingsStore } from '@/stores/appSettings'
import { listEntryKeys, remove } from './storage'

function dateISO(daysAgo: number): string {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  return d.toISOString().slice(0, 10)
}

const TRACKER_SEEDS: Omit<TrackerConfig, 'id' | 'createdAt'>[] = [
  { label: 'Mood',       color: '#4f46e5', icon: '📊', type: 'range',        config: { min: 0, max: 10, step: 1 } },
  { label: 'Energy',     color: '#0d9488', icon: '📊', type: 'range',        config: { min: 0, max: 10, step: 1 } },
  { label: 'Exercise',   color: '#e11d48', icon: '✅', type: 'boolean',      config: { trueLabel: 'Yes', falseLabel: 'No' } },
  { label: 'How I felt', color: '#7c3aed', icon: '📋', type: 'multi-string', config: { options: ['Joyful', 'Calm', 'Anxious', 'Excited', 'Grateful'] } },
  { label: 'Vitamin D',  color: '#d97706', icon: '💊', type: 'medication',   config: { medication: 'Vitamin D3', dosagePresets: ['1000 IU', '2000 IU'] } },
]

interface TrackerTimed<T> { value: T; time: string }

interface EntrySeed {
  text:     { body: string; time: string }
  mood:     TrackerTimed<number>
  energy:   TrackerTimed<number>
  exercise: TrackerTimed<boolean>
  emotions: TrackerTimed<string[]>
  vitaminD: TrackerTimed<{ amount: number; unit: string; time: string }> | null
}

const ENTRY_SEEDS: EntrySeed[] = [
  {
    text:     { body: 'Woke up feeling refreshed after a solid eight hours. Made coffee and read for an hour before the day started.', time: '07:30' },
    mood:     { value: 8,    time: '07:35' },
    energy:   { value: 7,    time: '07:35' },
    vitaminD: { value: { amount: 2000, unit: 'IU', time: '08:30' }, time: '08:30' },
    exercise: { value: true, time: '17:00' },
    emotions: { value: ['Joyful', 'Grateful'], time: '21:00' },
  },
  {
    text:     { body: 'Busy day at work, but managed to get a long walk in at lunch. The fresh air helped a lot.', time: '12:15' },
    mood:     { value: 6,    time: '09:00' },
    energy:   { value: 5,    time: '09:00' },
    vitaminD: { value: { amount: 1000, unit: 'IU', time: '09:00' }, time: '09:00' },
    exercise: { value: true, time: '12:30' },
    emotions: { value: ['Calm'], time: '18:30' },
  },
  {
    text:     { body: "Quiet evening. Finished a book I'd been reading for weeks — that satisfying feeling of closing the last page.", time: '21:00' },
    mood:     { value: 8,     time: '09:15' },
    energy:   { value: 6,     time: '09:15' },
    vitaminD: { value: { amount: 1000, unit: 'IU', time: '09:15' }, time: '09:15' },
    exercise: { value: false, time: '17:00' },
    emotions: { value: ['Calm', 'Grateful'], time: '21:10' },
  },
  {
    text:     { body: 'Struggled to focus today. Too many browser tabs. Closed them all and finally got into a flow state.', time: '14:30' },
    mood:     { value: 4,     time: '09:00' },
    energy:   { value: 3,     time: '09:00' },
    vitaminD: null,
    exercise: { value: false, time: '17:00' },
    emotions: { value: ['Anxious'], time: '14:35' },
  },
  {
    text:     { body: 'Met an old friend for dinner. We talked for three hours without noticing the time.', time: '19:00' },
    mood:     { value: 9,     time: '08:00' },
    energy:   { value: 7,     time: '08:00' },
    vitaminD: { value: { amount: 2000, unit: 'IU', time: '08:00' }, time: '08:00' },
    exercise: { value: false, time: '17:00' },
    emotions: { value: ['Joyful', 'Excited'], time: '19:30' },
  },
  {
    text:     { body: 'Rainy morning. Did a full workout at home and felt surprisingly good afterward.', time: '08:45' },
    mood:     { value: 7,    time: '08:00' },
    energy:   { value: 8,    time: '08:00' },
    vitaminD: { value: { amount: 2000, unit: 'IU', time: '07:45' }, time: '07:45' },
    exercise: { value: true, time: '08:30' },
    emotions: { value: ['Calm', 'Grateful'], time: '20:30' },
  },
  {
    text:     { body: 'Productive start to the week. Wrote for an hour in the morning before checking email.', time: '08:00' },
    mood:     { value: 8,    time: '07:30' },
    energy:   { value: 9,    time: '07:30' },
    vitaminD: { value: { amount: 1000, unit: 'IU', time: '08:00' }, time: '08:00' },
    exercise: { value: true, time: '06:45' },
    emotions: { value: ['Excited'], time: '08:10' },
  },
]

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randomTheme(): ThemeSettings {
  return {
    colorTheme:   pick(['indigo', 'violet', 'teal', 'rose', 'amber', 'slate'] as const),
    font:         pick(['sans', 'serif', 'mono'] as const),
    mood:         pick(['minimal', 'cozy', 'dark', 'system'] as const),
    fontSize:     pick(['sm', 'md', 'lg'] as const),
    lineSpacing:  pick(['compact', 'normal', 'relaxed'] as const),
    contentWidth: pick(['narrow', 'normal', 'wide'] as const),
  }
}

export async function rerollTheme(): Promise<void> {
  const theme = useThemeStore()
  const appSettings = useAppSettingsStore()
  Object.assign(theme.settings, randomTheme())
  appSettings.settings.animations = true
  await Promise.all([theme.save(), appSettings.save()])
  theme.apply()
  appSettings.apply()
}

export async function seedDemoData(): Promise<void> {
  const diary = useDiaryStore()
  const trackers = useTrackersStore()

  const now = new Date().toISOString()

  const configs: TrackerConfig[] = TRACKER_SEEDS.map((seed, i) => ({
    ...seed,
    id: `demo-tracker-${i}`,
    createdAt: now,
  }))

  await trackers.replaceConfigs(configs)

  const [moodId, energyId, exerciseId, emotionsId, vitaminDId] = configs.map((c) => c.id)

  for (let i = 0; i < ENTRY_SEEDS.length; i++) {
    const seed = ENTRY_SEEDS[i]
    const date = dateISO(i)
    const ts = (time: string) => new Date(`${date}T${time}:00`).toISOString()

    const dataEntries: DiaryEntry['dataEntries'] = [
      { id: crypto.randomUUID(), configId: moodId,     value: seed.mood.value,     createdAt: ts(seed.mood.time) },
      { id: crypto.randomUUID(), configId: energyId,   value: seed.energy.value,   createdAt: ts(seed.energy.time) },
      { id: crypto.randomUUID(), configId: exerciseId, value: seed.exercise.value, createdAt: ts(seed.exercise.time) },
      { id: crypto.randomUUID(), configId: emotionsId, value: seed.emotions.value, createdAt: ts(seed.emotions.time) },
    ]
    if (seed.vitaminD !== null) {
      dataEntries.push({ id: crypto.randomUUID(), configId: vitaminDId, value: seed.vitaminD.value, createdAt: ts(seed.vitaminD.time) })
    }

    const entry: DiaryEntry = {
      date,
      text: '',
      entries:     [{ id: crypto.randomUUID(), text: seed.text.body, createdAt: ts(seed.text.time) }],
      dataEntries,
      dataValues:  {},
      updatedAt:   ts(seed.text.time),
    }
    await diary.saveEntry(entry)
  }

}

export async function clearData(): Promise<void> {
  const diary = useDiaryStore()
  const trackers = useTrackersStore()
  const theme = useThemeStore()

  for (const k of listEntryKeys()) remove(k)
  diary.reset()

  await trackers.replaceConfigs([])

  Object.assign(theme.settings, { ...DEFAULT_THEME })
  await theme.save()
  theme.apply()
}
