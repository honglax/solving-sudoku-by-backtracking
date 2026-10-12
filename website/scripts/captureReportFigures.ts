import { chromium, type Page } from '@playwright/test'
import { fileURLToPath } from 'node:url'

const BASE_URL = process.argv[2] ?? 'http://localhost:4173'
const FIGURES_DIRECTORY = fileURLToPath(new URL('../../report/figures/', import.meta.url))
const DESKTOP_VIEWPORT = { width: 1366, height: 900 }
const FASTEST_SPEED_SLIDER_POSITION = '300'
const RACE_TIMEOUT_MILLISECONDS = 60_000

async function captureComparisonRace(page: Page) {
  await page.goto(`${BASE_URL}/compare`)
  await page.locator('.solver-race .speed-slider__input').fill(FASTEST_SPEED_SLIDER_POSITION)
  await page.getByRole('button', { name: 'Chạy' }).click()
  await page.locator('.solver-race__summary').waitFor({ timeout: RACE_TIMEOUT_MILLISECONDS })
  await page.locator('.solver-race').screenshot({ path: `${FIGURES_DIRECTORY}comparison-race.png` })
}

async function main() {
  const browser = await chromium.launch({ channel: 'chrome' })
  const page = await browser.newPage({ viewport: DESKTOP_VIEWPORT, locale: 'vi-VN', colorScheme: 'light' })
  await captureComparisonRace(page)
  await browser.close()
  console.log(`Figures written to ${FIGURES_DIRECTORY}`)
}

await main()
