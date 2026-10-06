import { describe, expect, it } from 'vitest'
import expectedFewestCandidates from '../../../../checks/expected_fewest_candidates.json'
import expectedCounts from '../../../../checks/expected_counts.json'
import { measureMethod, MINIMUM_MEASURED_MILLISECONDS } from '../../../src/comparison/comparisonMeasurement.ts'
import { solveForComparison, type ComparisonMethod } from '../../../src/comparison/comparisonSolver.ts'
import type { CheckStrategyId } from '../../../src/comparison/usageTrackers.ts'
import { gridToString, parsePuzzle } from '../../../src/solver/puzzleParser.ts'
import { SAMPLE_PUZZLES } from '../../../src/solver/samplePuzzles.ts'
import type { Grid } from '../../../src/solver/sudokuRules.ts'

const CHECK_STRATEGIES: CheckStrategyId[] = ['gridScan', 'usageFlags', 'bitmask']
const FULL_RUN_TRY_LIMIT = 10_000_000

function parseOrFail(puzzleText: string): Grid {
  const parseResult = parsePuzzle(puzzleText)
  if (!parseResult.ok) {
    throw new Error(`Puzzle does not parse: ${puzzleText}`)
  }
  return parseResult.grid
}

function solutionText(solution: Grid | null): string | null {
  return solution === null ? null : gridToString(solution)
}

describe('row-major order: every check strategy walks the same search tree as the Python reference', () => {
  const quickPuzzles = expectedCounts.puzzles.filter(expected => expected.tryCount <= FULL_RUN_TRY_LIMIT)
  for (const checkStrategy of CHECK_STRATEGIES) {
    for (const expected of quickPuzzles) {
      it(`${checkStrategy}, puzzle ${expected.id}: ${expected.tryCount} / ${expected.recordCount} / ${expected.restoreCount}`, () => {
        const run = solveForComparison(parseOrFail(expected.puzzle), { checkStrategy, cellOrder: 'rowMajor' })

        expect(run.counts.tryCount).toBe(expected.tryCount)
        expect(run.counts.recordCount).toBe(expected.recordCount)
        expect(run.counts.restoreCount).toBe(expected.restoreCount)
        expect(run.counts.cellChoiceReadCount).toBe(0)
        expect(solutionText(run.solution)).toBe(expected.solution)
      })
    }
  }
})

describe('fewest-candidates order matches the Python reference', () => {
  for (const expected of expectedFewestCandidates.puzzles) {
    const puzzle = expectedCounts.puzzles.find(candidate => candidate.id === expected.id)
    if (puzzle === undefined) {
      throw new Error(`Puzzle ${expected.id} is missing from expected_counts.json`)
    }
    for (const checkStrategy of CHECK_STRATEGIES) {
      it(`${checkStrategy}, puzzle ${expected.id}: ${expected.tryCount} / ${expected.recordCount} / ${expected.restoreCount}`, () => {
        const run = solveForComparison(parseOrFail(puzzle.puzzle), { checkStrategy, cellOrder: 'fewestCandidates' })

        expect(run.counts.tryCount).toBe(expected.tryCount)
        expect(run.counts.recordCount).toBe(expected.recordCount)
        expect(run.counts.restoreCount).toBe(expected.restoreCount)
        expect(solutionText(run.solution)).toBe(expected.solution)
      })
    }
  }
})

describe('sample puzzle data', () => {
  it('stores the fewest-candidates counts that the Python reference measured', () => {
    const websiteCounts = SAMPLE_PUZZLES.map(sample => ({ id: sample.id, ...sample.measuredWithFewestCandidatesFirst }))
    const pythonCounts = expectedFewestCandidates.puzzles.map(({ id, tryCount, recordCount, restoreCount }) => ({
      id,
      tryCount,
      recordCount,
      restoreCount,
    }))
    expect(websiteCounts).toEqual(pythonCounts)
  })
})

describe('memory reads per check', () => {
  const inkala = expectedCounts.puzzles.find(candidate => candidate.name === 'Arto Inkala')
  if (inkala === undefined) {
    throw new Error('Arto Inkala is missing from expected_counts.json')
  }
  const readsFor = (checkStrategy: CheckStrategyId) =>
    solveForComparison(parseOrFail(inkala.puzzle), { checkStrategy, cellOrder: 'rowMajor' }).counts.checkReadCount

  it('bitmask always reads exactly three masks per try', () => {
    const masksPerCheck = 3
    expect(readsFor('bitmask')).toBe(masksPerCheck * inkala.tryCount)
  })

  it('usage flags read at most three flags per try, and fewer than the grid scan', () => {
    const flagsPerCheck = 3
    const usageFlagReads = readsFor('usageFlags')
    expect(usageFlagReads).toBeLessThanOrEqual(flagsPerCheck * inkala.tryCount)
    expect(usageFlagReads).toBeLessThan(readsFor('gridScan'))
  })
})

describe('try limit', () => {
  it('stops the search once the limit is reached and reports no solution', () => {
    const inkala = expectedCounts.puzzles.find(candidate => candidate.name === 'Arto Inkala')
    if (inkala === undefined) {
      throw new Error('Arto Inkala is missing from expected_counts.json')
    }
    const tryLimit = 1000
    const method: ComparisonMethod = { checkStrategy: 'usageFlags', cellOrder: 'rowMajor' }
    const run = solveForComparison(parseOrFail(inkala.puzzle), method, tryLimit)

    expect(run.isStoppedByTryLimit).toBe(true)
    expect(run.counts.tryCount).toBe(tryLimit)
    expect(run.solution).toBeNull()
  })
})

describe('measureMethod', () => {
  const quickPuzzle = expectedCounts.puzzles.find(candidate => candidate.name === 'Vừa')
  if (quickPuzzle === undefined) {
    throw new Error('Puzzle "Vừa" is missing from expected_counts.json')
  }
  const method: ComparisonMethod = { checkStrategy: 'usageFlags', cellOrder: 'rowMajor' }

  it('repeats a quick solve until the minimum measuring time has passed, then averages', () => {
    const millisecondsPerClockRead = 1
    let clockTime = 0
    const readClock = () => {
      clockTime += millisecondsPerClockRead
      return clockTime
    }
    const measurement = measureMethod(parseOrFail(quickPuzzle.puzzle), method, readClock)

    expect(measurement.runCount).toBeGreaterThan(1)
    expect(measurement.counts.tryCount).toBe(quickPuzzle.tryCount)
    expect(measurement.millisecondsPerRun * measurement.runCount).toBeGreaterThanOrEqual(MINIMUM_MEASURED_MILLISECONDS)
  })

  it('keeps a single run when the first solve is already slow enough', () => {
    let clockTime = 0
    const readClock = () => {
      clockTime += MINIMUM_MEASURED_MILLISECONDS
      return clockTime
    }
    const measurement = measureMethod(parseOrFail(quickPuzzle.puzzle), method, readClock)

    expect(measurement.runCount).toBe(1)
    expect(measurement.millisecondsPerRun).toBe(MINIMUM_MEASURED_MILLISECONDS)
  })
})
