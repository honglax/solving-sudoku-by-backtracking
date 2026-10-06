import { expect, test } from '@playwright/test'
import { openSolver, readCounters, selectSamplePuzzle, statusMessage, stepUntilCounterReads } from './support/solverPage.ts'

test.describe('history table', () => {
  test.beforeEach(async ({ page }) => {
    await openSolver(page)
    await stepUntilCounterReads(page, 'Lần thử', '814')
    await page.getByRole('tab', { name: 'Lịch sử' }).click()
  })

  test('labels every column and says it keeps only the last 100 steps', async ({ page }) => {
    const headers = page.getByRole('columnheader')
    await expect(headers).toHaveText(['Lần thử', 'Ô', 'Số', 'Kết quả', 'Lý do'])
    await expect(page.getByText('Chỉ lưu 100 bước gần nhất', { exact: true })).toBeVisible()
    await expect(page.getByText('Lịch sử chỉ lưu 100 bước gần nhất, nên các bước cũ hơn không xem lại được nữa.')).toBeAttached()
    await expect(page.locator('.history-table__row')).toHaveCount(100)
    await expect(page.locator('.history-table__row').first()).toContainText('814(4, 7)2Bị loạiđã có ở hàng 4')
  })

  test('reviewing the try-803 row shows frame 05, and the controls walk through history', async ({ page }) => {
    await page.getByRole('button', { name: 'Xem lại lần thử 803: Trả lại' }).click()
    expect(await readCounters(page)).toEqual(['803', '93', '81'])
    await expect(statusMessage(page)).toHaveText('Quay lui: trả lại ô (4, 1), xóa số 8. Ô này thử tiếp số 9.')
    await expect(page.getByText('Đang xem lại lần thử 803')).toBeVisible()
    await expect(page.locator('tr[aria-current="step"]')).toBeInViewport()

    await page.getByRole('button', { name: 'Từng bước' }).click()
    expect(await readCounters(page)).toEqual(['804', '93', '81'])

    await page.getByRole('button', { name: 'Trước' }).click()
    await page.getByRole('button', { name: 'Trước' }).click()
    expect(await readCounters(page)).toEqual(['803', '93', '80'])

    await page.getByRole('button', { name: 'Về bước mới nhất' }).click()
    expect(await readCounters(page)).toEqual(['814', '96', '81'])
    await expect(page.getByText('Đang xem lại lần thử')).toBeHidden()
  })

  test('choosing another puzzle clears the history', async ({ page }) => {
    await selectSamplePuzzle(page, 5)
    await expect(page.getByText('Chưa có bước nào. Bấm Từng bước hoặc Tự động để bắt đầu.')).toBeVisible()
  })
})
