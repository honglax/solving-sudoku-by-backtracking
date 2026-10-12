import { expect, type FrameLocator } from '@playwright/test'
import { spawnSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { captionText, DemoStage } from './demoStage.ts'

const WEBSITE_DIRECTORY = fileURLToPath(new URL('../../', import.meta.url))
const RESULTS_PATH = fileURLToPath(new URL('../../../testcases/results/results.csv', import.meta.url))
const PHONE_WIDTH = 390
const SLOW_STEP_SECONDS = 1.1
const FAST_STEP_SECONDS = 0.35
const AUTO_PLAY_SLIDER_POSITION = '170'
const RACE_SLIDER_POSITION = '220'
const SOLVER_COMPONENT_STEP_PRESSES = 16
const LONG_WAIT_MILLISECONDS = 120_000
const TERMINAL_LINE_SECONDS = 0.12

const SAMPLE_IDS = {
  medium: 3,
  inkala: 5,
  emptyGrid: 6,
  noSolutionAtFirstCell: 7,
  multipleSolutions: 8,
  noSolutionAfterSearch: 9,
  shortWithBacktracking: 13,
}

const ILLUSTRATION_PUZZLE = '53467.9..67..95348.9834.5678.976..234.6.537917139.48569615372.4287419635.45.86179'
const DUPLICATE_FIVES_PUZZLE = '55467.9..67..95348.9834.5678.976..234.6.537917139.48569615372.4287419635.45.86179'
const COMPLETE_PUZZLE = '534678912672195348198342567859761423426853791713924856961537284287419635345286179'

function navigationLink(site: FrameLocator, name: string) {
  return site.getByRole('navigation', { name: 'Điều hướng chính' }).getByRole('link', { name })
}

function counter(site: FrameLocator, label: string) {
  return site.locator('.solver-counter', { hasText: label }).locator('.solver-counter__value')
}

function sampleSelect(site: FrameLocator) {
  return site.locator('#sample-puzzle')
}

async function printCounters(stage: DemoStage, sceneLabel: string) {
  const values = await Promise.all(['Lần thử', 'Ghi nhận', 'Trả lại'].map(label => counter(stage.site, label).textContent()))
  console.log(`${sceneLabel}: ${values.join(' / ')}`)
}

async function pasteIntoDialog(stage: DemoStage, puzzleText: string) {
  const { site } = stage
  await stage.click(site.getByRole('button', { name: 'Dán đề' }))
  const dialog = site.getByRole('dialog', { name: 'Dán đề Sudoku' })
  await dialog.getByRole('textbox').fill(puzzleText)
  await stage.pause(1.2)
  await stage.click(dialog.getByRole('button', { name: 'Dùng đề này' }))
}

export async function recordHomeAndPages(stage: DemoStage) {
  const { site } = stage
  await stage.openSitePath('/')
  await stage.narrate('home')
  await stage.click(navigationLink(site, 'Thuật toán'))
  await stage.narrate('algorithm')
  await site.locator('body').evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }))
  await stage.narrate('algorithmAnti')
  await stage.click(navigationLink(site, 'Giới thiệu'))
  await stage.narrate('about')
}

export async function recordSolverComponents(stage: DemoStage) {
  const { site } = stage
  await stage.openSitePath('/solver')
  await stage.narrate('solverOpen')
  await stage.showCaption(captionText('solverGrid'))
  await stage.highlight(site.getByRole('group', { name: 'Lưới Sudoku' }), 2.6)
  await stage.showCaption(captionText('solverLegend'))
  await stage.moveCursorTo(site.getByTitle('Đề cho', { exact: true }).first())
  await stage.highlight(site.locator('.grid-legend'), 5.5)
  await stage.showCaption(captionText('solverPseudocode'))
  await stage.highlight(site.locator('.pseudocode').first(), 3.2)
  await stage.showCaption(captionText('solverStepSome'))
  const stepButton = site.getByRole('button', { name: 'Từng bước' })
  await stage.click(stepButton)
  for (let press = 2; press <= SOLVER_COMPONENT_STEP_PRESSES; press++) {
    await stage.clickQuickly(stepButton, FAST_STEP_SECONDS + 0.2)
  }
  await stage.showCaption(captionText('solverVector'))
  await stage.highlight(site.locator('.solution-slots'), 3)
  await stage.showCaption(captionText('solverHistory'))
  await stage.click(site.getByRole('tab', { name: 'Lịch sử' }))
  await stage.highlight(site.getByRole('tabpanel', { name: 'Lịch sử' }), 3.8)
  await stage.click(site.getByRole('tab', { name: /^S =/ }))
  await stage.showCaption(captionText('solverCounters'))
  await stage.highlight(site.locator('.solver-counters'), 2.8)
  await stage.showCaption(captionText('solverStatus'))
  await stage.highlight(site.locator('.status-message').first(), 3)
  await stage.showCaption(captionText('solverControls'))
  await stage.highlight(site.locator('.solver-controls__playback'), 3)
  await stage.showCaption(captionText('solverSpeed'))
  await stage.highlight(site.locator('.solver-controls__speed'), 3)
  await stage.showCaption(captionText('solverTheme'))
  await stage.click(site.getByRole('button', { name: 'Tối' }))
  await stage.pause(2.2)
  await stage.click(site.getByRole('button', { name: 'Sáng' }))
  await stage.pause(1)
}

export async function recordInputWays(stage: DemoStage) {
  const { site } = stage
  await stage.openSitePath('/solver')
  await stage.showCaption(captionText('inputSelect'))
  await stage.selectOption(sampleSelect(site), String(SAMPLE_IDS.inkala))
  await stage.pause(1.6)
  await stage.selectOption(sampleSelect(site), String(SAMPLE_IDS.medium))
  await stage.pause(1.4)
  await stage.showCaption(captionText('inputType'))
  await stage.selectOption(sampleSelect(site), String(SAMPLE_IDS.emptyGrid))
  await stage.type(site.getByRole('textbox', { name: 'Ô (1, 1)' }), '5')
  await stage.type(site.getByRole('textbox', { name: 'Ô (1, 2)' }), '3')
  await stage.type(site.getByRole('textbox', { name: 'Ô (1, 3)' }), '4')
  await stage.pause(1)
  await stage.showCaption(captionText('inputCheck'))
  await stage.click(site.getByRole('button', { name: 'Kiểm tra đề' }))
  await stage.pause(3)
  await stage.showCaption(captionText('inputPaste'))
  await pasteIntoDialog(stage, ILLUSTRATION_PUZZLE)
  await stage.pause(1)
  await stage.narrate('inputPasted')
}

export async function recordStepping(stage: DemoStage) {
  const { site } = stage
  const stepButton = site.getByRole('button', { name: 'Từng bước' })
  await stage.openSitePath(`/solver`)
  await stage.selectOption(sampleSelect(site), String(SAMPLE_IDS.shortWithBacktracking))
  await stage.narrate('stepIntro')
  await stage.showCaption(captionText('stepAccept'))
  await stage.click(stepButton)
  await stage.pause(2)
  await stage.clickQuickly(stepButton, SLOW_STEP_SECONDS)
  await stage.showCaption(captionText('stepDescend'))
  await stage.clickQuickly(stepButton, 2)
  await stage.showCaption(captionText('stepReject'))
  await stage.clickQuickly(stepButton, 3)
  await stage.showCaption(captionText('stepExhaust'))
  for (let press = 5; press <= 12; press++) {
    await stage.clickQuickly(stepButton, FAST_STEP_SECONDS + 0.25)
  }
  await stage.pause(1.2)
  await stage.showCaption(captionText('stepRestore'))
  await stage.clickQuickly(stepButton, 4.5)
  await printCounters(stage, 'press 13')
  await stage.showCaption(captionText('stepBack'))
  await stage.click(site.getByRole('button', { name: 'Lùi một bước' }))
  await stage.pause(1.6)
  await stage.clickQuickly(stepButton, 1.6)
  await stage.showCaption(captionText('stepJump'))
  const jumpButton = site.getByRole('button', { name: 'Tới lần quay lui kế' })
  await stage.click(jumpButton)
  await stage.pause(0.6)
  await stage.showCaption(captionText('stepFirstChain'))
  await stage.pause(3.2)
  await printCounters(stage, 'second backtrack')
  await stage.click(jumpButton)
  await stage.showCaption(captionText('stepSecondChain'))
  await stage.pause(4.6)
  await printCounters(stage, 'third backtrack')
  await stage.showCaption(captionText('stepHistory'))
  await stage.click(site.getByRole('tab', { name: 'Lịch sử' }))
  await stage.pause(1)
  await stage.click(site.locator('.history-table__review-button').nth(6))
  await stage.pause(3)
  await stage.click(site.getByRole('button', { name: 'Về bước mới nhất' }))
  await stage.pause(0.8)
  await stage.click(site.getByRole('button', { name: 'Giải ngay' }))
  await expect(site.getByText('Đã giải', { exact: false }).first()).toBeVisible({ timeout: LONG_WAIT_MILLISECONDS })
  await stage.pause(0.8)
  await printCounters(stage, 'solved')
  await stage.narrate('stepSolved')
}

export async function recordAutoPlay(stage: DemoStage) {
  const { site } = stage
  await stage.openSitePath('/solver')
  await stage.showCaption(captionText('autoStart'))
  await site.locator('#playback-speed').fill(AUTO_PLAY_SLIDER_POSITION)
  await stage.click(site.getByRole('button', { name: 'Tự động' }))
  await expect(counter(site, 'Trả lại')).toHaveText('1', { timeout: LONG_WAIT_MILLISECONDS })
  await stage.pause(0.6)
  await stage.narrate('autoPause')
  await stage.showCaption(captionText('autoJump'))
  await stage.click(site.getByRole('button', { name: 'Tới lần quay lui kế' }))
  await stage.pause(4)
  await printCounters(stage, 'auto next backtrack')
}

export async function recordInstantSolve(stage: DemoStage) {
  const { site } = stage
  await stage.openSitePath('/solver')
  await stage.showCaption(captionText('instantSelect'))
  await stage.selectOption(sampleSelect(site), String(SAMPLE_IDS.inkala))
  await stage.pause(2.6)
  await stage.showCaption(captionText('instantSolve'))
  await stage.click(site.getByRole('button', { name: 'Giải ngay' }))
  await expect(site.locator('body')).toContainText('445.778', { timeout: LONG_WAIT_MILLISECONDS })
  await stage.pause(0.6)
  await stage.narrate('instantResult')
  await stage.pause(2)
}

export async function recordEdgeCases(stage: DemoStage) {
  const { site } = stage
  await stage.openSitePath('/solver')
  await stage.showCaption(captionText('invalid'))
  await pasteIntoDialog(stage, DUPLICATE_FIVES_PUZZLE)
  await stage.pause(1)
  await stage.click(site.getByRole('button', { name: 'Kiểm tra đề' }))
  await stage.pause(5.5)
  await stage.showCaption(captionText('noSolutionFirst'))
  await stage.selectOption(sampleSelect(site), String(SAMPLE_IDS.noSolutionAtFirstCell))
  await stage.click(site.getByRole('button', { name: 'Giải ngay' }))
  await stage.pause(5.5)
  await stage.showCaption(captionText('noSolutionSearch'))
  await stage.selectOption(sampleSelect(site), String(SAMPLE_IDS.noSolutionAfterSearch))
  await stage.click(site.getByRole('button', { name: 'Giải ngay' }))
  await stage.pause(5.5)
  await stage.showCaption(captionText('complete'))
  await pasteIntoDialog(stage, COMPLETE_PUZZLE)
  await stage.pause(1)
  await stage.click(site.getByRole('button', { name: 'Kiểm tra đề' }))
  await stage.pause(5)
}

export async function recordExtensions(stage: DemoStage) {
  const { site } = stage
  await stage.openSitePath('/all-solutions')
  await stage.narrate('allSolutionsOpen')
  await stage.showCaption(captionText('allSolutionsRun'))
  await stage.selectOption(site.getByLabel('Đề', { exact: true }), String(SAMPLE_IDS.multipleSolutions))
  await stage.click(site.getByRole('button', { name: 'Tìm hết' }))
  await expect(site.locator('body')).toContainText('Đã thử hết mọi khả năng', { timeout: LONG_WAIT_MILLISECONDS })
  await stage.pause(1)
  await stage.showCaption(captionText('allSolutionsGallery'))
  await site.getByRole('heading', { name: 'Các lời giải đã tìm' }).scrollIntoViewIfNeeded()
  await stage.pause(5)
  await stage.openSitePath('/compare')
  await stage.narrate('compareOpen')
  await stage.showCaption(captionText('compareRace'))
  await site.locator('.solver-race .speed-slider__input').fill(RACE_SLIDER_POSITION)
  await stage.click(site.locator('.solver-race').getByRole('button', { name: 'Chạy' }))
  await site.locator('.solver-race__lanes').evaluate(element => element.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  await site.locator('.solver-race__summary').waitFor({ timeout: LONG_WAIT_MILLISECONDS })
  const summary = await site.locator('.solver-race__summary').innerText()
  await stage.showCaption(summary)
  await stage.pause(Math.max(4, summary.length * 0.07))
  await stage.showCaption(captionText('compareMeasure'))
  const startButton = site.getByRole('button', { name: 'Đo', exact: true })
  await site.locator('.speed-measurement').evaluate(element => element.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  await stage.pause(1)
  await stage.click(startButton)
  await expect(site.locator('body')).toContainText('Đã đo xong 6 cách', { timeout: LONG_WAIT_MILLISECONDS })
  await stage.pause(1)
  await stage.narrate('compareMeasured')
}

export async function recordPhoneLayout(stage: DemoStage) {
  const { site } = stage
  await stage.openSitePath('/solver')
  await stage.narrate('phoneOpen')
  await stage.showCaption(captionText('phoneMenu'))
  await stage.click(site.getByRole('button', { name: 'Menu' }))
  await stage.pause(2.4)
  await stage.page.keyboard.press('Escape')
  await stage.pause(0.6)
  await stage.showCaption(captionText('phonePanels'))
  await site.locator('body').evaluate(() => window.scrollTo({ top: 400, behavior: 'smooth' }))
  await stage.pause(3.4)
}

export function phoneSiteWidth(): number {
  return PHONE_WIDTH
}

export async function recordTerminal(stage: DemoStage) {
  const startedAt = new Date()
  const date = startedAt.toLocaleDateString('vi-VN')
  await stage.showCaption(captionText('terminalTitle', { date }))
  let shown = '$ yarn testcases\n'
  await stage.showTerminal(shown)
  await stage.pause(1.2)
  const savedResults = readFileSync(RESULTS_PATH, 'utf-8')
  const run = spawnSync('yarn', ['testcases'], { cwd: WEBSITE_DIRECTORY, encoding: 'utf-8' })
  writeFileSync(RESULTS_PATH, savedResults)
  if (run.status !== 0) {
    throw new Error(`yarn testcases failed: ${run.stdout}${run.stderr}`)
  }
  const outputLines = run.stdout.split('\n').filter(line => !line.startsWith('Results written'))
  for (const line of outputLines) {
    shown += `${line}\n`
    await stage.showTerminal(shown)
    await stage.pause(TERMINAL_LINE_SECONDS)
  }
  const totalLine = outputLines.find(line => line.startsWith('total'))
  const [, total, passed] = totalLine?.trim().split(/\s+/) ?? []
  await stage.pause(2)
  await stage.showCaption(captionText('terminalDone', { passed: passed ?? '?', total: total ?? '?' }))
  await stage.pause(4)
}
