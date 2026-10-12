import type { CellPosition, Unit } from '../solver/sudokuRules.ts'
import { cellsInUnit, EMPTY, type GridShape, type SizedGrid } from './sizedRules.ts'

export type SizedDuplicate = {
  unit: Unit
  unitNumber: number
  digit: number
  cells: CellPosition[]
}

const UNITS_IN_CHECK_ORDER: Unit[] = ['row', 'column', 'box']

export function findFirstDuplicate(shape: GridShape, grid: SizedGrid): SizedDuplicate | null {
  for (const unit of UNITS_IN_CHECK_ORDER) {
    for (let unitNumber = 1; unitNumber <= shape.size; unitNumber++) {
      const cellsByDigit = new Map<number, CellPosition[]>()
      for (const cell of cellsInUnit(shape, unit, unitNumber)) {
        const digit = grid[(cell.row - 1) * shape.size + (cell.column - 1)]
        if (digit !== EMPTY) {
          cellsByDigit.set(digit, [...(cellsByDigit.get(digit) ?? []), cell])
        }
      }
      for (const [digit, cells] of cellsByDigit) {
        if (cells.length > 1) {
          return { unit, unitNumber, digit, cells }
        }
      }
    }
  }
  return null
}
