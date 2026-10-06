import { defineConfig } from '@playwright/test'

const PREVIEW_PORT = 4173
const PREVIEW_URL = `http://localhost:${PREVIEW_PORT}`

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  timeout: 60_000,
  reporter: [['list']],
  use: {
    baseURL: PREVIEW_URL,
    channel: 'chrome',
    viewport: { width: 1366, height: 680 },
    colorScheme: 'light',
    locale: 'vi-VN',
  },
  webServer: {
    command: `yarn build && yarn preview --port ${PREVIEW_PORT} --strictPort`,
    url: PREVIEW_URL,
    reuseExistingServer: false,
    timeout: 120_000,
  },
})
