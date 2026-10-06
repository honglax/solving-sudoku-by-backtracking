import { describe, expect, it } from 'vitest'
import { solveByBacktracking } from '../../../src/solver/backtrackingSolver.ts'
import { parsePuzzle } from '../../../src/solver/puzzleParser.ts'
import { analyzePuzzle } from '../../../src/solver/puzzleValidator.ts'
import { findSamplePuzzle } from '../../../src/solver/samplePuzzles.ts'
import { applySolverEvent, createSolverProgress, type SolverProgress } from '../../../src/solver/solverProgress.ts'
import { cellIndex, EMPTY, type Grid } from '../../../src/solver/sudokuRules.ts'
import { buildGridView, describeCellState } from '../../../src/solverView/gridView.ts'
import { buildReplayFrames } from '../../../src/solverView/replayFrames.ts'
import { describeHistoryEvent } from '../../../src/solverView/historyView.ts'
import { highlightForEvent } from '../../../src/solverView/pseudocode.ts'
import { buildSolutionVectorView } from '../../../src/solverView/solutionVectorView.ts'
import { buildStatusMessage, parseErrorMessage, type StatusMessage } from '../../../src/solverView/statusMessage.ts'
import { sliderPositionToSpeed, speedToSliderPosition, DEFAULT_TRIES_PER_SECOND } from '../../../src/solverView/speed.ts'

const VUA_PUZZLE_ID = 3
const ARTO_INKALA_PUZZLE_ID = 5
const NO_SOLUTION_AT_FIRST_CELL_PUZZLE_ID = 7

function samplePuzzle(sampleId: number): Grid {
  const parseResult = parsePuzzle(findSamplePuzzle(sampleId).puzzle)
  if (!parseResult.ok) {
    throw new Error(`Sample puzzle ${sampleId} does not parse`)
  }
  return parseResult.grid
}

function runUntil(puzzle: Grid, shouldStop: (progress: SolverProgress) => boolean): SolverProgress {
  const progress = createSolverProgress(puzzle)
  for (const event of solveByBacktracking(puzzle)) {
    applySolverEvent(progress, event)
    if (shouldStop(progress)) {
      return progress
    }
  }
  return progress
}

function messageText(message: StatusMessage): string {
  return message.segments.map(segment => segment.text).join('')
}

function emphasizedText(message: StatusMessage): string[] {
  return message.segments.filter(segment => segment.isEmphasized).map(segment => segment.text)
}

const vuaPuzzle = samplePuzzle(VUA_PUZZLE_ID)
const noSolutionPuzzle = samplePuzzle(NO_SOLUTION_AT_FIRST_CELL_PUZZLE_ID)

describe('frame 03: ready', () => {
  it('shows only givens, empty slots and the ready message', () => {
    const puzzleStatus = analyzePuzzle(vuaPuzzle)
    const cells = buildGridView({ puzzle: vuaPuzzle, lockedGivens: vuaPuzzle, puzzleStatus, progress: null })
    const message = buildStatusMessage({ puzzle: vuaPuzzle, puzzleStatus, progress: null, phase: 'notStarted' })

    expect(cells.filter(cell => cell.state === 'given')).toHaveLength(41)
    expect(cells.filter(cell => cell.state === 'empty')).toHaveLength(40)
    expect(buildSolutionVectorView(40, null).every(slot => slot.state === 'empty')).toBe(true)
    expect(message.tone).toBe('info')
    expect(messageText(message)).toBe('Đề hợp lệ, có 40 ô trống. Bấm Từng bước hoặc Tự động để bắt đầu.')
    expect(emphasizedText(message)).toEqual(['40 ô trống'])
  })
})

describe('frame 04: try 814 rejects 2 at (4, 7)', () => {
  const progress = runUntil(vuaPuzzle, current => current.tryCount === 814)
  const puzzleStatus = analyzePuzzle(vuaPuzzle)

  it('marks the rejected cell and rings the given 2 at (4, 8)', () => {
    const cells = buildGridView({ puzzle: vuaPuzzle, lockedGivens: vuaPuzzle, puzzleStatus, progress })
    expect(cells[cellIndex({ row: 4, column: 7 })]).toMatchObject({ digit: 2, state: 'rejected' })
    expect(cells[cellIndex({ row: 4, column: 8 })]).toMatchObject({ digit: 2, state: 'given', hasConflictRing: true })
    expect(cells[cellIndex({ row: 4, column: 1 })]).toMatchObject({ digit: 9, state: 'recorded' })
  })

  it('shows S₁…S₁₅ recorded and S₁₆ trying 2', () => {
    const slots = buildSolutionVectorView(40, progress)
    expect(slots.slice(0, 15).map(slot => slot.digit)).toEqual([7, 8, 6, 2, 8, 1, 7, 7, 3, 4, 5, 8, 9, 5, 3])
    expect(slots.slice(0, 15).every(slot => slot.state === 'recorded')).toBe(true)
    expect(slots[15]).toEqual({ index: 16, digit: 2, state: 'trying' })
    expect(slots.slice(16).every(slot => slot.state === 'empty')).toBe(true)
  })

  it('highlights the acceptability check with "sai" and explains the rejection', () => {
    expect(highlightForEvent(progress.lastPseudocodeEvent)).toEqual({ lineNumber: 3, checkResult: 'rejected' })
    const message = buildStatusMessage({ puzzle: vuaPuzzle, puzzleStatus, progress, phase: 'running' })
    expect(message.tone).toBe('rejected')
    expect(messageText(message)).toBe('Ô (4, 7) - thử số 2: bị loại vì 2 đã có ở hàng 4.')
    expect(emphasizedText(message)).toEqual(['Ô (4, 7)'])
  })
})

describe('frame 05: right after try 803, digit 8 removed from (4, 1)', () => {
  const progress = runUntil(vuaPuzzle, current => current.restoreCount === 81)
  const puzzleStatus = analyzePuzzle(vuaPuzzle)

  it('is the restore at try 803', () => {
    expect([progress.tryCount, progress.recordCount, progress.restoreCount]).toEqual([803, 93, 81])
  })

  it('shows (4, 1) as just restored with a ghost 8', () => {
    const cells = buildGridView({ puzzle: vuaPuzzle, lockedGivens: vuaPuzzle, puzzleStatus, progress })
    expect(cells[cellIndex({ row: 4, column: 1 })]).toMatchObject({ digit: EMPTY, state: 'restored', ghostDigit: 8 })
    expect(buildSolutionVectorView(40, progress)[12]).toEqual({ index: 13, digit: 8, state: 'restored' })
  })

  it('highlights "Trả lại trạng thái cũ" and announces the next digit', () => {
    expect(highlightForEvent(progress.lastPseudocodeEvent)).toEqual({ lineNumber: 10, checkResult: null })
    const message = buildStatusMessage({ puzzle: vuaPuzzle, puzzleStatus, progress, phase: 'running' })
    expect(message.tone).toBe('restored')
    expect(messageText(message)).toBe('Quay lui: trả lại ô (4, 1) bằng cách xóa số 8. Tiếp theo sẽ thử số 9 ở chính ô này.')
    expect(emphasizedText(message)).toEqual(['ô (4, 1)'])
  })
})

describe('frame 18: try 804 accepts 9 at (4, 1)', () => {
  it('shows the accepted digit and the "đúng" tag', () => {
    const progress = runUntil(vuaPuzzle, current => current.tryCount === 804)
    const puzzleStatus = analyzePuzzle(vuaPuzzle)
    const cells = buildGridView({ puzzle: vuaPuzzle, lockedGivens: vuaPuzzle, puzzleStatus, progress })

    expect(cells[cellIndex({ row: 4, column: 1 })]).toMatchObject({ digit: 9, state: 'trying' })
    expect(highlightForEvent(progress.lastPseudocodeEvent)).toEqual({ lineNumber: 3, checkResult: 'accepted' })
    const message = buildStatusMessage({ puzzle: vuaPuzzle, puzzleStatus, progress, phase: 'running' })
    expect(message.tone).toBe('trying')
    expect(messageText(message)).toBe('Ô (4, 1) - thử số 9: chấp nhận được.')
  })
})

describe('frame 06: solved', () => {
  it('turns the 40 filled cells to solved and reports the totals', () => {
    const progress = runUntil(vuaPuzzle, () => false)
    const puzzleStatus = analyzePuzzle(vuaPuzzle)
    const cells = buildGridView({ puzzle: vuaPuzzle, lockedGivens: vuaPuzzle, puzzleStatus, progress })

    expect(cells.filter(cell => cell.state === 'solved')).toHaveLength(40)
    expect(cells.filter(cell => cell.state === 'given')).toHaveLength(41)
    expect(highlightForEvent(progress.lastPseudocodeEvent)).toEqual({ lineNumber: 9, checkResult: null })
    const message = buildStatusMessage({ puzzle: vuaPuzzle, puzzleStatus, progress, phase: 'running' })
    expect(message.tone).toBe('solved')
    expect(messageText(message)).toBe('Đã giải xong sau 1.909 lần thử và 187 lần trả lại.')
  })
})

describe('frame 07: invalid puzzle', () => {
  const invalidPuzzle = [...vuaPuzzle]
  invalidPuzzle[cellIndex({ row: 4, column: 1 })] = 7
  const puzzleStatus = analyzePuzzle(invalidPuzzle)

  it('marks both 7s in row 4 as input errors and keeps the typed cell editable', () => {
    const cells = buildGridView({ puzzle: invalidPuzzle, lockedGivens: vuaPuzzle, puzzleStatus, progress: null })
    expect(cells[cellIndex({ row: 4, column: 1 })]).toMatchObject({ digit: 7, state: 'inputError', isEditable: true })
    expect(cells[cellIndex({ row: 4, column: 4 })]).toMatchObject({ digit: 7, state: 'inputError', isEditable: false })
  })

  it('names the row and both columns', () => {
    const message = buildStatusMessage({ puzzle: invalidPuzzle, puzzleStatus, progress: null, phase: 'notStarted' })
    expect(message.tone).toBe('error')
    expect(messageText(message)).toBe(
      'Đề không hợp lệ: số 7 xuất hiện 2 lần ở hàng 4 (cột 1 và cột 4). Bạn hãy sửa lại rồi bấm Kiểm tra đề.',
    )
    expect(emphasizedText(message)).toEqual(['hàng 4 (cột 1 và cột 4)'])
  })

  it('uses the agreed wording for a duplicate in a column and in a box', () => {
    const columnPuzzle = [...vuaPuzzle]
    columnPuzzle[cellIndex({ row: 5, column: 1 })] = 5
    const columnMessage = buildStatusMessage({
      puzzle: columnPuzzle,
      puzzleStatus: analyzePuzzle(columnPuzzle),
      progress: null,
      phase: 'notStarted',
    })
    expect(messageText(columnMessage)).toBe(
      'Đề không hợp lệ: số 5 xuất hiện 2 lần ở cột 1 (hàng 1 và hàng 5). Bạn hãy sửa lại rồi bấm Kiểm tra đề.',
    )

    const boxPuzzle = [...vuaPuzzle]
    boxPuzzle[cellIndex({ row: 6, column: 1 })] = 6
    const boxStatus = analyzePuzzle(boxPuzzle)
    const boxMessage = buildStatusMessage({ puzzle: boxPuzzle, puzzleStatus: boxStatus, progress: null, phase: 'notStarted' })
    expect(messageText(boxMessage)).toBe(
      'Đề không hợp lệ: số 6 xuất hiện 2 lần ở khối (hàng 4-6, cột 1-3): ô (5, 3) và ô (6, 1). Bạn hãy sửa lại rồi bấm Kiểm tra đề.',
    )
  })
})

describe('frame 08: no solution', () => {
  it('rings (1, 1), marks S₁ rejected and lists why every digit failed', () => {
    const progress = runUntil(noSolutionPuzzle, () => false)
    const puzzleStatus = analyzePuzzle(noSolutionPuzzle)
    const cells = buildGridView({ puzzle: noSolutionPuzzle, lockedGivens: noSolutionPuzzle, puzzleStatus, progress })

    expect(cells[cellIndex({ row: 1, column: 1 })]).toMatchObject({ digit: EMPTY, state: 'empty', hasConflictRing: true })
    expect(buildSolutionVectorView(72, progress)[0]).toEqual({ index: 1, digit: EMPTY, state: 'rejected' })
    expect(highlightForEvent(progress.lastPseudocodeEvent)).toEqual({ lineNumber: 3, checkResult: 'rejected' })
    const message = buildStatusMessage({ puzzle: noSolutionPuzzle, puzzleStatus, progress, phase: 'running' })
    expect(message.tone).toBe('rejected')
    expect(messageText(message)).toBe(
      'Đề này không có lời giải. Ở ô (1, 1), cả 9 số đều bị loại: số 1 đã có ở cột 1, các số từ 2 đến 9 đã có ở hàng 1.',
    )
  })
})

describe('restore after digit 9', () => {
  it('says the cell has tried every digit', () => {
    const progress = runUntil(vuaPuzzle, current => current.lastEvent?.kind === 'restoreState' && current.lastEvent.digit === 9)
    const message = buildStatusMessage({
      puzzle: vuaPuzzle,
      puzzleStatus: analyzePuzzle(vuaPuzzle),
      progress,
      phase: 'running',
    })
    expect(messageText(message)).toMatch(/^Quay lui: trả lại ô \(\d, \d\) bằng cách xóa số 9\. Ô này đã thử hết các số từ 1 đến 9, nên phải lùi về ô trống trước đó\.$/)
  })
})

describe('frame 17 and the paused state of "Giải ngay"', () => {
  const progress = runUntil(samplePuzzle(ARTO_INKALA_PUZZLE_ID), current => current.tryCount === 200000)
  const puzzle = samplePuzzle(ARTO_INKALA_PUZZLE_ID)
  const puzzleStatus = analyzePuzzle(puzzle)

  it('shows the running count while solving takes long', () => {
    const message = buildStatusMessage({ puzzle, puzzleStatus, progress, phase: 'solvingInstantlyLong' })
    expect(message.tone).toBe('busy')
    expect(messageText(message)).toBe('Đang giải… đã thử 200.000 lần')
  })

  it('tells how to continue after "Dừng"', () => {
    const message = buildStatusMessage({ puzzle, puzzleStatus, progress, phase: 'instantSolvePaused' })
    expect(messageText(message)).toBe('Đã dừng sau 200.000 lần thử. Bấm Giải ngay để chạy tiếp.')
  })
})

describe('paste errors', () => {
  it('frame 16: 8 lines pasted', () => {
    expect(messageText(parseErrorMessage({ kind: 'wrongLineCount', lineCount: 8 }))).toBe(
      'Đề cần có đúng 9 dòng, mỗi dòng 9 ô, nhưng bạn đã dán 8 dòng.',
    )
  })

  it('frame 01: invalid character on line 3', () => {
    expect(messageText(parseErrorMessage({ kind: 'invalidCharacterInLine', lineNumber: 3, character: '0' }))).toBe(
      'Dòng 3 có ký tự không hợp lệ: "0". Mỗi ô chỉ được là một số từ 1 đến 9, hoặc X nếu là ô trống.',
    )
  })

  it('frame 01: 81-character string with 80 characters', () => {
    expect(messageText(parseErrorMessage({ kind: 'wrongStringLength', length: 80 }))).toBe(
      'Chuỗi đề cần có đúng 81 ký tự, nhưng chuỗi bạn dán có 80 ký tự.',
    )
  })
})

describe('speed slider', () => {
  it('starts at 20 tries per second and spans 1 to 1.000', () => {
    expect(sliderPositionToSpeed(speedToSliderPosition(DEFAULT_TRIES_PER_SECOND))).toBe(20)
    expect(sliderPositionToSpeed(0)).toBe(1)
    expect(sliderPositionToSpeed(300)).toBe(1000)
  })
})

describe('the puzzles added on 4/10', () => {
  it('"Vô nghiệm, phải tìm mới biết" uses the general no-solution message after 981 tries', () => {
    const puzzle = samplePuzzle(9)
    const progress = runUntil(puzzle, () => false)
    const message = buildStatusMessage({ puzzle, puzzleStatus: analyzePuzzle(puzzle), progress, phase: 'running' })
    expect(progress.lastEvent?.kind).toBe('noSolution')
    expect(messageText(message)).toBe('Đề này không có lời giải. Sau 981 lần thử, thuật toán đã xét hết mọi cách điền mà không có cách nào hợp lệ.')
  })

  it('"Nhiều lời giải" stops at the first solution it finds', () => {
    const puzzle = samplePuzzle(8)
    const progress = runUntil(puzzle, () => false)
    const message = buildStatusMessage({ puzzle, puzzleStatus: analyzePuzzle(puzzle), progress, phase: 'running' })
    expect(messageText(message)).toBe('Đã giải xong sau 827 lần thử và 65 lần trả lại.')
  })
})

describe('history table rows', () => {
  it('fills every column for each kind of step', () => {
    const progress = runUntil(samplePuzzle(VUA_PUZZLE_ID), current => current.tryCount === 814)
    const rejection = progress.lastEvent
    if (rejection === null) {
      throw new Error('Expected a rejection at try 814')
    }
    expect(describeHistoryEvent(rejection)).toEqual({
      tone: 'rejected',
      cellText: '(4, 7)',
      digitText: '2',
      resultText: 'Bị loại',
      reasonText: 'đã có ở hàng 4',
    })
    expect(describeHistoryEvent({ kind: 'solutionFound' }).resultText).toBe('Có lời giải')
    expect(describeHistoryEvent({ kind: 'noSolution' }).reasonText).toBe('đã thử hết mọi khả năng')
  })
})

describe('changes from the end-user feedback', () => {
  it('pausing at the first backtrack asks the visitor to predict the next step', () => {
    const puzzle = samplePuzzle(VUA_PUZZLE_ID)
    const progress = runUntil(puzzle, current => current.restoreCount === 1)
    const message = buildStatusMessage({
      puzzle,
      puzzleStatus: analyzePuzzle(puzzle),
      progress,
      phase: 'pausedAtFirstBacktrack',
    })
    expect(message.tone).toBe('restored')
    expect(emphasizedText(message)).toEqual(['Lần quay lui đầu tiên!'])
    expect(messageText(message)).toMatch(/^Lần quay lui đầu tiên! Ô \(\d, \d\) vừa bị trả lại số \d, vì với số này không điền tiếp được các ô phía sau\. Bạn đoán bước tiếp theo là gì\? Bấm Từng bước để xem\.$/)
  })

  it('every coloured cell explains its colour on hover', () => {
    const puzzle = samplePuzzle(VUA_PUZZLE_ID)
    const progress = runUntil(puzzle, current => current.tryCount === 814)
    const cells = buildGridView({ puzzle, lockedGivens: puzzle, puzzleStatus: analyzePuzzle(puzzle), progress })
    expect(describeCellState(cells[cellIndex({ row: 4, column: 7 })])).toBe('Bị loại')
    expect(describeCellState(cells[cellIndex({ row: 4, column: 8 })])).toBe('Đề cho · ô gây mâu thuẫn')
    expect(describeCellState(cells[cellIndex({ row: 4, column: 1 })])).toBe('Đã ghi nhận')
    expect(describeCellState(cells[cellIndex({ row: 5, column: 1 })])).toBeUndefined()
  })

  it('the home animation replays tries 783 to 814 of Đề 3 and ends on the frame 04 state', () => {
    const puzzle = samplePuzzle(VUA_PUZZLE_ID)
    const frames = buildReplayFrames(puzzle, 783, 814)
    const finalState = runUntil(puzzle, current => current.tryCount === 814)
    const expectedLastFrame = buildGridView({ puzzle, lockedGivens: puzzle, puzzleStatus: analyzePuzzle(puzzle), progress: finalState })
    expect(frames.length).toBe(814 - 783 + 1 + 6)
    expect(frames[frames.length - 1]).toEqual(expectedLastFrame)
    expect(frames.some(frame => frame.some(cell => cell.state === 'restored'))).toBe(true)
  })
})
