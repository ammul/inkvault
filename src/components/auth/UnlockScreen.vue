<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useDiaryStore } from '@/stores/diary'
import { useDataPointsStore } from '@/stores/datapoints'
import { restoreBackup } from '@/utils/backup'
import type { BackupFile } from '@/utils/backup'
import { scorePassphrase, MIN_PASSPHRASE_LENGTH } from '@/utils/passphrase'

const router = useRouter()
const auth = useAuthStore()
const diary = useDiaryStore()
const datapoints = useDataPointsStore()

const passphrase = ref('')
const confirmPassphrase = ref('')
const error = ref('')
const loading = ref(false)

const strength = computed(() => scorePassphrase(passphrase.value))

const importMode = ref(false)
const importFile = ref<File | null>(null)
const importPassphrase = ref('')
const importError = ref('')
const importLoading = ref(false)

onMounted(() => auth.checkInitialized())

function enterImportMode() {
  importMode.value = true
  importFile.value = null
  importPassphrase.value = ''
  importError.value = ''
}

function exitImportMode() {
  importMode.value = false
  importError.value = ''
}

function handleFileSelect(e: Event) {
  const input = e.target as HTMLInputElement
  importFile.value = input.files?.[0] ?? null
  importError.value = ''
}

async function submitImport() {
  importError.value = ''
  if (!importFile.value) {
    importError.value = 'Select a backup file.'
    return
  }
  if (!importPassphrase.value) {
    importError.value = 'Enter the backup passphrase.'
    return
  }
  importLoading.value = true
  let vaultCreated = false
  try {
    const text = await importFile.value.text()
    const backup = JSON.parse(text) as BackupFile
    const { datapoints: importedConfigs, entries: importedEntries } = await restoreBackup(
      backup,
      importPassphrase.value,
    )
    await auth.initializeVault(importPassphrase.value)
    vaultCreated = true
    for (const entry of importedEntries) {
      await diary.saveEntry(entry)
    }
    await datapoints.replaceConfigs(importedConfigs)
    // Mark stores as loaded so views don't re-read before all writes are committed
    await diary.loadEntries()
    await datapoints.loadConfigs()
    router.push('/home')
  } catch (e) {
    if (vaultCreated) auth.resetVault()
    const msg = e instanceof Error ? e.message : ''
    if (msg.includes('passphrase')) {
      importError.value = 'Wrong backup passphrase.'
    } else if (msg.includes('version')) {
      importError.value = 'Unsupported backup format.'
    } else {
      importError.value = 'Could not restore backup — file may be corrupted.'
    }
  } finally {
    importLoading.value = false
  }
}

async function submit() {
  error.value = ''
  if (!passphrase.value) {
    error.value = 'Please enter a passphrase.'
    return
  }
  if (!auth.initialized && passphrase.value !== confirmPassphrase.value) {
    error.value = 'Passphrases do not match.'
    return
  }
  if (!auth.initialized && !strength.value.acceptable) {
    error.value = `Passphrase must be at least ${MIN_PASSPHRASE_LENGTH} characters.`
    return
  }
  loading.value = true
  try {
    if (auth.initialized) {
      await auth.unlock(passphrase.value)
    } else {
      await auth.initializeVault(passphrase.value)
    }
    router.push('/home')
  } catch {
    error.value = auth.initialized ? 'Wrong passphrase. Try again.' : 'Failed to create vault.'
  } finally {
    loading.value = false
    passphrase.value = ''
    confirmPassphrase.value = ''
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 p-4">
    <div class="w-full max-w-sm bg-white rounded-xl shadow-md p-8">
      <h1 class="text-2xl font-bold text-center mb-2">🔏 InkVault</h1>

      <!-- Import from backup -->
      <template v-if="importMode">
        <p class="text-center text-gray-500 text-sm mb-6">
          Select a backup file and enter its passphrase to restore your vault.
        </p>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Backup file</label>
            <input
              type="file"
              accept=".json"
              @change="handleFileSelect"
              class="w-full text-sm text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-indigo-600 hover:file:bg-indigo-100 cursor-pointer"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Backup passphrase</label>
            <input
              v-model="importPassphrase"
              type="password"
              autocomplete="current-password"
              placeholder="Enter backup passphrase"
              class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              autofocus
            />
          </div>
          <p v-if="importError" class="text-red-600 text-sm">{{ importError }}</p>
          <button
            @click="submitImport"
            :disabled="importLoading"
            class="w-full bg-indigo-600 text-white rounded-lg py-2 font-semibold hover:bg-indigo-700 disabled:opacity-50 transition"
          >
            {{ importLoading ? 'Restoring…' : 'Restore Vault' }}
          </button>
          <button
            @click="exitImportMode"
            :disabled="importLoading"
            class="w-full text-sm text-gray-500 hover:text-gray-700 transition"
          >
            ← Back
          </button>
        </div>
      </template>

      <!-- Create / Unlock -->
      <template v-else>
        <p class="text-center text-gray-500 text-sm mb-6">
          {{ auth.initialized ? 'Enter your passphrase to unlock.' : 'Create a passphrase to get started.' }}
        </p>
        <form @submit.prevent="submit" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Passphrase</label>
            <input
              v-model="passphrase"
              type="password"
              autocomplete="current-password"
              class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              :placeholder="auth.initialized ? 'Enter passphrase' : 'Choose a strong passphrase'"
              autofocus
            />
          </div>
          <div v-if="!auth.initialized && passphrase.length > 0" class="space-y-1">
            <div class="flex gap-1">
              <div
                v-for="i in 4"
                :key="i"
                class="h-1 flex-1 rounded-full"
                :class="i <= strength.score
                  ? strength.score >= 3 ? 'bg-green-500'
                  : strength.score === 2 ? 'bg-yellow-500'
                  : 'bg-red-500'
                  : 'bg-gray-200'"
              />
            </div>
            <p
              class="text-xs"
              :class="strength.acceptable ? 'text-gray-500' : 'text-red-600'"
            >{{ strength.label }}</p>
          </div>
          <div v-if="!auth.initialized">
            <label class="block text-sm font-medium text-gray-700 mb-1">Confirm Passphrase</label>
            <input
              v-model="confirmPassphrase"
              type="password"
              autocomplete="new-password"
              class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Repeat passphrase"
            />
          </div>
          <p v-if="error" class="text-red-600 text-sm">{{ error }}</p>
          <button
            type="submit"
            :disabled="loading"
            class="w-full bg-indigo-600 text-white rounded-lg py-2 font-semibold hover:bg-indigo-700 disabled:opacity-50 transition"
          >
            {{ loading ? 'Unlocking…' : auth.initialized ? 'Unlock' : 'Create Vault' }}
          </button>
          <p v-if="!auth.initialized" class="text-xs text-gray-400 text-center">
            ⚠️ Losing your passphrase means losing all your data. There is no recovery.
          </p>
          <p v-if="!auth.initialized" class="text-center">
            <button
              type="button"
              @click="enterImportMode"
              class="text-sm text-indigo-500 hover:text-indigo-700 transition"
            >
              Restore from a backup file
            </button>
          </p>
        </form>
      </template>
    </div>
  </div>
</template>
