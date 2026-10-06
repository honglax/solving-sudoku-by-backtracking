import type { CellOrder } from '../solver/backtrackingSolver.ts'
import { EMPTY, FIRST_DIGIT, LAST_DIGIT, type Grid } from '../solver/sudokuRules.ts'
import { createUsageTracker, type CheckStrategyId, type UsageTracker } from './usageTrackers.ts'

export type ComparisonMethod = {
  checkStrategy: CheckStrategyId
  cellOrder: CellOrder
}

export type ComparisonCounts = {
  tryCount: number
  recordCount: number
  restoreCount: number
  checkReadCount: number
  cellChoiceReadCount: number
}

export type ComparisonRun = {
  counts: ComparisonCounts
  solution: Grid | null
  isStoppedByTryLimit: boolean
}

class TryLimitReached extends Error {}

function countAcceptableDigits(tracker: UsageTracker, cellIndex: number): number {
  let acceptableCount = 0
  for (let digit = FIRST_DIGIT; digit <= LAST_DIGIT; digit++) {
    if (tracker.isAcceptable(cellIndex, digit)) {
      acceptableCount++
    }
  }
  return acceptableCount
}

function findCellWithFewestCandidates(grid: Grid, emptyCells: number[], tracker: UsageTracker): number {
  let bestCell = -1
  let bestCandidateCount = LAST_DIGIT + 1
  for (const cellIndex of emptyCells) {
    if (grid[cellIndex] !== EMPTY) {
      continue
    }
    const candidateCount = countAcceptableDigits(tracker, cellIndex)
    if (candidateCount < bestCandidateCount) {
      bestCell = cellIndex
      bestCandidateCount = candidateCount
    }
  }
  return bestCell
}

export function solveForComparison(puzzle: Grid, method: ComparisonMethod, tryLimit = Number.POSITIVE_INFINITY): ComparisonRun {
  const grid = [...puzzle]
  const tracker = createUsageTracker(method.checkStrategy, grid)
  const emptyCells = grid.flatMap((digit, cellIndex) => (digit === EMPTY ? [cellIndex] : []))
  const n = emptyCells.length
  const S = new Array<number>(n + 1).fill(EMPTY)
  const counts: ComparisonCounts = { tryCount: 0, recordCount: 0, restoreCount: 0, checkReadCount: 0, cellChoiceReadCount: 0 }

  function chooseCell(i: number): number {
    if (method.cellOrder === 'rowMajor') {
      return emptyCells[i - 1]
    }
    const readCountBeforeChoice = tracker.readCount
    const chosenCell = findCellWithFewestCandidates(grid, emptyCells, tracker)
    counts.cellChoiceReadCount += tracker.readCount - readCountBeforeChoice
    return chosenCell
  }

  function tryStep(i: number): boolean {
    const cellIndex = chooseCell(i)
    for (let j = FIRST_DIGIT; j <= LAST_DIGIT; j++) {
      if (counts.tryCount >= tryLimit) {
        throw new TryLimitReached()
      }
      counts.tryCount++
      if (tracker.isAcceptable(cellIndex, j)) {
        S[i] = j
        grid[cellIndex] = S[i]
        tracker.record(cellIndex, j)
        counts.recordCount++
        if (i < n) {
          if (tryStep(i + 1)) {
            return true
          }
        } else {
          return true
        }
        grid[cellIndex] = EMPTY
        tracker.restore(cellIndex, j)
        S[i] = EMPTY
        counts.restoreCount++
      }
    }
    return false
  }

  function finish(solution: Grid | null, isStoppedByTryLimit: boolean): ComparisonRun {
    counts.checkReadCount = tracker.readCount - counts.cellChoiceReadCount
    return { counts, solution, isStoppedByTryLimit }
  }

  if (n === 0) {
    return finish(grid, false)
  }
  try {
    const solutionFound = tryStep(1)
    return finish(solutionFound ? grid : null, false)
  } catch (error) {
    if (error instanceof TryLimitReached) {
      return finish(null, true)
    }
    throw error
  }
}
