import { expect, test } from '@playwright/test'

const FASTEST_SPEED_SLIDER_POSITION = '300'

test('Tìm hết counts every solution of the multiple-solution puzzle', async ({ page }) => {
  await page.goto('/all-solutions')
  await page.getByRole('button', { name: 'Tìm hết' }).click()

  const status = page.locator('.all-solutions-page__status')
  await expect(status).toHaveText(
    'Đã thử hết mọi khả năng sau 43.317 lần thử: đề này có 18 lời giải. Một đề Sudoku đúng chuẩn chỉ được có một.',
    { timeout: 30_000 },
  )
  await expect(page.locator('.solution-thumbnail')).toHaveCount(18)
  await expect(page.locator('.solution-thumbnail').first()).toContainText('lời giải đầu tiên')
  await expect(page.getByRole('button', { name: 'Tìm hết' })).toBeDisabled()
})

test('Chạy pauses at the first solution, after the same tries as the solver that stops there', async ({ page }) => {
  await page.goto('/all-solutions')
  await page.locator('.speed-slider__input').fill(FASTEST_SPEED_SLIDER_POSITION)
  await page.getByRole('button', { name: 'Chạy' }).click()

  await expect(page.locator('.all-solutions-page__status')).toContainText('Tìm thấy lời giải thứ 1 sau 827 lần thử', {
    timeout: 30_000,
  })
  await expect(page.locator('.pseudocode__line--running')).toContainText('Xuất lời giải')

  await page.getByRole('button', { name: 'Từng bước' }).click()
  await expect(page.locator('.pseudocode__line--running')).toContainText('chấp nhận được')
})

test('a puzzle with exactly one solution is called a proper Sudoku', async ({ page }) => {
  await page.goto('/all-solutions')
  await page.getByLabel('Đề', { exact: true }).selectOption({ label: 'Đề 4 - Wikipedia (51 ô trống)' })
  await page.getByRole('button', { name: 'Tìm hết' }).click()

  await expect(page.locator('.all-solutions-page__status')).toHaveText(
    'Đã thử hết mọi khả năng sau 41.679 lần thử: đề này có đúng một lời giải, đúng chuẩn của một đề Sudoku.',
    { timeout: 30_000 },
  )
})

test('the empty grid explains why it can never be counted, and Dừng stops the search', async ({ page }) => {
  await page.goto('/all-solutions')
  await page.getByLabel('Đề', { exact: true }).selectOption({ label: 'Đề 6 - Lưới trống (81 ô trống)' })
  await expect(page.getByText('6.670.903.752.021.072.936.960 lời giải')).toBeVisible()
  await page.getByRole('button', { name: 'Tìm hết' }).click()
  await expect(page.locator('.solution-thumbnail').nth(10)).toBeVisible({ timeout: 30_000 })
  await page.getByRole('button', { name: 'Dừng' }).click()

  await expect(page.locator('.all-solutions-page__status')).toContainText('Đã tạm dừng')
  await expect(page.getByRole('button', { name: 'Tìm hết' })).toBeEnabled()
})
