import { BOX_SIZE, CELL_COUNT, EMPTY, LAST_DIGIT, SIZE, type Grid } from '../solver/sudokuRules.ts'

export type CheckStrategyId = 'gridScan' | 'usageFlags' | 'bitmask'

export type UsageTracker = {
  readCount: number
  isAcceptable(cellIndex: number, digit: number): boolean
  record(cellIndex: number, digit: number): void
  restore(cellIndex: number, digit: number): void
}

const ROW_OF_CELL = Array.from({ length: CELL_COUNT }, (_, cellIndex) => Math.floor(cellIndex / SIZE))
const COLUMN_OF_CELL = Array.from({ length: CELL_COUNT }, (_, cellIndex) => cellIndex % SIZE)
const BOX_OF_CELL = Array.from(
  { length: CELL_COUNT },
  (_, cellIndex) => Math.floor(ROW_OF_CELL[cellIndex] / BOX_SIZE) * BOX_SIZE + Math.floor(COLUMN_OF_CELL[cellIndex] / BOX_SIZE),
)

function cellsWhere(belongsToUnit: (cellIndex: number) => boolean): number[] {
  return Array.from({ length: CELL_COUNT }, (_, cellIndex) => cellIndex).filter(belongsToUnit)
}

const CELLS_OF_ROW = Array.from({ length: SIZE }, (_, row) => cellsWhere(cellIndex => ROW_OF_CELL[cellIndex] === row))
const CELLS_OF_COLUMN = Array.from({ length: SIZE }, (_, column) => cellsWhere(cellIndex => COLUMN_OF_CELL[cellIndex] === column))
const MASKS_READ_PER_CHECK = 3

const CELLS_OF_BOX = Array.from({ length: SIZE }, (_, box) => cellsWhere(cellIndex => BOX_OF_CELL[cellIndex] === box))

class GridScanTracker implements UsageTracker {
  readCount = 0
  private readonly grid: Grid

  constructor(grid: Grid) {
    this.grid = grid
  }

  private unitHoldsDigit(unitCells: number[], digit: number): boolean {
    for (const cellIndex of unitCells) {
      this.readCount++
      if (this.grid[cellIndex] === digit) {
        return true
      }
    }
    return false
  }

  isAcceptable(cellIndex: number, digit: number): boolean {
    if (this.unitHoldsDigit(CELLS_OF_ROW[ROW_OF_CELL[cellIndex]], digit)) {
      return false
    }
    if (this.unitHoldsDigit(CELLS_OF_COLUMN[COLUMN_OF_CELL[cellIndex]], digit)) {
      return false
    }
    return !this.unitHoldsDigit(CELLS_OF_BOX[BOX_OF_CELL[cellIndex]], digit)
  }

  record() {
    return
  }

  restore() {
    return
  }
}

function createUsageFlagTable(): boolean[][] {
  return Array.from({ length: SIZE }, () => new Array<boolean>(LAST_DIGIT + 1).fill(false))
}

class UsageFlagsTracker implements UsageTracker {
  readCount = 0
  private readonly rowUsed = createUsageFlagTable()
  private readonly columnUsed = createUsageFlagTable()
  private readonly boxUsed = createUsageFlagTable()

  constructor(grid: Grid) {
    grid.forEach((digit, cellIndex) => {
      if (digit !== EMPTY) {
        this.record(cellIndex, digit)
      }
    })
  }

  isAcceptable(cellIndex: number, digit: number): boolean {
    this.readCount++
    if (this.rowUsed[ROW_OF_CELL[cellIndex]][digit]) {
      return false
    }
    this.readCount++
    if (this.columnUsed[COLUMN_OF_CELL[cellIndex]][digit]) {
      return false
    }
    this.readCount++
    return !this.boxUsed[BOX_OF_CELL[cellIndex]][digit]
  }

  record(cellIndex: number, digit: number) {
    this.setFlags(cellIndex, digit, true)
  }

  restore(cellIndex: number, digit: number) {
    this.setFlags(cellIndex, digit, false)
  }

  private setFlags(cellIndex: number, digit: number, isUsed: boolean) {
    this.rowUsed[ROW_OF_CELL[cellIndex]][digit] = isUsed
    this.columnUsed[COLUMN_OF_CELL[cellIndex]][digit] = isUsed
    this.boxUsed[BOX_OF_CELL[cellIndex]][digit] = isUsed
  }
}

class BitmaskTracker implements UsageTracker {
  readCount = 0
  private readonly rowMask = new Array<number>(SIZE).fill(0)
  private readonly columnMask = new Array<number>(SIZE).fill(0)
  private readonly boxMask = new Array<number>(SIZE).fill(0)

  constructor(grid: Grid) {
    grid.forEach((digit, cellIndex) => {
      if (digit !== EMPTY) {
        this.record(cellIndex, digit)
      }
    })
  }

  isAcceptable(cellIndex: number, digit: number): boolean {
    this.readCount += MASKS_READ_PER_CHECK
    const usedDigits = this.rowMask[ROW_OF_CELL[cellIndex]] | this.columnMask[COLUMN_OF_CELL[cellIndex]] | this.boxMask[BOX_OF_CELL[cellIndex]]
    return (usedDigits & (1 << digit)) === 0
  }

  record(cellIndex: number, digit: number) {
    const digitBit = 1 << digit
    this.rowMask[ROW_OF_CELL[cellIndex]] |= digitBit
    this.columnMask[COLUMN_OF_CELL[cellIndex]] |= digitBit
    this.boxMask[BOX_OF_CELL[cellIndex]] |= digitBit
  }

  restore(cellIndex: number, digit: number) {
    const digitBit = 1 << digit
    this.rowMask[ROW_OF_CELL[cellIndex]] &= ~digitBit
    this.columnMask[COLUMN_OF_CELL[cellIndex]] &= ~digitBit
    this.boxMask[BOX_OF_CELL[cellIndex]] &= ~digitBit
  }
}

export function createUsageTracker(strategy: CheckStrategyId, grid: Grid): UsageTracker {
  if (strategy === 'gridScan') {
    return new GridScanTracker(grid)
  }
  if (strategy === 'usageFlags') {
    return new UsageFlagsTracker(grid)
  }
  return new BitmaskTracker(grid)
}
