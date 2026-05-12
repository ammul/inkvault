<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useDiaryStore } from '@/stores/diary'
import { useDataPointsStore } from '@/stores/datapoints'
import { createBackup, restoreBackup } from '@/utils/backup'
import type { BackupFile } from '@/utils/backup'
import type { DataPointConfig, DiaryEntry } from '@/types'
import { scorePassphrase, MIN_PASSPHRASE_LENGTH } from '@/utils/passphrase'

const diary = useDiaryStore()
const datapoints = useDataPointsStore()

onMounted(async () => {
  if (!diary.loaded) await diary.loadEntries()
  if (!datapoints.loaded) await datapoints.loadConfigs()
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
    exportError.value = 'Enter a passphrase for the backup.'
    return
  }
  if (exportPassphrase.value !== exportConfirm.value) {
    exportError.value = 'Passphrases do not match.'
    return
  }
  if (!exportStrength.value.acceptable) {
    exportError.value = `Passphrase must be at least ${MIN_PASSPHRASE_LENGTH} characters.`
    return
  }
  exportLoading.value = true
  try {
    const entries = [...diary.entries.values()]
    const backup = await createBackup(exportPassphrase.value, datapoints.configs, entries)
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
    exportError.value = 'Export failed.'
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
const importPreview = ref<{ entries: DiaryEntry[]; datapoints: DataPointConfig[] } | null>(null)

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
    importError.value = 'Select a backup file.'
    return
  }
  if (!importPassphrase.value) {
    importError.value = 'Enter the backup passphrase.'
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
      importError.value = 'Wrong backup passphrase.'
    } else if (msg.includes('version')) {
      importError.value = 'Unsupported backup format.'
    } else {
      importError.value = 'Could not read backup file — it may be corrupted.'
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
    await datapoints.replaceConfigs(importPreview.value.datapoints)
    importDone.value = true
    importPreview.value = null
    importFile.value = null
    importPassphrase.value = ''
  } catch {
    importError.value = 'Import failed.'
  } finally {
    importLoading.value = false
  }
}
</script>

<template>
  <div class="max-w-lg mx-auto mt-8 space-y-8 px-4 pb-12">
    <h1 class="text-2xl font-bold text-gray-800">Backup</h1>

    <!-- Export -->
    <section class="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
      <div>
        <h2 class="font-semibold text-gray-700 text-lg">Export</h2>
        <p class="text-sm text-gray-500 mt-1">
          Download an encrypted backup of all diary entries and data point configs. The file is
          protected with a separate backup passphrase.
        </p>
      </div>
      <div class="space-y-3">
        <input
          v-model="exportPassphrase"
          type="password"
          placeholder="Backup passphrase"
          autocomplete="new-password"
          class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-400"
        />
        <input
          v-model="exportConfirm"
          type="password"
          placeholder="Confirm passphrase"
          autocomplete="new-password"
          class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-400"
        />
        <div v-if="exportPassphrase.length > 0" class="space-y-1">
          <div class="flex gap-1">
            <div
              v-for="i in 4"
              :key="i"
              class="h-1 flex-1 rounded-full"
              :class="i <= exportStrength.score
                ? exportStrength.score >= 3 ? 'bg-green-500'
                : exportStrength.score === 2 ? 'bg-yellow-500'
                : 'bg-red-500'
                : 'bg-gray-200'"
            />
          </div>
          <p
            class="text-xs"
            :class="exportStrength.acceptable ? 'text-gray-500' : 'text-red-600'"
          >{{ exportStrength.label }}</p>
        </div>
        <p v-if="exportError" class="text-sm text-red-500">{{ exportError }}</p>
        <p v-if="exportDone" class="text-sm text-green-600">Backup file downloaded.</p>
        <button
          @click="handleExport"
          :disabled="exportLoading"
          class="w-full bg-indigo-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition"
        >
          {{ exportLoading ? 'Encrypting…' : 'Download Backup' }}
        </button>
      </div>
    </section>

    <!-- Import -->
    <section class="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
      <div>
        <h2 class="font-semibold text-gray-700 text-lg">Import</h2>
        <p class="text-sm text-gray-500 mt-1">
          Restore from a backup file. Diary entries will be merged; existing entries are overwritten
          if dates match. Data point configs will be fully replaced.
        </p>
      </div>
      <div class="space-y-3">
        <input
          type="file"
          accept=".json"
          @change="handleFileSelect"
          class="w-full text-sm text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-indigo-600 hover:file:bg-indigo-100 cursor-pointer"
        />
        <input
          v-model="importPassphrase"
          type="password"
          placeholder="Backup passphrase"
          autocomplete="current-password"
          class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-400"
        />
        <p v-if="importError" class="text-sm text-red-500">{{ importError }}</p>
        <div
          v-if="importPreview"
          class="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800 space-y-1"
        >
          <p class="font-medium">Ready to import:</p>
          <p>{{ importPreview.entries.length }} diary entr{{ importPreview.entries.length === 1 ? 'y' : 'ies' }}</p>
          <p>{{ importPreview.datapoints.length }} data point config{{ importPreview.datapoints.length === 1 ? '' : 's' }}</p>
        </div>
        <p v-if="importDone" class="text-sm text-green-600">Import complete.</p>
        <button
          v-if="!importPreview"
          @click="handleDecrypt"
          :disabled="importLoading"
          class="w-full bg-gray-700 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-gray-800 disabled:opacity-50 transition"
        >
          {{ importLoading ? 'Decrypting…' : 'Decrypt & Preview' }}
        </button>
        <template v-else>
          <button
            @click="handleImport"
            :disabled="importLoading"
            class="w-full bg-amber-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-amber-700 disabled:opacity-50 transition"
          >
            {{ importLoading ? 'Importing…' : 'Confirm Import' }}
          </button>
          <button
            @click="importPreview = null"
            :disabled="importLoading"
            class="w-full border border-gray-300 text-gray-600 rounded-lg px-4 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-50 transition"
          >
            Cancel
          </button>
        </template>
      </div>
    </section>
  </div>
</template>
