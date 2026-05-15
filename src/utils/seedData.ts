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

const ENTRY_SEEDS = [
  { text: 'Woke up feeling refreshed after a solid eight hours. Made coffee and read for an hour before the day started.', mood: 8, energy: 7, exercised: true,  emotions: ['Joyful', 'Grateful'], vitaminD: { amount: 2000, unit: 'IU', time: '08:30' } },
  { text: 'Busy day at work, but managed to get a long walk in at lunch. The fresh air helped a lot.',                     mood: 6, energy: 5, exercised: true,  emotions: ['Calm'],               vitaminD: { amount: 1000, unit: 'IU', time: '09:00' } },
  { text: "Quiet evening. Finished a book I'd been reading for weeks — that satisfying feeling of closing the last page.", mood: 8, energy: 6, exercised: false, emotions: ['Calm', 'Grateful'],   vitaminD: { amount: 1000, unit: 'IU', time: '09:15' } },
  { text: 'Struggled to focus today. Too many browser tabs. Closed them all and finally got into a flow state.',           mood: 4, energy: 3, exercised: false, emotions: ['Anxious'],             vitaminD: null },
  { text: 'Met an old friend for dinner. We talked for three hours without noticing the time.',                            mood: 9, energy: 7, exercised: false, emotions: ['Joyful', 'Excited'],   vitaminD: { amount: 2000, unit: 'IU', time: '08:00' } },
  { text: 'Rainy morning. Did a full workout at home and felt surprisingly good afterward.',                                mood: 7, energy: 8, exercised: true,  emotions: ['Calm', 'Grateful'],   vitaminD: { amount: 2000, unit: 'IU', time: '07:45' } },
  { text: 'Productive start to the week. Wrote for an hour in the morning before checking email.',                         mood: 8, energy: 9, exercised: true,  emotions: ['Excited'],             vitaminD: { amount: 1000, unit: 'IU', time: '08:00' } },
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
    const dataValues: DiaryEntry['dataValues'] = {
      [moodId]:     seed.mood,
      [energyId]:   seed.energy,
      [exerciseId]: seed.exercised,
      [emotionsId]: seed.emotions,
    }
    if (seed.vitaminD !== null) dataValues[vitaminDId] = seed.vitaminD
    const entry: DiaryEntry = {
      date: dateISO(i),
      text: '',
      entries: [{ id: crypto.randomUUID(), text: seed.text, createdAt: now }],
      dataValues,
      updatedAt: now,
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
