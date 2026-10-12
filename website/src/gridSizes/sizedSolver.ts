import type { SolverEvent } from '../solver/solverEvents.ts'
import type { CellPosition, Unit } from '../solver/sudokuRules.ts'
import { boxNumberOf, cellPositionOf, cellsInUnit, EMPTY, type GridShape, type SizedGrid } from './sizedRules.ts'

const FIRST_DIGIT = 1

export function* solveSizedBacktracking(shape: GridShape, puzzle: SizedGrid): Generator<SolverEvent, void, undefined> {
  const k = shape.size
  const grid = [...puzzle]
  const rowUsed = Array.from({ length: k + 1 }, () => new Array<boolean>(k + 1).fill(false))
  const columnUsed = Array.from({ length: k + 1 }, () => new Array<boolean>(k + 1).fill(false))
  const boxUsed = Array.from({ length: k + 1 }, () => new Array<boolean>(k + 1).fill(false))
  const emptyCells: CellPosition[] = [{ row: 0, column: 0 }]

  grid.forEach((digit, index) => {
    const cell = cellPositionOf(shape, index)
    if (digit === EMPTY) {
      emptyCells.push(cell)
    } else {
      rowUsed[cell.row][digit] = true
      columnUsed[cell.column][digit] = true
      boxUsed[boxNumberOf(shape, cell)][digit] = true
    }
  })

  const n = emptyCells.length - 1

  function findConflictingUnit(cell: CellPosition, j: number): Unit | null {
    if (rowUsed[cell.row][j]) {
      return 'row'
    }
    if (columnUsed[cell.column][j]) {
      return 'column'
    }
    if (boxUsed[boxNumberOf(shape, cell)][j]) {
      return 'box'
    }
    return null
  }

  function findCellHoldingDigit(unit: Unit, cell: CellPosition, j: number): CellPosition {
    const unitNumber = unit === 'row' ? cell.row : unit === 'column' ? cell.column : boxNumberOf(shape, cell)
    const holdingCell = cellsInUnit(shape, unit, unitNumber).find(candidate => grid[(candidate.row - 1) * k + (candidate.column - 1)] === j)
    if (holdingCell === undefined) {
      throw new Error(`Digit ${j} is marked as used in ${unit} but no cell holds it`)
    }
    return holdingCell
  }

  function recordState(cell: CellPosition, j: number) {
    grid[(cell.row - 1) * k + (cell.column - 1)] = j
    rowUsed[cell.row][j] = true
    columnUsed[cell.column][j] = true
    boxUsed[boxNumberOf(shape, cell)][j] = true
  }

  function restoreState(cell: CellPosition, j: number) {
    grid[(cell.row - 1) * k + (cell.column - 1)] = EMPTY
    rowUsed[cell.row][j] = false
    columnUsed[cell.column][j] = false
    boxUsed[boxNumberOf(shape, cell)][j] = false
  }

  function* tryStep(i: number): Generator<SolverEvent, boolean, undefined> {
    const cell = emptyCells[i]
    for (let j = FIRST_DIGIT; j <= k; j++) {
      const conflictingUnit = findConflictingUnit(cell, j)
      if (conflictingUnit === null) {
        yield { kind: 'acceptCandidate', index: i, cell, digit: j }
        recordState(cell, j)
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
