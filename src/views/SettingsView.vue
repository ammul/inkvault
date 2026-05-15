<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useDiaryStore } from '@/stores/diary'
import { useTrackersStore } from '@/stores/trackers'
import { useThemeStore } from '@/stores/theme'
import { createBackup, restoreBackup } from '@/utils/backup'
import type { BackupFile } from '@/utils/backup'
import type { TrackerConfig, DiaryEntry, ThemeSettings } from '@/types'
import { scorePassphrase, MIN_PASSPHRASE_LENGTH } from '@/utils/passphrase'

const { t } = useI18n()
const diary = useDiaryStore()
const trackers = useTrackersStore()
const theme = useThemeStore()

onMounted(async () => {
  if (!diary.loaded) await diary.loadAllEntries()
  if (!trackers.loaded) await trackers.loadConfigs()
})

// --- Export ---
const exportPassphrase = ref('')
const exportConfirm = ref('')
const exportError = ref('')
const exportDone = ref(false)
const exportLoading = ref(false)
const exportStrength = computed(() => scorePassphrase(exportPassphrase.value))

async function handleExport() {
  exportError.value = ''
  exportDone.value = false
  if (!exportPassphrase.value) {
    exportError.value = t('backup.export.errNoPassphrase')
    return
  }
  if (exportPassphrase.value !== exportConfirm.value) {
    exportError.value = t('backup.export.errMismatch')
    return
  }
  if (!exportStrength.value.acceptable) {
    exportError.value = t('backup.export.errTooShort', { min: MIN_PASSPHRASE_LENGTH })
    return
  }
  exportLoading.value = true
  try {
    const entries = [...diary.entries.values()]
    const backup = await createBackup(exportPassphrase.value, trackers.configs, entries, theme.settings)
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `inkvault-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    exportPassphrase.value = ''
    exportConfirm.value = ''
    exportDone.value = true
  } catch {
    exportError.value = t('backup.export.errFailed')
  } finally {
    exportLoading.value = false
  }
}

// --- Import ---
const importFile = ref<File | null>(null)
const importPassphrase = ref('')
const importError = ref('')
const importLoading = ref(false)
const importDone = ref(false)
const importPreview = ref<{ entries: DiaryEntry[]; trackers: TrackerConfig[]; theme: ThemeSettings | null } | null>(null)

function handleFileSelect(e: Event) {
  const input = e.target as HTMLInputElement
  importFile.value = input.files?.[0] ?? null
  importPreview.value = null
  importError.value = ''
  importDone.value = false
}

async function handleDecrypt() {
  importError.value = ''
  importPreview.value = null
  if (!importFile.value) {
    importError.value = t('backup.import.errSelectFile')
    return
  }
  if (!importPassphrase.value) {
    importError.value = t('backup.import.errEnterPassphrase')
    return
  }
  importLoading.value = true
  try {
    const text = await importFile.value.text()
    const backup = JSON.parse(text) as BackupFile
    importPreview.value = await restoreBackup(backup, importPassphrase.value)
  } catch (e) {
    const msg = e instanceof Error ? e.message : ''
    if (msg.includes('passphrase')) {
      importError.value = t('backup.import.errWrongPassphrase')
    } else if (msg.includes('version')) {
      importError.value = t('backup.import.errUnsupportedFormat')
    } else {
      importError.value = t('backup.import.errCorrupted')
    }
  } finally {
    importLoading.value = false
  }
}

async function handleImport() {
  if (!importPreview.value) return
  importLoading.value = true
  importError.value = ''
  try {
    for (const entry of importPreview.value.entries) {
      await diary.saveEntry(entry)
    }
    await trackers.replaceConfigs(importPreview.value.trackers)
    if (importPreview.value.theme) {
      Object.assign(theme.settings, importPreview.value.theme)
      await theme.save()
      theme.apply()
    }
    importDone.value = true
    importPreview.value = null
    importFile.value = null
    importPassphrase.value = ''
  } catch {
    importError.value = t('backup.import.errFailed')
  } finally {
    importLoading.value = false
  }
}
</script>

<template>
  <div class="max-w-lg mx-auto space-y-6 pb-12">
    <h1 class="text-xl font-semibold text-ink">{{ t('backup.title') }}</h1>

    <!-- Export -->
    <section class="bg-raised border border-edge rounded-card shadow-card p-6 space-y-4">
      <div>
        <h2 class="font-semibold text-ink">{{ t('backup.export.title') }}</h2>
        <p class="text-sm text-ink-muted mt-1">{{ t('backup.export.description') }}</p>
      </div>
      <div class="space-y-3">
        <input
          v-model="exportPassphrase"
          type="password"
          :placeholder="t('backup.export.passphrase')"
          autocomplete="new-password"
          class="w-full border border-edge rounded-input px-3 py-2 text-sm text-ink bg-surface placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-accent/25 focus:border-accent transition-colors"
        />
        <input
          v-model="exportConfirm"
          type="password"
          :placeholder="t('backup.export.confirmPassphrase')"
          autocomplete="new-password"
          class="w-full border border-edge rounded-input px-3 py-2 text-sm text-ink bg-surface placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-accent/25 focus:border-accent transition-colors"
        />
        <div v-if="exportPassphrase.length > 0" class="space-y-1.5">
          <div class="flex gap-1">
            <div
              v-for="i in 4"
              :key="i"
              class="h-1 flex-1 rounded-pill transition-colors"
              :class="i <= exportStrength.score
                ? exportStrength.score >= 3 ? 'bg-ok'
                : exportStrength.score === 2 ? 'bg-warn'
                : 'bg-danger'
                : 'bg-edge-strong'"
            />
          </div>
          <p class="text-xs" :class="exportStrength.acceptable ? 'text-ink-muted' : 'text-danger'">
            {{ t(exportStrength.labelKey, exportStrength.labelParams ?? {}) }}
          </p>
        </div>
        <p v-if="exportError" class="text-sm text-danger">{{ exportError }}</p>
        <p v-if="exportDone" class="text-sm text-ok">{{ t('backup.export.done') }}</p>
        <button
          @click="handleExport"
          :disabled="exportLoading"
          class="w-full bg-accent text-on-accent rounded-input px-4 py-2.5 text-sm font-medium hover:bg-accent-dim disabled:opacity-50 transition-colors"
        >
          {{ exportLoading ? t('backup.export.encrypting') : t('backup.export.download') }}
        </button>
      </div>
    </section>

    <!-- Import -->
    <section class="bg-raised border border-edge rounded-card shadow-card p-6 space-y-4">
      <div>
        <h2 class="font-semibold text-ink">{{ t('backup.import.title') }}</h2>
        <p class="text-sm text-ink-muted mt-1">{{ t('backup.import.description') }}</p>
      </div>
      <div class="space-y-3">
        <input
          type="file"
          accept=".json"
          @change="handleFileSelect"
          class="w-full text-sm text-ink-muted file:mr-3 file:rounded-input file:border-0 file:bg-accent-tint file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-accent hover:file:bg-accent-tint cursor-pointer"
        />
        <input
          v-model="importPassphrase"
          type="password"
          :placeholder="t('backup.import.passphrase')"
          autocomplete="current-password"
          class="w-full border border-edge rounded-input px-3 py-2 text-sm text-ink bg-surface placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-accent/25 focus:border-accent transition-colors"
        />
        <p v-if="importError" class="text-sm text-danger">{{ importError }}</p>
        <div
          v-if="importPreview"
          class="rounded-input bg-warn-tint border border-warn/30 px-4 py-3 text-sm text-warn space-y-1"
        >
          <p class="font-medium">{{ t('backup.import.previewTitle') }}</p>
          <p>{{ t('backup.import.previewEntries', importPreview.entries.length) }}</p>
          <p>{{ t('backup.import.previewTrackers', importPreview.trackers.length) }}</p>
        </div>
        <p v-if="importDone" class="text-sm text-ok">{{ t('backup.import.done') }}</p>
        <button
          v-if="!importPreview"
          @click="handleDecrypt"
          :disabled="importLoading"
          class="w-full border border-edge text-ink rounded-input px-4 py-2.5 text-sm font-medium hover:bg-subtle disabled:opacity-50 transition-colors"
        >
          {{ importLoading ? t('backup.import.decrypting') : t('backup.import.decrypt') }}
        </button>
        <template v-else>
          <button
            @click="handleImport"
            :disabled="importLoading"
            class="w-full bg-warn text-on-accent rounded-input px-4 py-2.5 text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {{ importLoading ? t('backup.import.importing') : t('backup.import.confirm') }}
          </button>
          <button
            @click="importPreview = null"
            :disabled="importLoading"
            class="w-full border border-edge text-ink-muted rounded-input px-4 py-2.5 text-sm font-medium hover:bg-subtle disabled:opacity-50 transition-colors"
          >
            {{ t('backup.import.cancel') }}
          </button>
        </template>
      </div>
    </section>
  </div>
</template>
