import { expect, test } from '@playwright/test'
import {
  counterValue,
  openSolver,
  readCounters,
  selectSamplePuzzle,
  statusMessage,
  stepUntilCounterReads,
} from './support/solverPage.ts'

const ANTI_BACKTRACKING_LINK_NAME = 'Mở đề này trong trình giải'

function parseCount(text: string | null): number {
  return Number((text ?? '').replaceAll('.', ''))
}

test('Tự động runs about 20 tries in one second at the default speed, and Tạm dừng stops it', async ({ page }) => {
  await openSolver(page)
  await page.getByRole('button', { name: 'Tự động' }).click()
  await page.waitForTimeout(1000)
  await page.getByRole('button', { name: 'Tạm dừng' }).click()

  const triesAfterOneSecond = parseCount(await counterValue(page, 'Lần thử').textContent())
  expect(triesAfterOneSecond).toBeGreaterThanOrEqual(15)
  expect(triesAfterOneSecond).toBeLessThanOrEqual(25)

  await page.waitForTimeout(500)
  expect(parseCount(await counterValue(page, 'Lần thử').textContent())).toBe(triesAfterOneSecond)
})

test('Giải ngay solves Arto Inkala with the same counts as the Python baseline', async ({ page }) => {
  await openSolver(page)
  await selectSamplePuzzle(page, 5)
  await page.getByRole('button', { name: 'Giải ngay' }).click()
  await expect(statusMessage(page)).toHaveText('Đã giải xong sau 445.778 lần thử và 49.498 lần trả lại.', { timeout: 15_000 })
  expect(await readCounters(page)).toEqual(['445.778', '49.558', '49.498'])
})

test('a long Giải ngay shows progress, Dừng pauses it, Giải ngay resumes and Đặt lại stops it', async ({ page }) => {
  await page.goto('/algorithm')
  await page.getByRole('link', { name: ANTI_BACKTRACKING_LINK_NAME }).click()
  await expect(page.locator('#sample-puzzle')).toHaveValue('12')

  await page.getByRole('button', { name: 'Giải ngay' }).click()
  await expect(statusMessage(page)).toContainText('Đang giải…')
  await page.getByRole('button', { name: 'Dừng' }).click()
  await expect(statusMessage(page)).toContainText('Đã dừng sau')
  const triesWhenStopped = parseCount(await counterValue(page, 'Lần thử').textContent())
  await page.waitForTimeout(500)
  expect(parseCount(await counterValue(page, 'Lần thử').textContent())).toBe(triesWhenStopped)

  await page.getByRole('button', { name: 'Giải ngay' }).click()
  await expect
    .poll(async () => parseCount(await counterValue(page, 'Lần thử').textContent()))
    .toBeGreaterThan(triesWhenStopped)

  await page.getByRole('button', { name: 'Đặt lại' }).click()
  expect(await readCounters(page)).toEqual(['0', '0', '0'])
  await page.waitForTimeout(300)
  expect(await readCounters(page)).toEqual(['0', '0', '0'])
})

test('the ◀ button steps back one event, and Từng bước moves forward again', async ({ page }) => {
  await openSolver(page)
  await expect(page.getByRole('button', { name: 'Lùi một bước' })).toBeDisabled()
  await stepUntilCounterReads(page, 'Lần thử', '814')
  await page.getByRole('button', { name: 'Lùi một bước' }).click()
  expect(await readCounters(page)).toEqual(['813', '96', '81'])
  await expect(page.getByText('Đang xem lại lần thử 813')).toBeVisible()
  await page.getByRole('button', { name: 'Từng bước' }).click()
  expect(await readCounters(page)).toEqual(['814', '96', '81'])
})

test('Tới lần quay lui kế jumps straight to each backtrack', async ({ page }) => {
  await openSolver(page)
  await page.getByRole('button', { name: 'Tới lần quay lui kế' }).click()
  await expect(counterValue(page, 'Trả lại')).toHaveText('1')
  await expect(statusMessage(page)).toContainText('Quay lui: trả lại')
  await page.getByRole('button', { name: 'Tới lần quay lui kế' }).click()
  await expect(counterValue(page, 'Trả lại')).toHaveText('2')
})

test('Tự động pauses at the first backtrack and asks the visitor to guess', async ({ page }) => {
  await openSolver(page)
  await page.getByRole('slider', { name: 'Tốc độ' }).fill('300')
  await page.getByRole('button', { name: 'Tự động' }).click()
  await expect(statusMessage(page)).toContainText('Lần quay lui đầu tiên!', { timeout: 15_000 })
  await expect(statusMessage(page)).toContainText('Bạn đoán bước tiếp theo là gì?')
  await expect(page.getByRole('button', { name: 'Tự động' })).toBeVisible()
  await expect(counterValue(page, 'Trả lại')).toHaveText('1')

  await page.getByRole('button', { name: 'Tự động' }).click()
  await expect.poll(async () => parseCount(await counterValue(page, 'Trả lại').textContent())).toBeGreaterThan(1)
})

test('switching puzzles right after a finished no-solution search keeps the page working', async ({ page }) => {
  const pageErrors: string[] = []
  page.on('pageerror', error => pageErrors.push(error.message))
  page.on('console', message => {
    if (message.type() === 'error') {
      pageErrors.push(message.text())
    }
  })
  await openSolver(page)
  await selectSamplePuzzle(page, 7)
  await page.getByRole('button', { name: 'Giải ngay' }).click()
  await expect(statusMessage(page)).toContainText('Đề này không có lời giải')

  await selectSamplePuzzle(page, 9)

  await expect(page.getByText('Đã xảy ra lỗi')).toHaveCount(0)
  await expect(page.locator('#sample-puzzle')).toHaveValue('9')
  await expect(statusMessage(page)).toContainText('Đề hợp lệ')
  expect(pageErrors).toEqual([])
})

test('Đặt lại clears the counters and the next step starts from the first try again', async ({ page }) => {
  await openSolver(page)
  await selectSamplePuzzle(page, 13)
  await page.getByRole('button', { name: 'Từng bước' }).click()
  await page.getByRole('button', { name: 'Từng bước' }).click()
  await page.getByRole('button', { name: 'Đặt lại' }).click()
  expect(await readCounters(page)).toEqual(['0', '0', '0'])

  await page.getByRole('button', { name: 'Từng bước' }).click()
  await expect(counterValue(page, 'Lần thử')).toHaveText('1')
})
