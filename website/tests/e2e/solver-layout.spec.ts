import { expect, test, type Page } from '@playwright/test'
import { openSolver, readPageMetrics, stepUntilCounterReads } from './support/solverPage.ts'

const DESKTOP_SIZES = [
  { width: 1366, height: 680 },
  { width: 1366, height: 768 },
  { width: 1440, height: 900 },
  { width: 1712, height: 1225 },
  { width: 1920, height: 1080 },
  { width: 2560, height: 1440 },
]

async function boardAndPanelTops(page: Page) {
  return page.evaluate(() => ({
    boardTop: document.querySelector('.solver-page__board')?.getBoundingClientRect().top ?? -1,
    panelsTop: document.querySelector('.solver-page__panels')?.getBoundingClientRect().top ?? -2,
  }))
}

test('at 1366 × 680 the solver matches the design exactly: 44 px cells, no scrolling', async ({ page }) => {
  await openSolver(page)
  await stepUntilCounterReads(page, 'Lần thử', '814')
  const metrics = await readPageMetrics(page)
  expect(metrics.scrollHeight).toBe(680)
  const cellWidth = await page.locator('.sudoku-cell').first().evaluate(cell => cell.getBoundingClientRect().width)
  expect(cellWidth).toBe(44)

  await page.getByRole('tab', { name: 'Lịch sử' }).click()
  expect((await readPageMetrics(page)).scrollHeight).toBe(680)
  const tableOverflow = await page.locator('.history-table').evaluate(table => table.scrollWidth - table.clientWidth)
  expect(tableOverflow).toBe(0)
})

for (const size of DESKTOP_SIZES) {
  test(`at ${size.width} × ${size.height} the solver fits without scrolling, panels beside the grid`, async ({ page }) => {
    await page.setViewportSize(size)
    await openSolver(page)
    const metrics = await readPageMetrics(page)
    expect(metrics.scrollHeight).toBeLessThanOrEqual(metrics.viewportHeight)
    expect(metrics.horizontalOverflow).toBe(0)
    const { boardTop, panelsTop } = await boardAndPanelTops(page)
    expect(Math.abs(boardTop - panelsTop)).toBeLessThan(1)
  })
}

test.describe('on a phone', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('nothing overflows sideways and the bottom bar holds the run buttons', async ({ page }) => {
    await openSolver(page)
    expect((await readPageMetrics(page)).horizontalOverflow).toBe(0)
    const bottomBar = page.locator('.solver-page__bottom-bar')
    for (const buttonName of ['Từng bước', 'Tự động', 'Giải ngay']) {
      await expect(bottomBar.getByRole('button', { name: buttonName })).toBeVisible()
    }
  })

  test('the Tùy chọn sheet opens, closes with Esc and returns focus', async ({ page }) => {
    await openSolver(page)
    const optionsButton = page.getByRole('button', { name: 'Tùy chọn' })
    await optionsButton.click()
    await expect(page.getByRole('dialog', { name: 'Tùy chọn' })).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog', { name: 'Tùy chọn' })).toBeHidden()
    await expect(optionsButton).toBeFocused()
  })

  test('the history table fits the screen and wraps long reasons', async ({ page }) => {
    await openSolver(page)
    await stepUntilCounterReads(page, 'Lần thử', '814')
    await page.locator('summary', { hasText: 'Lịch sử' }).click()
    await expect(page.locator('.history-table')).toBeVisible()
    const tableOverflow = await page.locator('.history-table').evaluate(table => table.scrollWidth - table.clientWidth)
    expect(tableOverflow).toBe(0)
    expect((await readPageMetrics(page)).horizontalOverflow).toBe(0)
  })
})

async function slotsCutInHalf(page: Page): Promise<number> {
  return page.locator('.solution-slots').evaluate(slots => {
    const visibleBottom = slots.getBoundingClientRect().bottom
    return [...slots.children].filter(slot => {
      const box = slot.getBoundingClientRect()
      return box.top < visibleBottom && box.bottom > visibleBottom + 0.5
    }).length
  })
}

for (const { size, sampleId } of [
  { size: { width: 1366, height: 680 }, sampleId: '6' },
  { size: { width: 1366, height: 768 }, sampleId: '3' },
  { size: { width: 1366, height: 768 }, sampleId: '6' },
  { size: { width: 1712, height: 1225 }, sampleId: '6' },
]) {
  test(`the S panel shows only whole rows: Đề ${sampleId} at ${size.width} × ${size.height}`, async ({ page }) => {
    await page.setViewportSize(size)
    await openSolver(page)
    await page.locator('#sample-puzzle').selectOption(sampleId)
    expect(await slotsCutInHalf(page)).toBe(0)
  })
}

test('the playback row fits its column at 1366 px with the ◀ button added', async ({ page }) => {
  await openSolver(page)
  const overflow = await page.locator('.solver-controls__playback').evaluate(row => {
    const rightmostChild = Math.max(...[...row.children].map(child => child.getBoundingClientRect().right))
    return rightmostChild - row.getBoundingClientRect().right
  })
  expect(overflow).toBeLessThanOrEqual(0)
  const stepBackBox = await page.getByRole('button', { name: 'Lùi một bước' }).boundingBox()
  expect(stepBackBox?.width).toBe(36)
})

test.describe('on a narrow phone', () => {
  test.use({ viewport: { width: 320, height: 640 } })

  test('the bottom bar labels are not cut off', async ({ page }) => {
    await openSolver(page)
    const cutLabels = await page.locator('.solver-page__bottom-bar .button').evaluateAll(buttons =>
      buttons.filter(button => button.scrollWidth > button.clientWidth + 1).length,
    )
    expect(cutLabels).toBe(0)
  })
})

test.describe('the puzzle name on a phone', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('shows the current puzzle and opens the options when tapped', async ({ page }) => {
    await openSolver(page)
    const switcher = page.getByRole('button', { name: 'Đổi đề: Đề 3 - Vừa (40 ô trống)' })
    await expect(switcher).toBeVisible()
    await switcher.click()
    await expect(page.getByRole('dialog', { name: 'Tùy chọn' })).toBeVisible()
  })
})
