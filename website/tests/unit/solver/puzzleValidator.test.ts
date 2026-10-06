import { describe, expect, it } from 'vitest'
import { parsePuzzle } from '../../../src/solver/puzzleParser.ts'
import { analyzePuzzle } from '../../../src/solver/puzzleValidator.ts'
import { cellIndex, type Grid } from '../../../src/solver/sudokuRules.ts'

const VUA_PUZZLE = '5346..912....9534.19...2.6....761.2...6..37...1.9248....1....842..41.635.4.2.617.'
const VUA_SOLUTION = '534678912672195348198342567859761423426853791713924856961537284287419635345286179'

function parseOrFail(puzzleText: string): Grid {
  const parseResult = parsePuzzle(puzzleText)
  if (!parseResult.ok) {
    throw new Error(`Test puzzle does not parse: ${JSON.stringify(parseResult.error)}`)
  }
  return parseResult.grid
}

describe('analyzePuzzle', () => {
  it('frame 03: Đề 3 is ready with 40 blank cells', () => {
    expect(analyzePuzzle(parseOrFail(VUA_PUZZLE))).toEqual({ kind: 'ready', blankCount: 40 })
  })

  it('frame 07: a 7 typed at (4, 1) duplicates the given 7 at (4, 4) in row 4', () => {
    const grid = parseOrFail(VUA_PUZZLE)
    grid[cellIndex({ row: 4, column: 1 })] = 7

    expect(analyzePuzzle(grid)).toEqual({
      kind: 'invalid',
      duplicates: [
        {
          digit: 7,
          unit: 'row',
          unitNumber: 4,
          cells: [
            { row: 4, column: 1 },
            { row: 4, column: 4 },
          ],
        },
      ],
    })
  })

  it('finds the same duplicate in its row, its column and its box', () => {
    const grid = parseOrFail(VUA_PUZZLE)
    grid[cellIndex({ row: 2, column: 2 })] = 9

    expect(analyzePuzzle(grid)).toEqual({
      kind: 'invalid',
      duplicates: [
        { digit: 9, unit: 'row', unitNumber: 2, cells: [{ row: 2, column: 2 }, { row: 2, column: 5 }] },
        { digit: 9, unit: 'column', unitNumber: 2, cells: [{ row: 2, column: 2 }, { row: 3, column: 2 }] },
        { digit: 9, unit: 'box', unitNumber: 1, cells: [{ row: 2, column: 2 }, { row: 3, column: 2 }] },
      ],
    })
  })

  it('reports a complete, valid grid as complete', () => {
    expect(analyzePuzzle(parseOrFail(VUA_SOLUTION))).toEqual({ kind: 'complete' })
  })

  it('Đề 7 is valid at the start, even though it has no solution', () => {
    const noSolutionPuzzle = '.234567891' + '.'.repeat(71)
    expect(analyzePuzzle(parseOrFail(noSolutionPuzzle))).toEqual({ kind: 'ready', blankCount: 72 })
  })
})
