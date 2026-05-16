import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/screenshots',
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:4173',
    viewport: { width: 390, height: 844 },
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: 'npm run preview',
    url: 'http://localhost:4173',
    reuseExistingServer: true,
  },
})
