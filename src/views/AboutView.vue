<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>

<template>
  <div class="max-w-lg mx-auto space-y-8 pb-12">
    <h1 class="text-xl font-semibold text-ink">{{ t('about.title') }}</h1>

    <section class="bg-raised border border-edge rounded-card shadow-card p-6 space-y-4">
      <p class="text-sm text-ink-muted leading-relaxed">{{ t('about.description') }}</p>
      <a
        href="https://github.com/ammul/inkvault"
        target="_blank"
        rel="noopener noreferrer"
        class="inline-block text-sm text-accent hover:underline font-medium"
      >{{ t('about.github') }}</a>
    </section>
  </div>
</template>
