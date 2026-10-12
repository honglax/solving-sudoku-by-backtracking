import { expect, test, type Page } from '@playwright/test'
import { counterValue, readCounters } from './support/solverPage.ts'

async function openSizes(page: Page) {
  await page.goto('/sizes')
  await expect(page.getByRole('button', { name: 'Giải ngay' })).toBeVisible()
}

async function choose(page: Page, sizeLabel: string, puzzleLabel: string) {
  await page.getByLabel('Kích thước lưới').selectOption({ label: sizeLabel })
  await page.getByLabel('Đề', { exact: true }).selectOption({ label: puzzleLabel })
}

function sizesStatus(page: Page) {
  return page.locator('.sized-page__status')
}

async function solveInstantly(page: Page) {
  await page.getByRole('button', { name: 'Giải ngay' }).click()
  await expect(page.getByRole('button', { name: 'Giải ngay' })).toBeDisabled()
}

const CASES = [
  { size: '9×9 (k = 9)', puzzle: 'Ngắn, có quay lui (16 ô trống)', counters: ['79', '19', '3'], statusText: 'Giải xong sau 79 lần thử' },
  { size: '4×4 (k = 4)', puzzle: 'Dễ (6 ô trống)', counters: ['11', '6', '0'], statusText: 'Giải xong sau 11 lần thử' },
  { size: '4×4 (k = 4)', puzzle: 'Có quay lui (10 ô trống)', counters: ['52', '17', '7'], statusText: 'Giải xong sau 52 lần thử' },
  { size: '4×4 (k = 4)', puzzle: 'Vô nghiệm (10 ô trống)', counters: ['44', '10', '10'], statusText: 'Đề này không có lời giải' },
  { size: '16×16 (k = 16)', puzzle: 'Dễ (40 ô trống)', counters: ['352', '41', '1'], statusText: 'Giải xong sau 352 lần thử' },
  { size: '16×16 (k = 16)', puzzle: 'Vừa (70 ô trống)', counters: ['1.111', '100', '30'], statusText: 'Giải xong sau 1.111 lần thử' },
  { size: '16×16 (k = 16)', puzzle: 'Rất khó (120 ô trống)', counters: ['406.824', '25.484', '25.364'], statusText: 'Giải xong sau 406.824 lần thử' },
]

for (const testCase of CASES) {
  test(`Giải ngay on ${testCase.size}, ${testCase.puzzle} gives the counts of the Python reference`, async ({ page }) => {
    await openSizes(page)
    await choose(page, testCase.size, testCase.puzzle)
    await solveInstantly(page)
    await expect(sizesStatus(page)).toContainText(testCase.statusText)
    expect(await readCounters(page)).toEqual(testCase.counters)
  })
}

test('Từng bước moves one try at a time and stops at the solution on a 4x4 grid', async ({ page }) => {
  await openSizes(page)
  await choose(page, '4×4 (k = 4)', 'Dễ (6 ô trống)')
  await page.getByRole('button', { name: 'Từng bước' }).click()
  await expect(counterValue(page, 'Lần thử')).toHaveText('1')
  await expect(sizesStatus(page)).toContainText('thử số')
  for (let press = 0; press < 20; press++) {
    if (await page.getByRole('button', { name: 'Từng bước' }).isDisabled()) {
      break
    }
    await page.getByRole('button', { name: 'Từng bước' }).click()
  }
  await expect(counterValue(page, 'Lần thử')).toHaveText('11')
  await expect(sizesStatus(page)).toContainText('Giải xong')
})

test('Đặt lại clears the counters and Từng bước starts again from the first try', async ({ page }) => {
  await openSizes(page)
  await choose(page, '4×4 (k = 4)', 'Có quay lui (10 ô trống)')
  await page.getByRole('button', { name: 'Từng bước' }).click()
  await page.getByRole('button', { name: 'Từng bước' }).click()
  await page.getByRole('button', { name: 'Đặt lại' }).click()
  expect(await readCounters(page)).toEqual(['0', '0', '0'])
  await page.getByRole('button', { name: 'Từng bước' }).click()
  await expect(counterValue(page, 'Lần thử')).toHaveText('1')
})

test('changing the size or the puzzle after a finished search keeps the page working', async ({ page }) => {
  const problems: string[] = []
  page.on('pageerror', error => problems.push(error.message))
  await openSizes(page)
  await choose(page, '4×4 (k = 4)', 'Vô nghiệm (10 ô trống)')
  await solveInstantly(page)
  await expect(sizesStatus(page)).toContainText('không có lời giải')
  await page.getByLabel('Kích thước lưới').selectOption({ label: '16×16 (k = 16)' })
  await expect(page.getByText('Đã xảy ra lỗi')).toHaveCount(0)
  expect(await readCounters(page)).toEqual(['0', '0', '0'])
  await expect(sizesStatus(page)).toContainText('mỗi ô có 16 số để thử')
  expect(problems).toEqual([])
})

test('the page shows the measured table and the bound text without leftover placeholders', async ({ page }) => {
  await openSizes(page)
  await expect(page.getByRole('heading', { name: 'Số lần thử của các đề mẫu' })).toBeVisible()
  await expect(page.locator('.sized-page__table tbody tr')).toHaveCount(11)
  await expect(page.locator('.sized-page__bound')).toContainText('một số có')
  const text = await page.locator('main').innerText()
  expect(text).not.toMatch(/\{\w+\}/)
})

for (const viewport of [
  { width: 1366, height: 680 },
  { width: 390, height: 844 },
]) {
  test(`the 16x16 grid fits the screen without horizontal scrolling at ${viewport.width} px`, async ({ page }) => {
    await page.setViewportSize(viewport)
    await openSizes(page)
    await choose(page, '16×16 (k = 16)', 'Dễ (40 ô trống)')
    const overflow = await page.evaluate(() => Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth))
    expect(overflow).toBe(0)
  })
}
