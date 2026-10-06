import { expect, test } from '@playwright/test'
import {
  cellInput,
  openSolver,
  readCounters,
  selectSamplePuzzle,
  statusMessage,
  stepUntilCounterReads,
} from './support/solverPage.ts'

test.describe('the solver reaches every state drawn in the design', () => {
  test('frame 03: Đề 3 is ready', async ({ page }) => {
    await openSolver(page)
    await expect(statusMessage(page)).toHaveText('Đề hợp lệ, có 40 ô trống. Bấm Từng bước hoặc Tự động để bắt đầu.')
    expect(await readCounters(page)).toEqual(['0', '0', '0'])
  })

  test('frames 05, 18 and 04: backtrack at try 803, accept at 804, reject at 814', async ({ page }) => {
    await openSolver(page)

    await stepUntilCounterReads(page, 'Trả lại', '81')
    expect(await readCounters(page)).toEqual(['803', '93', '81'])
    await expect(statusMessage(page)).toHaveText('Quay lui: trả lại ô (4, 1) bằng cách xóa số 8. Tiếp theo sẽ thử số 9 ở chính ô này.')
    await expect(page.locator('.pseudocode__line--running')).toHaveText('            Trả lại trạng thái cũ của bài toán;')

    await page.getByRole('button', { name: 'Từng bước' }).click()
    expect(await readCounters(page)).toEqual(['804', '93', '81'])
    await expect(statusMessage(page)).toHaveText('Ô (4, 1) - thử số 9: chấp nhận được.')
    await expect(page.locator('.check-tag--accepted')).toHaveText('đúng')

    await stepUntilCounterReads(page, 'Lần thử', '814')
    expect(await readCounters(page)).toEqual(['814', '96', '81'])
    await expect(statusMessage(page)).toHaveText('Ô (4, 7) - thử số 2: bị loại vì 2 đã có ở hàng 4.')
    await expect(page.locator('.sudoku-cell--rejected')).toHaveText('2')
    await expect(page.locator('.sudoku-cell--conflict')).toHaveText('2')
    await expect(page.locator('.check-tag--rejected')).toHaveText('sai')
  })

  test('frame 06: Giải ngay solves Đề 3', async ({ page }) => {
    await openSolver(page)
    await page.getByRole('button', { name: 'Giải ngay' }).click()
    await expect(statusMessage(page)).toHaveText('Đã giải xong sau 1.909 lần thử và 187 lần trả lại.')
    await expect(page.locator('.sudoku-cell--solved')).toHaveCount(40)
    await expect(page.getByRole('button', { name: 'Tự động' })).toBeDisabled()
  })

  test('frame 07: a typed 7 that duplicates row 4 blocks the run buttons', async ({ page }) => {
    await openSolver(page)
    await cellInput(page, 4, 1).fill('7')
    await expect(statusMessage(page)).toHaveText(
      'Đề không hợp lệ: số 7 xuất hiện 2 lần ở hàng 4 (cột 1 và cột 4). Bạn hãy sửa lại rồi bấm Kiểm tra đề.',
    )
    await expect(page.locator('.sudoku-cell--inputError')).toHaveCount(2)
    for (const buttonName of ['Từng bước', 'Tự động', 'Giải ngay']) {
      await expect(page.getByRole('button', { name: buttonName })).toBeDisabled()
    }
  })

  test('frame 08: Đề 7 has no solution', async ({ page }) => {
    await openSolver(page)
    await selectSamplePuzzle(page, 7)
    await page.getByRole('button', { name: 'Giải ngay' }).click()
    await expect(statusMessage(page)).toHaveText(
      'Đề này không có lời giải. Ở ô (1, 1), cả 9 số đều bị loại: số 1 đã có ở cột 1, các số từ 2 đến 9 đã có ở hàng 1.',
    )
    expect(await readCounters(page)).toEqual(['9', '0', '0'])
  })

  test('frame 16: pasting 8 lines keeps the dialog open with an error', async ({ page }) => {
    await openSolver(page)
    await page.getByRole('button', { name: 'Dán đề' }).click()
    const dialog = page.getByRole('dialog', { name: 'Dán đề Sudoku' })
    const textarea = dialog.getByRole('textbox')
    const eightLines = (await textarea.inputValue()).split('\n').slice(0, 8).join('\n')
    await textarea.fill(eightLines)
    await dialog.getByRole('button', { name: 'Dùng đề này' }).click()
    await expect(dialog).toBeVisible()
    await expect(dialog.getByRole('alert')).toHaveText('Đề cần có đúng 9 dòng, mỗi dòng 9 ô, nhưng bạn đã dán 8 dòng.')
    await expect(textarea).toHaveAttribute('aria-invalid', 'true')
  })

  test('the paste dialog loads a valid puzzle, closes with Esc and returns focus to "Dán đề"', async ({ page }) => {
    await openSolver(page)
    const pasteButton = page.getByRole('button', { name: 'Dán đề' })

    await pasteButton.click()
    await page.getByRole('button', { name: 'Dùng đề này' }).click()
    await expect(page.getByRole('dialog')).toBeHidden()
    await expect(page.locator('#sample-puzzle')).toHaveValue('4')
    await expect(pasteButton).toBeFocused()

    await pasteButton.click()
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog')).toBeHidden()
    await expect(pasteButton).toBeFocused()
  })
})

test('hovering a coloured cell explains what its colour means', async ({ page }) => {
  await openSolver(page)
  await stepUntilCounterReads(page, 'Lần thử', '814')
  await expect(page.locator('.sudoku-cell--rejected')).toHaveAttribute('title', 'Bị loại')
  await expect(page.locator('.sudoku-cell--conflict')).toHaveAttribute('title', 'Đề cho · ô gây mâu thuẫn')
})
