import { describe, expect, it } from 'vitest'
import { gridToString, parsePuzzle } from '../../../src/solver/puzzleParser.ts'

const WIKIPEDIA_PUZZLE_STRING =
  '53..7....6..195....98....6.8...6...34..8.3..17...2...6.6....28....419..5....8..79'

const WIKIPEDIA_PUZZLE_NINE_LINES = [
  '5 3 X X 7 X X X X',
  '6 X X 1 9 5 X X X',
  'X 9 8 X X X X 6 X',
  '8 X X X 6 X X X 3',
  '4 X X 8 X 3 X X 1',
  '7 X X X 2 X X X 6',
  'X 6 X X X X 2 8 X',
  'X X X 4 1 9 X X 5',
  'X X X X 8 X X 7 9',
]

describe('parsePuzzle', () => {
  it('reads the nine-line format: 9 lines, cells separated by spaces, X for a blank', () => {
    const parseResult = parsePuzzle(WIKIPEDIA_PUZZLE_NINE_LINES.join('\n'))
    expect(parseResult.ok).toBe(true)
    if (parseResult.ok) {
      expect(gridToString(parseResult.grid)).toBe(WIKIPEDIA_PUZZLE_STRING)
    }
  })

  it('reads a single 81-character string with . for a blank', () => {
    const parseResult = parsePuzzle(WIKIPEDIA_PUZZLE_STRING)
    expect(parseResult.ok).toBe(true)
    if (parseResult.ok) {
      expect(gridToString(parseResult.grid)).toBe(WIKIPEDIA_PUZZLE_STRING)
    }
  })

  it('accepts Windows line endings, blank lines and surrounding spaces', () => {
    const messyText = `\n  ${WIKIPEDIA_PUZZLE_NINE_LINES.join('  \r\n')}\r\n\n`
    const parseResult = parsePuzzle(messyText)
    expect(parseResult.ok).toBe(true)
  })

  it('accepts the nine lines written without spaces', () => {
    const compactLines = WIKIPEDIA_PUZZLE_NINE_LINES.map(line => line.replaceAll(' ', ''))
    const parseResult = parsePuzzle(compactLines.join('\n'))
    expect(parseResult.ok).toBe(true)
    if (parseResult.ok) {
      expect(gridToString(parseResult.grid)).toBe(WIKIPEDIA_PUZZLE_STRING)
    }
  })

  it('frame 16: reports how many lines were pasted when it is not 9', () => {
    const eightLines = WIKIPEDIA_PUZZLE_NINE_LINES.slice(0, 8).join('\n')
    expect(parsePuzzle(eightLines)).toEqual({ ok: false, error: { kind: 'wrongLineCount', lineCount: 8 } })
  })

  it('reports a line that does not have 9 cells', () => {
    const lines = [...WIKIPEDIA_PUZZLE_NINE_LINES]
    lines[4] = '4 X X 8 X 3 X X'
    expect(parsePuzzle(lines.join('\n'))).toEqual({
      ok: false,
      error: { kind: 'wrongCellCountInLine', lineNumber: 5, cellCount: 8 },
    })
  })

  it('reports the line and character of an invalid cell, such as 0', () => {
    const lines = [...WIKIPEDIA_PUZZLE_NINE_LINES]
    lines[2] = '0 9 8 X X X X 6 X'
    expect(parsePuzzle(lines.join('\n'))).toEqual({
      ok: false,
      error: { kind: 'invalidCharacterInLine', lineNumber: 3, character: '0' },
    })
  })

  it('reports the length of an 81-character string that is too short', () => {
    expect(parsePuzzle(WIKIPEDIA_PUZZLE_STRING.slice(1))).toEqual({
      ok: false,
      error: { kind: 'wrongStringLength', length: 80 },
    })
  })

  it('reports the position of an invalid character in the 81-character string', () => {
    const textWithLetter = `a${WIKIPEDIA_PUZZLE_STRING.slice(1)}`
    expect(parsePuzzle(textWithLetter)).toEqual({
      ok: false,
      error: { kind: 'invalidCharacterInString', position: 1, character: 'a' },
    })
  })

  it('treats empty input as a string of length 0', () => {
    expect(parsePuzzle('   ')).toEqual({ ok: false, error: { kind: 'wrongStringLength', length: 0 } })
  })
})
