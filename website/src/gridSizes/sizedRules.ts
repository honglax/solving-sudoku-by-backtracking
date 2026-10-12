import type { CellPosition, Unit } from '../solver/sudokuRules.ts'

export const DIGIT_CHARACTERS = '123456789ABCDEFG'
export const EMPTY_MARK = '.'
export const ZERO_MARK = '0'
export const SMALLEST_BOX_SIZE = 2
export const LARGEST_BOX_SIZE = 4

export type GridShape = {
  boxSize: number
  size: number
  cellCount: number
}

export type SizedGrid = number[]

export const EMPTY = 0

export function shapeOf(boxSize: number): GridShape {
  const size = boxSize * boxSize
  return { boxSize, size, cellCount: size * size }
}

export function digitCharacter(digit: number): string {
  return digit === EMPTY ? EMPTY_MARK : DIGIT_CHARACTERS[digit - 1]
}

export function cellIndexOf(shape: GridShape, cell: CellPosition): number {
  return (cell.row - 1) * shape.size + (cell.column - 1)
}

export function cellPositionOf(shape: GridShape, index: number): CellPosition {
  return { row: Math.floor(index / shape.size) + 1, column: (index % shape.size) + 1 }
}

export function boxNumberOf(shape: GridShape, cell: CellPosition): number {
  return Math.floor((cell.row - 1) / shape.boxSize) * shape.boxSize + Math.floor((cell.column - 1) / shape.boxSize) + 1
}

export function unitNumberOf(shape: GridShape, unit: Unit, cell: CellPosition): number {
  if (unit === 'row') {
    return cell.row
  }
  if (unit === 'column') {
    return cell.column
  }
  return boxNumberOf(shape, cell)
}

export function cellsInUnit(shape: GridShape, unit: Unit, unitNumber: number): CellPosition[] {
  const cells: CellPosition[] = []
  for (let offset = 1; offset <= shape.size; offset++) {
    if (unit === 'row') {
      cells.push({ row: unitNumber, column: offset })
    } else if (unit === 'column') {
      cells.push({ row: offset, column: unitNumber })
    } else {
      const firstRow = Math.floor((unitNumber - 1) / shape.boxSize) * shape.boxSize + 1
      const firstColumn = ((unitNumber - 1) % shape.boxSize) * shape.boxSize + 1
      cells.push({
        row: firstRow + Math.floor((offset - 1) / shape.boxSize),
        column: firstColumn + ((offset - 1) % shape.boxSize),
      })
    }
  }
  return cells
}

export function countBlankCells(grid: SizedGrid): number {
  return grid.filter(digit => digit === EMPTY).length
}
