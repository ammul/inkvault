<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import { useDiaryStore } from '@/stores/diary'
import { useTrackersStore } from '@/stores/trackers'
import { useThemeStore } from '@/stores/theme'
import { restoreBackup } from '@/utils/backup'
import type { BackupFile } from '@/utils/backup'
import { scorePassphrase, MIN_PASSPHRASE_LENGTH } from '@/utils/passphrase'

const { t } = useI18n()
const router = useRouter()
const auth = useAuthStore()
const diary = useDiaryStore()
const trackers = useTrackersStore()
const theme = useThemeStore()

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
    importError.value = t('auth.import.errSelectFile')
    return
  }
  if (!importPassphrase.value) {
    importError.value = t('auth.import.errEnterPassphrase')
    return
  }
  importLoading.value = true
  let vaultCreated = false
  try {
    const text = await importFile.value.text()
    const backup = JSON.parse(text) as BackupFile
    const { trackers: importedConfigs, entries: importedEntries, theme: importedTheme } = await restoreBackup(
      backup,
      importPassphrase.value,
    )
    await auth.initializeVault(importPassphrase.value)
    vaultCreated = true
    if (importedTheme) {
      Object.assign(theme.settings, importedTheme)
      theme.loaded = true
      theme.apply()
      await theme.save()
    }
    for (const entry of importedEntries) {
      await diary.saveEntry(entry)
    }
    await trackers.replaceConfigs(importedConfigs)
    await trackers.loadConfigs()
    router.push('/home')
  } catch (e) {
    if (vaultCreated) auth.resetVault()
    const msg = e instanceof Error ? e.message : ''
    if (msg.includes('passphrase')) {
      importError.value = t('auth.import.errWrongPassphrase')
    } else if (msg.includes('version')) {
      importError.value = t('auth.import.errUnsupportedFormat')
    } else {
      importError.value = t('auth.import.errCorrupted')
    }
  } finally {
    importLoading.value = false
  }
}

async function submit() {
  error.value = ''
  if (!passphrase.value) {
    error.value = t('auth.errEnterPassphrase')
    return
  }
  if (!auth.initialized && passphrase.value !== confirmPassphrase.value) {
    error.value = t('auth.errMismatch')
    return
  }
  if (!auth.initialized && !strength.value.acceptable) {
    error.value = t('backup.export.errTooShort', { min: MIN_PASSPHRASE_LENGTH })
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
    error.value = auth.initialized ? t('auth.errWrongPassphrase') : t('auth.errFailedCreate')
  } finally {
    loading.value = false
    passphrase.value = ''
    confirmPassphrase.value = ''
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-surface p-4">
    <div class="w-full max-w-sm">
      <!-- Logo -->
      <div class="text-center mb-8">
        <p class="text-3xl font-bold text-ink tracking-tight">{{ t('auth.title') }}</p>
        <p class="text-sm text-ink-muted mt-1">{{ t('auth.subtitle') }}</p>
      </div>

      <div class="bg-raised rounded-card border border-edge shadow-elevated p-8 space-y-5">

        <!-- Import from backup -->
        <template v-if="importMode">
          <div>
            <h2 class="font-semibold text-ink">{{ t('auth.import.title') }}</h2>
            <p class="text-sm text-ink-muted mt-1">{{ t('auth.import.subtitle') }}</p>
          </div>
          <div class="space-y-3">
            <div>
              <label class="block text-xs font-medium text-ink-muted mb-1.5">{{ t('auth.import.backupFile') }}</label>
              <input
                type="file"
                accept=".json"
                @change="handleFileSelect"
                class="w-full text-sm text-ink-muted file:mr-3 file:rounded-input file:border-0 file:bg-accent-tint file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-accent hover:file:bg-accent-tint cursor-pointer"
              />
            </div>
            <div>
              <label class="block text-xs font-medium text-ink-muted mb-1.5">{{ t('auth.import.backupPassphrase') }}</label>
              <input
                v-model="importPassphrase"
                type="password"
                autocomplete="current-password"
                :placeholder="t('auth.import.passphrasePlaceholder')"
                class="w-full border border-edge rounded-input px-3 py-2 text-sm text-ink bg-surface placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-accent/25 focus:border-accent transition-colors"
                autofocus
              />
            </div>
            <p v-if="importError" class="text-sm text-danger">{{ importError }}</p>
            <button
              @click="submitImport"
              :disabled="importLoading"
              class="w-full bg-accent text-on-accent rounded-input py-2.5 text-sm font-semibold hover:bg-accent-dim disabled:opacity-50 transition-colors"
            >
              {{ importLoading ? t('auth.import.restoring') : t('auth.import.restoreBtn') }}
            </button>
            <button
              @click="exitImportMode"
              :disabled="importLoading"
              class="w-full text-sm text-ink-muted hover:text-ink transition-colors py-1"
            >
              {{ t('auth.import.backBtn') }}
            </button>
          </div>
        </template>

        <!-- Create / Unlock -->
        <template v-else>
          <div>
            <h2 class="font-semibold text-ink">
              {{ auth.initialized ? t('auth.unlock.heading') : t('auth.createVault.heading') }}
            </h2>
            <p class="text-sm text-ink-muted mt-1">
              {{ auth.initialized ? t('auth.unlock.hint') : t('auth.createVault.hint') }}
            </p>
          </div>
          <form @submit.prevent="submit" class="space-y-3">
            <div>
              <label class="block text-xs font-medium text-ink-muted mb-1.5">{{ t('auth.passphrase') }}</label>
              <input
                v-model="passphrase"
                type="password"
                :autocomplete="auth.initialized ? 'current-password' : 'new-password'"
                class="w-full border border-edge rounded-input px-3 py-2 text-sm text-ink bg-surface placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-accent/25 focus:border-accent transition-colors"
                :placeholder="auth.initialized ? t('auth.unlock.passphrasePlaceholder') : t('auth.createVault.passphrasePlaceholder')"
                autofocus
              />
            </div>

            <!-- Passphrase strength meter -->
            <div v-if="!auth.initialized && passphrase.length > 0" class="space-y-1.5">
              <div class="flex gap-1">
                <div
                  v-for="i in 4"
                  :key="i"
                  class="h-1 flex-1 rounded-pill transition-colors"
                  :class="i <= strength.score
                    ? strength.score >= 3 ? 'bg-ok'
                    : strength.score === 2 ? 'bg-warn'
                    : 'bg-danger'
                    : 'bg-edge-strong'"
                />
              </div>
              <p
                class="text-xs"
                :class="strength.acceptable ? 'text-ink-muted' : 'text-danger'"
              >{{ t(strength.labelKey, strength.labelParams ?? {}) }}</p>
            </div>

            <div v-if="!auth.initialized">
              <label class="block text-xs font-medium text-ink-muted mb-1.5">{{ t('auth.confirmPassphrase') }}</label>
              <input
                v-model="confirmPassphrase"
                type="password"
                autocomplete="new-password"
                class="w-full border border-edge rounded-input px-3 py-2 text-sm text-ink bg-surface placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-accent/25 focus:border-accent transition-colors"
                :placeholder="t('auth.createVault.repeatPlaceholder')"
              />
            </div>

            <p v-if="error" class="text-sm text-danger">{{ error }}</p>

            <button
              type="submit"
              :disabled="loading"
              class="w-full bg-accent text-on-accent rounded-input py-2.5 text-sm font-semibold hover:bg-accent-dim disabled:opacity-50 transition-colors"
            >
              {{ loading ? t('auth.unlocking') : auth.initialized ? t('auth.unlockBtn') : t('auth.createVaultBtn') }}
            </button>

            <p v-if="!auth.initialized" class="text-xs text-ink-faint text-center leading-relaxed">
              {{ t('auth.noRecovery') }}
            </p>
            <p v-if="!auth.initialized" class="text-center">
              <button
                type="button"
                @click="enterImportMode"
                class="text-sm text-accent hover:text-accent-dim transition-colors"
              >
                {{ t('auth.restoreLink') }}
              </button>
            </p>
          </form>
        </template>

      </div>
    </div>
  </div>
</template>
