import {
  cellsInUnit,
  countBlankCells,
  digitAt,
  EMPTY,
  SIZE,
  UNITS,
  type CellPosition,
  type Grid,
  type Unit,
} from './sudokuRules.ts'

export type DuplicateDigit = {
  digit: number
  unit: Unit
  unitNumber: number
  cells: CellPosition[]
}

export type PuzzleStatus =
  | { kind: 'invalid'; duplicates: DuplicateDigit[] }
  | { kind: 'complete' }
  | { kind: 'ready'; blankCount: number }

export function findDuplicateDigits(grid: Grid): DuplicateDigit[] {
  const duplicates: DuplicateDigit[] = []
  for (const unit of UNITS) {
    for (let unitNumber = 1; unitNumber <= SIZE; unitNumber++) {
      const cellsByDigit = new Map<number, CellPosition[]>()
      for (const cell of cellsInUnit(unit, unitNumber)) {
        const digit = digitAt(grid, cell)
        if (digit === EMPTY) {
          continue
        }
        const cellsWithThisDigit = cellsByDigit.get(digit) ?? []
        cellsWithThisDigit.push(cell)
        cellsByDigit.set(digit, cellsWithThisDigit)
      }
      for (const [digit, cells] of cellsByDigit) {
        if (cells.length > 1) {
          duplicates.push({ digit, unit, unitNumber, cells })
        }
      }
    }
  }
  return duplicates
}

export function analyzePuzzle(grid: Grid): PuzzleStatus {
  const duplicates = findDuplicateDigits(grid)
  if (duplicates.length > 0) {
    return { kind: 'invalid', duplicates }
  }
  const blankCount = countBlankCells(grid)
  if (blankCount === 0) {
    return { kind: 'complete' }
  }
  return { kind: 'ready', blankCount }
}
