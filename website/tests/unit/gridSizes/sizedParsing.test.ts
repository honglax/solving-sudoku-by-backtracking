import { describe, expect, it } from 'vitest'
import { parseSizedPuzzle, sizedGridToString } from '../../../src/gridSizes/sizedPuzzleParser.ts'
import { shapeOf } from '../../../src/gridSizes/sizedRules.ts'
import { findFirstDuplicate } from '../../../src/gridSizes/sizedValidator.ts'

const FOUR = shapeOf(2)
const SIXTEEN = shapeOf(4)

describe('sized puzzle parser', () => {
  it('reads digits, dots and zeros and ignores whitespace', () => {
    const result = parseSizedPuzzle('1 2 . 4\n0 0 0 0\n.. 12\n3 4 1 2', FOUR)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(sizedGridToString(result.grid)).toBe('12.4....' + '..123412')
    }
  })

  it('reads the letters A to G as 10 to 16 on a 16x16 grid, in either case', () => {
    const text = 'aG'.padEnd(256, '.')
    const result = parseSizedPuzzle(text, SIXTEEN)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.grid[0]).toBe(10)
      expect(result.grid[1]).toBe(16)
    }
  })

  it('reports a wrong length', () => {
    expect(parseSizedPuzzle('1234', FOUR)).toEqual({ ok: false, error: { kind: 'wrongLength', length: 4 } })
  })

  it('reports a digit that does not exist on a smaller grid, with its position', () => {
    const result = parseSizedPuzzle('5' + '.'.repeat(15), FOUR)
    expect(result).toEqual({ ok: false, error: { kind: 'invalidCharacter', position: 1, character: '5' } })
  })
})

describe('sized duplicate finder', () => {
  it('finds nothing in a valid grid', () => {
    const result = parseSizedPuzzle('1234341221434321', FOUR)
    if (!result.ok) {
      throw new Error('Valid grid does not parse')
    }
    expect(findFirstDuplicate(FOUR, result.grid)).toBeNull()
  })

  it('reports the row first, then the column, then the box', () => {
    const rowResult = parseSizedPuzzle('11..' + '.'.repeat(12), FOUR)
    const columnResult = parseSizedPuzzle('1...1...' + '.'.repeat(8), FOUR)
    const boxResult = parseSizedPuzzle('1...' + '.1..' + '.'.repeat(8), FOUR)
    if (!rowResult.ok || !columnResult.ok || !boxResult.ok) {
      throw new Error('Puzzles do not parse')
    }
    expect(findFirstDuplicate(FOUR, rowResult.grid)).toMatchObject({ unit: 'row', unitNumber: 1, digit: 1 })
    expect(findFirstDuplicate(FOUR, columnResult.grid)).toMatchObject({ unit: 'column', unitNumber: 1, digit: 1 })
    expect(findFirstDuplicate(FOUR, boxResult.grid)).toMatchObject({ unit: 'box', unitNumber: 1, digit: 1 })
  })
})
