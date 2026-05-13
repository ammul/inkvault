<script setup lang="ts">
import { onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAppSettingsStore } from '@/stores/appSettings'

const { t } = useI18n()
const appSettings = useAppSettingsStore()

onMounted(async () => {
  if (!appSettings.loaded) await appSettings.load()
})

async function setAnimations(val: boolean) {
  appSettings.settings.animations = val
  appSettings.apply()
  await appSettings.save()
}
</script>

<template>
  <div>
    <h1 class="text-xl font-semibold text-ink mb-6">{{ t('appSettings.title') }}</h1>

    <section class="space-y-4">
      <h2 class="text-xs font-semibold text-ink-muted uppercase tracking-wider">
        {{ t('appSettings.appearance') }}
      </h2>

      <div class="bg-raised border border-edge rounded-card p-4 flex items-start justify-between gap-4">
        <div>
          <p class="text-sm font-medium text-ink">{{ t('appSettings.animations') }}</p>
          <p class="text-xs text-ink-muted mt-0.5">{{ t('appSettings.animationsDescription') }}</p>
        </div>
        <div class="flex gap-1 shrink-0">
          <button
            @click="setAnimations(true)"
            :class="appSettings.settings.animations
              ? 'bg-accent text-on-accent'
              : 'bg-subtle text-ink-muted hover:bg-edge'"
            class="text-sm px-3 py-1.5 rounded-input transition-colors font-medium"
          >{{ t('appSettings.on') }}</button>
          <button
            @click="setAnimations(false)"
            :class="!appSettings.settings.animations
              ? 'bg-accent text-on-accent'
              : 'bg-subtle text-ink-muted hover:bg-edge'"
            class="text-sm px-3 py-1.5 rounded-input transition-colors font-medium"
          >{{ t('appSettings.off') }}</button>
        </div>
      </div>
    </section>
  </div>
</template>
