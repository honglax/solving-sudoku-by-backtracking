import type { SolverEvent } from './solverEvents.ts'
import {
  boxNumber,
  cellIndex,
  cellPositionAt,
  cellsInUnit,
  digitAt,
  EMPTY,
  FIRST_DIGIT,
  LAST_DIGIT,
  SIZE,
  unitNumberOf,
  type CellPosition,
  type Grid,
  type Unit,
} from './sudokuRules.ts'

const UNUSED_SLOT: CellPosition = { row: 0, column: 0 }

export type CellOrder = 'rowMajor' | 'fewestCandidates'

function createUsageTable(): boolean[][] {
  return Array.from({ length: SIZE + 1 }, () => new Array<boolean>(LAST_DIGIT + 1).fill(false))
}

export function* solveByBacktracking(
  puzzle: Grid,
  cellOrder: CellOrder = 'rowMajor',
): Generator<SolverEvent, void, undefined> {
  const grid = [...puzzle]
  const rowUsed = createUsageTable()
  const columnUsed = createUsageTable()
  const boxUsed = createUsageTable()
  const emptyCells: CellPosition[] = [UNUSED_SLOT]

  grid.forEach((digit, index) => {
    const cell = cellPositionAt(index)
    if (digit === EMPTY) {
      emptyCells.push(cell)
    } else {
      rowUsed[cell.row][digit] = true
      columnUsed[cell.column][digit] = true
      boxUsed[boxNumber(cell)][digit] = true
    }
  })

  const n = emptyCells.length - 1
  const S = new Array<number>(n + 1).fill(EMPTY)

  function findConflictingUnit(cell: CellPosition, j: number): Unit | null {
    if (rowUsed[cell.row][j]) {
      return 'row'
    }
    if (columnUsed[cell.column][j]) {
      return 'column'
    }
    if (boxUsed[boxNumber(cell)][j]) {
      return 'box'
    }
    return null
  }

  function findCellHoldingDigit(unit: Unit, cell: CellPosition, j: number): CellPosition {
    const cellsOfUnit = cellsInUnit(unit, unitNumberOf(unit, cell))
    const holdingCell = cellsOfUnit.find(candidateCell => digitAt(grid, candidateCell) === j)
    if (holdingCell === undefined) {
      throw new Error(`Digit ${j} is marked as used in ${unit} but no cell holds it`)
    }
    return holdingCell
  }

  function countAcceptableDigits(cell: CellPosition): number {
    let acceptableCount = 0
    for (let digit = FIRST_DIGIT; digit <= LAST_DIGIT; digit++) {
      if (findConflictingUnit(cell, digit) === null) {
        acceptableCount++
      }
    }
    return acceptableCount
  }

  function findEmptyCellWithFewestCandidates(): CellPosition {
    let bestCell = UNUSED_SLOT
    let bestCandidateCount = LAST_DIGIT + 1
    for (let i = 1; i <= n; i++) {
      const cell = emptyCells[i]
      if (digitAt(grid, cell) !== EMPTY) {
        continue
      }
      const candidateCount = countAcceptableDigits(cell)
      if (candidateCount < bestCandidateCount) {
        bestCell = cell
        bestCandidateCount = candidateCount
      }
    }
    return bestCell
  }

  function chooseCell(i: number): CellPosition {
    if (cellOrder === 'rowMajor') {
      return emptyCells[i]
    }
    return findEmptyCellWithFewestCandidates()
  }

  function recordState(cell: CellPosition, j: number) {
    grid[cellIndex(cell)] = j
    rowUsed[cell.row][j] = true
    columnUsed[cell.column][j] = true
    boxUsed[boxNumber(cell)][j] = true
  }

  function restoreState(cell: CellPosition, j: number) {
    grid[cellIndex(cell)] = EMPTY
    rowUsed[cell.row][j] = false
    columnUsed[cell.column][j] = false
    boxUsed[boxNumber(cell)][j] = false
  }

  function* tryStep(i: number): Generator<SolverEvent, boolean, undefined> {
    const cell = chooseCell(i)
    for (let j = FIRST_DIGIT; j <= LAST_DIGIT; j++) {
      const conflictingUnit = findConflictingUnit(cell, j)
      const isAcceptable = conflictingUnit === null
      if (isAcceptable) {
        yield { kind: 'acceptCandidate', index: i, cell, digit: j }
        S[i] = j
        recordState(cell, S[i])
        yield { kind: 'recordState', index: i, cell, digit: j }
        if (i < n) {
          yield { kind: 'descend', fromIndex: i, toIndex: i + 1 }
          const solutionFound = yield* tryStep(i + 1)
          if (solutionFound) {
            return true
          }
        } else {
          yield { kind: 'solutionFound' }
          return true
        }
        restoreState(cell, j)
        S[i] = EMPTY
        yield { kind: 'restoreState', index: i, cell, digit: j }
      } else {
        const conflictingCell = findCellHoldingDigit(conflictingUnit, cell, j)
        yield { kind: 'rejectCandidate', index: i, cell, digit: j, conflictingUnit, conflictingCell }
      }
    }
    return false
  }

  if (n === 0) {
    yield { kind: 'solutionFound' }
    return
  }
  const solutionFound = yield* tryStep(1)
  if (!solutionFound) {
    yield { kind: 'noSolution' }
  }
}
