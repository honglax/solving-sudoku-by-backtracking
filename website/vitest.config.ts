import { defineConfig } from 'vitest/config'

const SLOW_MACHINE_TEST_TIMEOUT_MILLISECONDS = 30_000

export default defineConfig({
  test: {
    include: ['tests/unit/**/*.test.ts'],
    testTimeout: SLOW_MACHINE_TEST_TIMEOUT_MILLISECONDS,
  },
})
