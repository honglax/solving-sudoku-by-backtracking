import { describe, expect, it } from 'vitest'
import { puzzleName } from '../../../src/i18n/messages.ts'
import expectedCounts from '../../../../checks/expected_counts.json'
import expectedFewestCandidates from '../../../../checks/expected_fewest_candidates.json'
import { solveByBacktracking } from '../../../src/solver/backtrackingSolver.ts'
import { gridToString, parsePuzzle } from '../../../src/solver/puzzleParser.ts'
import { findDuplicateDigits } from '../../../src/solver/puzzleValidator.ts'
import { findSamplePuzzle, SAMPLE_PUZZLES } from '../../../src/solver/samplePuzzles.ts'
import { applySolverEvent, createSolverProgress, type SolverProgress } from '../../../src/solver/solverProgress.ts'
import { cellsInUnit, digitAt, UNITS, unitNumberOf, type CellPosition, type Grid, type Unit } from '../../../src/solver/sudokuRules.ts'

function parseOrFail(puzzleText: string): Grid {
  const parseResult = parsePuzzle(puzzleText)
  if (!parseResult.ok) {
    throw new Error(`Sample puzzle does not parse: ${JSON.stringify(parseResult.error)}`)
  }
  return parseResult.grid
}

function solveToEnd(puzzleText: string): SolverProgress {
  const puzzle = parseOrFail(puzzleText)
  const progress = createSolverProgress(puzzle)
  for (const event of solveByBacktracking(puzzle)) {
    applySolverEvent(progress, event)
  }
  return progress
}

function progressAtTry(puzzleText: string, tryNumber: number): SolverProgress {
  const puzzle = parseOrFail(puzzleText)
  const progress = createSolverProgress(puzzle)
  for (const event of solveByBacktracking(puzzle)) {
    applySolverEvent(progress, event)
    if (progress.tryCount === tryNumber) {
      return progress
    }
  }
  throw new Error(`The solver finished before try ${tryNumber}`)
}

describe('sample puzzles', () => {
  it('are the same puzzles, names and counts that the Python baseline measured', () => {
    const pythonPuzzles = expectedCounts.puzzles.map(({ id, name, puzzle, tryCount, recordCount, restoreCount }) => ({
      id,
      name,
      puzzle,
      measured: { tryCount, recordCount, restoreCount },
    }))
    const websitePuzzles = SAMPLE_PUZZLES.map(({ id, puzzle, measured }) => ({ id, name: puzzleName(id), puzzle, measured }))
    expect(websitePuzzles).toEqual(pythonPuzzles)
  })
})

const FULL_RUN_TRY_LIMIT = 10_000_000

describe('solveByBacktracking matches the Python reference counts', () => {
  const puzzlesQuickEnoughToSolveFully = expectedCounts.puzzles.filter(expected => expected.tryCount <= FULL_RUN_TRY_LIMIT)
  for (const expected of puzzlesQuickEnoughToSolveFully) {
    it(`Đề ${expected.id} - ${expected.name}: ${expected.tryCount} / ${expected.recordCount} / ${expected.restoreCount}`, () => {
      const progress = solveToEnd(expected.puzzle)

      expect(progress.blankCount).toBe(expected.blankCount)
      expect(progress.tryCount).toBe(expected.tryCount)
      expect(progress.recordCount).toBe(expected.recordCount)
      expect(progress.restoreCount).toBe(expected.restoreCount)
      expect(progress.isFinished).toBe(true)

      if (expected.solution === null) {
        expect(progress.lastEvent?.kind).toBe('noSolution')
      } else {
        expect(progress.lastEvent?.kind).toBe('solutionFound')
        expect(gridToString(progress.grid)).toBe(expected.solution)
        expect(findDuplicateDigits(progress.grid)).toEqual([])
      }
    })
  }
})

describe('solveByBacktracking matches the mid-run states drawn in the design', () => {
  for (const snapshot of expectedCounts.snapshots) {
    const puzzle = expectedCounts.puzzles.find(candidate => candidate.id === snapshot.puzzleId)
    if (puzzle === undefined) {
      throw new Error(`Snapshot refers to unknown puzzle ${snapshot.puzzleId}`)
    }

    it(`Đề ${snapshot.puzzleId} at try ${snapshot.tryNumber}`, () => {
      const progress = progressAtTry(puzzle.puzzle, snapshot.tryNumber)
      const solutionVectorBeforeCurrent = progress.solutionVector.slice(1, progress.currentIndex)

      expect(progress.recordCount).toBe(snapshot.recordCount)
      expect(progress.restoreCount).toBe(snapshot.restoreCount)
      expect(progress.currentIndex).toBe(snapshot.currentIndex)
      expect(solutionVectorBeforeCurrent).toEqual(snapshot.solutionVectorBeforeCurrent)
      expect(gridToString(progress.grid)).toBe(snapshot.grid)

      const event = progress.lastEvent
      if (snapshot.accepted) {
        expect(event).toMatchObject({
          kind: 'acceptCandidate',
          cell: { row: snapshot.currentRow, column: snapshot.currentColumn },
          digit: snapshot.digit,
        })
      } else {
        expect(event).toMatchObject({
          kind: 'rejectCandidate',
          cell: { row: snapshot.currentRow, column: snapshot.currentColumn },
          digit: snapshot.digit,
          conflictingUnit: snapshot.conflictingUnit,
        })
      }
    })
  }
})

describe('rejectCandidate points at the cell that causes the conflict', () => {
  it('frame 04: 2 at (4, 7) is rejected because of the given 2 at (4, 8)', () => {
    const progress = progressAtTry(findSamplePuzzle(3).puzzle, 814)

    expect(progress.lastEvent).toEqual({
      kind: 'rejectCandidate',
      index: 16,
      cell: { row: 4, column: 7 },
      digit: 2,
      conflictingUnit: 'row',
      conflictingCell: { row: 4, column: 8 },
    })
  })
})

describe('rejectCandidate reports the first broken rule in the order row, column, box', () => {
  function unitsHoldingDigit(grid: Grid, cell: CellPosition, digit: number): Unit[] {
    return UNITS.filter(unit =>
      cellsInUnit(unit, unitNumberOf(unit, cell)).some(cellOfUnit => digitAt(grid, cellOfUnit) === digit),
    )
  }

  it('holds for every rejection while solving Đề 3', () => {
    const puzzle = parseOrFail(findSamplePuzzle(3).puzzle)
    const progress = createSolverProgress(puzzle)
    let rejectionCount = 0
    let rejectionsBrokenInSeveralUnits = 0

    for (const event of solveByBacktracking(puzzle)) {
      if (event.kind === 'rejectCandidate') {
        const brokenUnits = unitsHoldingDigit(progress.grid, event.cell, event.digit)
        expect(event.conflictingUnit).toBe(brokenUnits[0])
        expect(digitAt(progress.grid, event.conflictingCell)).toBe(event.digit)
        rejectionCount += 1
        if (brokenUnits.length > 1) {
          rejectionsBrokenInSeveralUnits += 1
        }
      }
      applySolverEvent(progress, event)
    }

    expect(rejectionCount).toBe(1909 - 227)
    expect(rejectionsBrokenInSeveralUnits).toBeGreaterThan(0)
  })
})

describe('solveByBacktracking on a complete grid', () => {
  it('reports the solution without trying any digit', () => {
    const solvedVuaPuzzle = expectedCounts.puzzles.find(puzzle => puzzle.id === 3)?.solution
    if (solvedVuaPuzzle === undefined || solvedVuaPuzzle === null) {
      throw new Error('Missing solution for Vừa')
    }
    const progress = solveToEnd(solvedVuaPuzzle)

    expect(progress.tryCount).toBe(0)
    expect(progress.lastEvent?.kind).toBe('solutionFound')
  })
})

describe('solveByBacktracking with the fewest-candidates order matches the Python reference', () => {
  for (const expected of expectedFewestCandidates.puzzles) {
    const sample = findSamplePuzzle(expected.id)
    it(`puzzle ${expected.id}: ${expected.tryCount} / ${expected.recordCount} / ${expected.restoreCount}`, () => {
      const puzzle = parseOrFail(sample.puzzle)
      const progress = createSolverProgress(puzzle)
      for (const event of solveByBacktracking(puzzle, { cellOrder: 'fewestCandidates' })) {
        applySolverEvent(progress, event)
      }

      expect(progress.tryCount).toBe(expected.tryCount)
      expect(progress.recordCount).toBe(expected.recordCount)
      expect(progress.restoreCount).toBe(expected.restoreCount)
      if (expected.solution === null) {
        expect(progress.lastEvent?.kind).toBe('noSolution')
      } else {
        expect(gridToString(progress.grid)).toBe(expected.solution)
      }
    })
  }
})
