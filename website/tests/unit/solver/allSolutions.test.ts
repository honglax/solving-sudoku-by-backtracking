import { describe, expect, it } from 'vitest'
import expectedAllSolutions from '../../../../checks/expected_all_solutions.json'
import { readCaseFiles, readManifest } from '../../../../testcases/tools/testcaseRunner.ts'
import { solveByBacktracking } from '../../../src/solver/backtrackingSolver.ts'
import { gridToString, parsePuzzle } from '../../../src/solver/puzzleParser.ts'
import { analyzePuzzle } from '../../../src/solver/puzzleValidator.ts'
import { findSamplePuzzle, SAMPLE_PUZZLES } from '../../../src/solver/samplePuzzles.ts'
import { applySolverEvent, createSolverProgress, type SolverProgress } from '../../../src/solver/solverProgress.ts'
import type { Grid } from '../../../src/solver/sudokuRules.ts'

const QUICK_FULL_SEARCH_TRY_LIMIT = 1_000_000
const TESTCASE_TRY_BUDGET = 300_000
const CAPPED_COUNT_SUFFIX = '+'

type FullSearch = {
  progress: SolverProgress
  solutions: string[]
  isComplete: boolean
}

function parseOrFail(puzzleText: string): Grid {
  const parseResult = parsePuzzle(puzzleText)
  if (!parseResult.ok) {
    throw new Error(`Puzzle does not parse: ${puzzleText}`)
  }
  return parseResult.grid
}

function searchAllSolutions(puzzle: Grid, tryBudget: number): FullSearch {
  const progress = createSolverProgress(puzzle)
  const solutions: string[] = []
  for (const event of solveByBacktracking(puzzle, { findsAllSolutions: true })) {
    applySolverEvent(progress, event)
    if (event.kind === 'solutionListed') {
      solutions.push(gridToString(progress.grid))
    }
    if (progress.tryCount > tryBudget) {
      return { progress, solutions, isComplete: false }
    }
  }
  return { progress, solutions, isComplete: true }
}

describe('finding every solution matches the Python reference', () => {
  const quickPuzzles = expectedAllSolutions.puzzles.filter(expected => expected.tryCount <= QUICK_FULL_SEARCH_TRY_LIMIT)
  for (const expected of quickPuzzles) {
    it(`puzzle ${expected.id}: ${expected.solutionCount} solution(s) after ${expected.tryCount} tries`, () => {
      const search = searchAllSolutions(parseOrFail(findSamplePuzzle(expected.id).puzzle), Number.POSITIVE_INFINITY)

      expect(search.progress.solutionCount).toBe(expected.solutionCount)
      expect(search.progress.tryCount).toBe(expected.tryCount)
      expect(search.progress.recordCount).toBe(expected.recordCount)
      expect(search.progress.restoreCount).toBe(expected.restoreCount)
      expect(search.solutions.slice(0, expected.firstSolutions.length)).toEqual(expected.firstSolutions)
      expect(search.progress.lastEvent).toEqual({ kind: 'searchExhausted', solutionCount: expected.solutionCount })
      expect(search.progress.isFinished).toBe(true)
    })
  }

  it('lists a complete grid as its own single solution', () => {
    const solvedGrid = parseOrFail(expectedAllSolutions.puzzles[0].firstSolutions[0])
    const search = searchAllSolutions(solvedGrid, Number.POSITIVE_INFINITY)
    expect(search.solutions).toEqual([gridToString(solvedGrid)])
    expect(search.progress.lastEvent).toEqual({ kind: 'searchExhausted', solutionCount: 1 })
  })
})

describe('finding every solution agrees with the independent solution counter of the testcase suite', () => {
  const countedCases = readManifest().filter(
    entry =>
      (entry.expectedKind === 'solved' || entry.expectedKind === 'noSolution') &&
      !entry.solutionCount.endsWith(CAPPED_COUNT_SUFFIX),
  )
  let completedCaseCount = 0

  for (const entry of countedCases) {
    it(`${entry.id}: ${entry.solutionCount} solution(s)`, () => {
      const parseResult = parsePuzzle(readCaseFiles(entry).input)
      if (!parseResult.ok || analyzePuzzle(parseResult.grid).kind !== 'ready') {
        throw new Error(`${entry.id} should be a puzzle ready to solve`)
      }
      const search = searchAllSolutions(parseResult.grid, TESTCASE_TRY_BUDGET)
      if (!search.isComplete) {
        return
      }
      completedCaseCount++
      expect(search.progress.solutionCount).toBe(Number(entry.solutionCount))
      expect(new Set(search.solutions).size).toBe(search.solutions.length)
    })
  }

  it('finishes the full search on most of these cases', () => {
    const minimumCompletedShare = 0.8
    expect(completedCaseCount).toBeGreaterThanOrEqual(countedCases.length * minimumCompletedShare)
  })
})

describe('sample puzzle data', () => {
  it('stores the full-search counts that the Python reference measured, and null where it was too long', () => {
    const measuredById = new Map(expectedAllSolutions.puzzles.map(expected => [expected.id, expected]))
    for (const sample of SAMPLE_PUZZLES) {
      const expected = measuredById.get(sample.id)
      if (expected === undefined) {
        expect(sample.measuredFullSearch).toBeNull()
      } else {
        const { solutionCount, tryCount, recordCount, restoreCount } = expected
        expect(sample.measuredFullSearch).toEqual({ solutionCount, tryCount, recordCount, restoreCount })
      }
    }
  })
})
