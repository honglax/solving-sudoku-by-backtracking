import { chromium, type Page } from '@playwright/test'
import { fileURLToPath } from 'node:url'

const BASE_URL = process.argv[2] ?? 'http://localhost:4173'
const FIGURES_DIRECTORY = fileURLToPath(new URL('../../report/figures/', import.meta.url))
const DESKTOP_VIEWPORT = { width: 1366, height: 900 }
const RACE_SPEED_SLIDER_POSITION = process.argv[3] ?? '150'
const RACE_RUNNING_MILLISECONDS = Number(process.argv[4] ?? '2000')

async function captureComparisonRace(page: Page) {
  await page.goto(`${BASE_URL}/compare`)
  await page.locator('.solver-race .speed-slider__input').fill(RACE_SPEED_SLIDER_POSITION)
  await page.getByRole('button', { name: 'Chạy' }).click()
  await page.waitForTimeout(RACE_RUNNING_MILLISECONDS)
  await page.locator('.solver-race').screenshot({ path: `${FIGURES_DIRECTORY}comparison-race.png` })
}

const ILLUSTRATION_PUZZLE_LABEL = 'Đề 13 - Ngắn, có quay lui (16 ô trống)'
const ILLUSTRATION_STEP_BUTTON_PRESSES = [13, 29, 38, 120]
const EXCERPT_PUZZLE_LABEL = 'Đề 3 - Vừa (40 ô trống)'
const EXCERPT_STEP_BUTTON_PRESSES = [1044, 1070, 1089]

async function captureIllustrationStep(page: Page, pressCount: number) {
  await page.goto(`${BASE_URL}/solver`)
  await page.getByLabel('Đề mẫu').selectOption({ label: ILLUSTRATION_PUZZLE_LABEL })
  const stepButton = page.getByRole('button', { name: 'Từng bước' })
  for (let pressNumber = 0; pressNumber < pressCount; pressNumber++) {
    await stepButton.click()
  }
  const counters = await page.locator('.progress-panel, [class*="counters"]').first().innerText()
  console.log(`after ${pressCount} presses: ${counters.replaceAll('\n', ' ')}`)
  await page.locator('main').screenshot({ path: `${FIGURES_DIRECTORY}illustration-press-${pressCount}.png` })
}

async function captureExcerptStep(page: Page, pressCount: number) {
  await page.goto(`${BASE_URL}/solver`)
  await page.getByLabel('Đề mẫu').selectOption({ label: EXCERPT_PUZZLE_LABEL })
  await page.evaluate(async clickCount => {
    const stepButton = [...document.querySelectorAll<HTMLButtonElement>('button')].find(
      button => button.textContent?.trim() === 'Từng bước' && button.offsetParent !== null,
    )
    if (stepButton === undefined) {
      throw new Error('Visible "Từng bước" button not found')
    }
    for (let click = 0; click < clickCount; click++) {
      await new Promise<void>(resolve => queueMicrotask(resolve))
      await new Promise<void>(resolve => queueMicrotask(resolve))
      stepButton.click()
    }
  }, pressCount)
  await page.waitForTimeout(400)
  const counters = await page.locator('.progress-panel, [class*="counters"]').first().innerText()
  console.log(`after ${pressCount} presses: ${counters.replaceAll('\n', ' ')}`)
  await page.locator('main').screenshot({ path: `${FIGURES_DIRECTORY}excerpt-press-${pressCount}.png` })
}

async function main() {
  const browser = await chromium.launch({ channel: 'chrome' })
  const racePage = await browser.newPage({ viewport: DESKTOP_VIEWPORT, locale: 'vi-VN', colorScheme: 'light' })
  await captureComparisonRace(racePage)
  const stepPage = await browser.newPage({ viewport: DESKTOP_VIEWPORT, locale: 'vi-VN', colorScheme: 'light', reducedMotion: 'reduce' })
  for (const pressCount of ILLUSTRATION_STEP_BUTTON_PRESSES) {
    await captureIllustrationStep(stepPage, pressCount)
  }
  for (const pressCount of EXCERPT_STEP_BUTTON_PRESSES) {
    await captureExcerptStep(stepPage, pressCount)
  }
  await browser.close()
  console.log(`Figures written to ${FIGURES_DIRECTORY}`)
}

await main()
