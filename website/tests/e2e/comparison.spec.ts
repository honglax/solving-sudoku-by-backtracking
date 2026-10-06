import { expect, test } from '@playwright/test'

const METHOD_COUNT = 6
const FASTEST_SPEED_SLIDER_POSITION = '300'

test.describe('the race between filling in order and filling the easiest cell first', () => {
  test('Từng bước moves both grids forward by exactly one try', async ({ page }) => {
    await page.goto('/compare')
    const lanes = page.locator('.race-lane')
    await expect(lanes).toHaveCount(2)
    for (let stepNumber = 0; stepNumber < 5; stepNumber++) {
      await page.getByRole('button', { name: 'Từng bước' }).click()
    }
    for (const lane of await lanes.all()) {
      await expect(lane.locator('.race-lane__counters dd').first()).toHaveText('5')
    }
  })

  test('running to the end shows the measured try counts and a summary', async ({ page }) => {
    await page.goto('/compare')
    await page.locator('.solver-race .speed-slider__input').fill(FASTEST_SPEED_SLIDER_POSITION)
    await page.getByRole('button', { name: 'Chạy' }).click()

    await expect(page.locator('.solver-race__summary')).toHaveText(
      'Điền ô dễ nhất trước chỉ cần 226 lần thử, còn điền lần lượt cần 1.909 lần: ít hơn khoảng 8 lần.',
      { timeout: 30_000 },
    )
    await expect(page.getByRole('region', { name: 'Điền lần lượt' })).toContainText('Xong sau 1.909 lần thử')
    await expect(page.getByRole('region', { name: 'Điền ô dễ nhất trước' })).toContainText('Xong sau 226 lần thử')
    await expect(page.getByRole('button', { name: 'Chạy' })).toBeDisabled()
  })

  test('each empty cell shows how many digits still fit', async ({ page }) => {
    await page.goto('/compare')
    const firstLane = page.getByRole('region', { name: 'Điền lần lượt' })
    await expect(firstLane.locator('[data-candidate-count="1"]').first()).toHaveAttribute('title', 'Còn 1 số hợp lệ')
  })
})

test.describe('speed measurement', () => {
  test('measuring a puzzle fills the table with the counts the reference solvers measured', async ({ page }) => {
    await page.goto('/compare')
    await page.getByRole('button', { name: 'Đo', exact: true }).click()
    await expect(page.getByText(`Đã đo xong ${METHOD_COUNT} cách.`)).toBeVisible({ timeout: 30_000 })

    await page.getByText('Xem bảng số liệu đầy đủ').click()
    const rows = page.locator('.speed-measurement__table tbody tr')
    await expect(rows).toHaveCount(METHOD_COUNT)
    const rowMajorRow = rows.filter({ hasText: 'Điền lần lượt · Sổ ghi chép' })
    await expect(rowMajorRow.locator('td').nth(1)).toHaveText('445.778')
    const fewestCandidatesRow = rows.filter({ hasText: 'Điền ô dễ nhất trước · Sổ ghi chép' })
    await expect(fewestCandidatesRow.locator('td').nth(1)).toHaveText('90.665')
    await expect(page.getByRole('button', { name: 'Đo lại' })).toBeVisible()
  })

  test('stopping keeps finished rows and leaves the rest empty', async ({ page }) => {
    await page.goto('/compare')
    const puzzleSelect = page.getByLabel('Đề để đo')
    await puzzleSelect.selectOption({ label: 'Chống quay lui (64 ô trống)' })
    await expect(page.getByText('Mỗi cách điền lần lượt sẽ chạy từ 6 giây trở lên')).toBeVisible()
    await page.getByRole('button', { name: 'Đo', exact: true }).click()
    await expect(puzzleSelect).toBeDisabled()
    await page.getByRole('button', { name: 'Dừng' }).click()

    await expect(page.getByText('Đã dừng. Cách nào chưa đo thì để trống.')).toBeVisible()
    await expect(puzzleSelect).toBeEnabled()
  })

  test('changing the puzzle clears the previous measurements', async ({ page }) => {
    await page.goto('/compare')
    const puzzleSelect = page.getByLabel('Đề để đo')
    await puzzleSelect.selectOption({ index: 0 })
    await page.getByRole('button', { name: 'Đo', exact: true }).click()
    await expect(page.getByText(`Đã đo xong ${METHOD_COUNT} cách.`)).toBeVisible({ timeout: 30_000 })
    await puzzleSelect.selectOption({ index: 1 })

    await expect(page.locator('.speed-measurement .bar-chart')).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Đo', exact: true })).toBeVisible()
  })
})
