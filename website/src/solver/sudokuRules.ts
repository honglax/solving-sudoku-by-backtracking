export const BOX_SIZE = 3
export const SIZE = BOX_SIZE * BOX_SIZE
export const CELL_COUNT = SIZE * SIZE
export const EMPTY = 0
export const FIRST_DIGIT = 1
export const LAST_DIGIT = SIZE

export type Grid = number[]

export type CellPosition = {
  row: number
  column: number
}

export type Unit = 'row' | 'column' | 'box'

export const UNITS: Unit[] = ['row', 'column', 'box']

export function cellIndex(cell: CellPosition): number {
  return (cell.row - 1) * SIZE + (cell.column - 1)
}

export function cellPositionAt(index: number): CellPosition {
  return {
    row: Math.floor(index / SIZE) + 1,
    column: (index % SIZE) + 1,
  }
}

export function boxNumber(cell: CellPosition): number {
  const boxRow = Math.floor((cell.row - 1) / BOX_SIZE)
  const boxColumn = Math.floor((cell.column - 1) / BOX_SIZE)
  return boxRow * BOX_SIZE + boxColumn + 1
}

export function unitNumberOf(unit: Unit, cell: CellPosition): number {
  if (unit === 'row') {
    return cell.row
  }
  if (unit === 'column') {
    return cell.column
  }
  return boxNumber(cell)
}

export function cellsInUnit(unit: Unit, unitNumber: number): CellPosition[] {
  const cells: CellPosition[] = []
  for (let offset = 0; offset < SIZE; offset++) {
    if (unit === 'row') {
      cells.push({ row: unitNumber, column: offset + 1 })
    } else if (unit === 'column') {
      cells.push({ row: offset + 1, column: unitNumber })
    } else {
      const firstRowOfBox = Math.floor((unitNumber - 1) / BOX_SIZE) * BOX_SIZE + 1
      const firstColumnOfBox = ((unitNumber - 1) % BOX_SIZE) * BOX_SIZE + 1
      cells.push({
        row: firstRowOfBox + Math.floor(offset / BOX_SIZE),
        column: firstColumnOfBox + (offset % BOX_SIZE),
      })
    }
  }
  return cells
}

export function digitAt(grid: Grid, cell: CellPosition): number {
  return grid[cellIndex(cell)]
}

export function countBlankCells(grid: Grid): number {
  return grid.filter(digit => digit === EMPTY).length
}
