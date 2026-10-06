import { boxNumber, CELL_COUNT, cellPositionAt, EMPTY, FIRST_DIGIT, LAST_DIGIT, type Grid } from '../solver/sudokuRules.ts'

export type CandidateCount = number | null

function digitsUsedAround(grid: Grid, index: number): Set<number> {
  const cell = cellPositionAt(index)
  const usedDigits = new Set<number>()
  for (let otherIndex = 0; otherIndex < CELL_COUNT; otherIndex++) {
    const otherCell = cellPositionAt(otherIndex)
    const sharesUnit =
      otherCell.row === cell.row || otherCell.column === cell.column || boxNumber(otherCell) === boxNumber(cell)
    if (sharesUnit && grid[otherIndex] !== EMPTY) {
      usedDigits.add(grid[otherIndex])
    }
  }
  return usedDigits
}

export function countCandidatesOfEmptyCells(grid: Grid): CandidateCount[] {
  const allDigitCount = LAST_DIGIT - FIRST_DIGIT + 1
  return Array.from({ length: CELL_COUNT }, (_, index) => {
    if (grid[index] !== EMPTY) {
      return null
    }
    return allDigitCount - digitsUsedAround(grid, index).size
  })
}
