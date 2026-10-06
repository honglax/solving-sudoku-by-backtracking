import { expect, type Locator, type Page } from '@playwright/test'

export type CounterLabel = 'Lần thử' | 'Ghi nhận' | 'Trả lại'

const MAXIMUM_STEP_CLICKS = 5000

export async function openSolver(page: Page, path = '/solver') {
  await page.goto(path)
  await expect(page.getByRole('button', { name: 'Từng bước' })).toBeVisible()
}

export function counterValue(page: Page, label: CounterLabel): Locator {
  return page.locator('.solver-counter', { hasText: label }).locator('.solver-counter__value')
}

export async function readCounters(page: Page): Promise<string[]> {
  return Promise.all([
    counterValue(page, 'Lần thử').textContent(),
    counterValue(page, 'Ghi nhận').textContent(),
    counterValue(page, 'Trả lại').textContent(),
  ]).then(values => values.map(value => value ?? ''))
}

export function statusMessage(page: Page): Locator {
  return page.locator('.status-message__text').first()
}

export async function stepUntilCounterReads(page: Page, label: CounterLabel, expectedText: string) {
  await page.evaluate(
    async ({ counterLabel, targetText, maximumClicks }) => {
      const readCounter = () => {
        const counter = [...document.querySelectorAll('.solver-counter')].find(element =>
          element.textContent?.includes(counterLabel),
        )
        return counter?.querySelector('.solver-counter__value')?.textContent ?? ''
      }
      const stepButton = [...document.querySelectorAll<HTMLButtonElement>('button')].find(
        button => button.textContent?.trim() === 'Từng bước' && button.offsetParent !== null,
      )
      if (stepButton === undefined) {
        throw new Error('Visible "Từng bước" button not found')
      }
      for (let click = 0; click < maximumClicks; click++) {
        await new Promise<void>(resolve => queueMicrotask(resolve))
        await new Promise<void>(resolve => queueMicrotask(resolve))
        if (readCounter() === targetText) {
          return
        }
        stepButton.click()
      }
      throw new Error(`${counterLabel} never reached ${targetText}; last value ${readCounter()}`)
    },
    { counterLabel: label, targetText: expectedText, maximumClicks: MAXIMUM_STEP_CLICKS },
  )
}

export async function selectSamplePuzzle(page: Page, sampleId: number) {
  await page.locator('#sample-puzzle').selectOption(String(sampleId))
}

export function cellInput(page: Page, row: number, column: number): Locator {
  return page.getByRole('textbox', { name: `Ô (${row}, ${column})` })
}

export type PageMetrics = {
  scrollHeight: number
  viewportHeight: number
  horizontalOverflow: number
}

export async function readPageMetrics(page: Page): Promise<PageMetrics> {
  return page.evaluate(() => ({
    scrollHeight: document.documentElement.scrollHeight,
    viewportHeight: window.innerHeight,
    horizontalOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
  }))
}
