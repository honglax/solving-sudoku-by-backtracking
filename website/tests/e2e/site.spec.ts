import { expect, test } from '@playwright/test'

const PAGES = [
  { path: '/', title: 'Sudoku · Quay lui' },
  { path: '/solver', title: 'Giải Sudoku · Sudoku · Quay lui' },
  { path: '/algorithm', title: 'Thuật toán · Sudoku · Quay lui' },
  { path: '/compare', title: 'So sánh · Sudoku · Quay lui' },
  { path: '/all-solutions', title: 'Mọi lời giải · Sudoku · Quay lui' },
  { path: '/sizes', title: 'Kích thước lưới · Sudoku · Quay lui' },
  { path: '/about', title: 'Giới thiệu · Sudoku · Quay lui' },
  { path: '/khong-co-trang-nay', title: 'Không tìm thấy trang · Sudoku · Quay lui' },
]

test('every page has its own title, and unknown paths show the 404 page', async ({ page }) => {
  for (const sitePage of PAGES) {
    await page.goto(sitePage.path)
    await expect(page).toHaveTitle(sitePage.title)
  }
  await expect(page.getByRole('heading', { name: 'Không tìm thấy trang' })).toBeVisible()
})

const UNFILLED_PLACEHOLDER_PATTERN = /\{\w+\}/
const RAW_MARKUP_PATTERN = /<\/?(strong|nowrap)>/

test('no page shows an unfilled {placeholder} or raw markup from the locale file', async ({ page }) => {
  for (const sitePage of PAGES) {
    await page.goto(sitePage.path)
    await page.waitForLoadState('networkidle')
    await expect(page).toHaveTitle(sitePage.title)
    const bodyText = await page.locator('body').innerText()
    expect(bodyText, sitePage.path).not.toMatch(UNFILLED_PLACEHOLDER_PATTERN)
    expect(bodyText, sitePage.path).not.toMatch(RAW_MARKUP_PATTERN)
  }
})

for (const viewport of [{ width: 1366, height: 680 }, { width: 1712, height: 1225 }, { width: 390, height: 844 }]) {
  test(`the header stays in the same place on every page at ${viewport.width} px`, async ({ page }) => {
    await page.setViewportSize(viewport)
    const wordmarkPositions: number[] = []
    for (const sitePage of PAGES) {
      await page.goto(sitePage.path)
      const box = await page.getByRole('link', { name: 'Sudoku · Quay lui' }).boundingBox()
      wordmarkPositions.push(Math.round(box?.x ?? -1))
    }
    expect(new Set(wordmarkPositions).size).toBe(1)
  })
}

for (const width of [1020, 1366]) {
  test(`at ${width} px every navigation link stays on one line`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 })
    await page.goto('/')
    const linkHeights = await page
      .getByRole('navigation', { name: 'Điều hướng chính' })
      .getByRole('link')
      .evaluateAll(links => links.map(link => Math.round(link.getBoundingClientRect().height)))
    expect(new Set(linkHeights).size).toBe(1)
    const horizontalOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    )
    expect(horizontalOverflow).toBeLessThanOrEqual(0)
  })
}

test('below 1020 px the navigation moves into the menu', async ({ page }) => {
  await page.setViewportSize({ width: 1019, height: 800 })
  await page.goto('/')
  await expect(page.getByRole('button', { name: 'Menu' })).toBeVisible()
})

test('the chosen theme is remembered after a reload', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Tối' }).click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  await page.reload()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  await expect(page.getByRole('button', { name: 'Tối' })).toHaveAttribute('aria-pressed', 'true')
})

test('the home page explains speed with the measured Inkala count', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Nhanh cỡ nào?' })).toBeVisible()
  await expect(page.getByText('445.778', { exact: true })).toBeVisible()
})

test('the algorithm page highlights the section being read, including the last one', async ({ page }) => {
  await page.goto('/algorithm')
  const tableOfContents = page.getByRole('navigation', { name: 'Nội dung' })
  await page.locator('#modelling').scrollIntoViewIfNeeded()
  await page.evaluate(() => document.getElementById('modelling')?.scrollIntoView())
  await expect(tableOfContents.locator('[aria-current="true"]')).toHaveText('Mô hình hóa lời giải')
  await page.evaluate(() => document.getElementById('anti-backtracking')?.scrollIntoView())
  await expect(tableOfContents.locator('[aria-current="true"]')).toHaveText('Đề chống quay lui')
})

test('the anti-backtracking link opens the solver with that puzzle loaded', async ({ page }) => {
  await page.goto('/algorithm')
  await page.getByRole('link', { name: 'Mở đề này trong trình giải' }).click()
  await expect(page).toHaveURL('/solver')
  await expect(page.locator('#sample-puzzle option:checked')).toHaveText('Chống quay lui (64 ô trống)')
})

test('the home grid animates real solver steps', async ({ page }) => {
  await page.goto('/')
  const grid = page.getByRole('img', { name: /Lưới Sudoku đang chạy/ })
  const firstFrame = await grid.innerText()
  await expect.poll(async () => grid.innerText(), { timeout: 5000 }).not.toBe(firstFrame)
})

test.describe('with reduced motion', () => {
  test.use({ reducedMotion: 'reduce' })

  test('the home grid stays still', async ({ page }) => {
    await page.goto('/')
    const grid = page.getByRole('img', { name: /Lưới Sudoku đang chạy/ })
    const firstFrame = await grid.innerText()
    await page.waitForTimeout(1500)
    expect(await grid.innerText()).toBe(firstFrame)
  })
})

test('the footer links to the algorithm page and About opens with who the site is for', async ({ page }) => {
  await page.goto('/about')
  await expect(page.getByText('Trang này dành cho người mới học thuật toán')).toBeVisible()
  await expect(page.getByRole('row', { name: /Tác giả/ }).or(page.getByText('Tác giả'))).toBeVisible()
  await page.getByRole('contentinfo').getByRole('link', { name: 'Thuật toán hoạt động thế nào?' }).click()
  await expect(page).toHaveURL('/algorithm')
})

test('About links to the demo video and the source code repository', async ({ page }) => {
  await page.goto('/about')
  await expect(page.getByRole('link', { name: 'Video demo' })).toHaveAttribute('href', 'https://drive.google.com/file/d/17Cao0DqJvkIfxP0bS9HgYQK4s9jReNdF/view?usp=sharing')
  const sourceCodeLink = page.getByRole('link', { name: 'Mã nguồn' })
  await expect(sourceCodeLink).toHaveAttribute('href', 'https://github.com/honglax/solving-sudoku-by-backtracking')
})

test('algorithm captions use the article text size, and table code matches the text beside it', async ({ page }) => {
  await page.goto('/algorithm')
  const articleFontSize = await page.locator('.algorithm-article__paragraph').first().evaluate(element => getComputedStyle(element).fontSize)
  const captionFontSize = await page.locator('.algorithm-article__caption').first().evaluate(element => getComputedStyle(element).fontSize)
  expect(captionFontSize).toBe(articleFontSize)
  const codeFontSize = await page.locator('.data-table .inline-code').first().evaluate(element => getComputedStyle(element).fontSize)
  const cellFontSize = await page.locator('.data-table td').nth(1).evaluate(element => getComputedStyle(element).fontSize)
  expect(codeFontSize).toBe(cellFontSize)
})
