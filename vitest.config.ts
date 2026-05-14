import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['tests/unit/setup.ts'],
    include: ['tests/unit/**/*.{test,spec}.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary'],
      include: ['src/**'],
      exclude: [
        'src/main.ts',
        'src/**/*.vue',
        'src/router/**',
        'src/i18n/**',
        'src/types/**',
      ],
    },
  },
  resolve: {
    alias: { '@': resolve(__dirname, 'src') },
  },
})
