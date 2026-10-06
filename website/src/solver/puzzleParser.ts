import { CELL_COUNT, EMPTY, SIZE, type Grid } from './sudokuRules.ts'

const NINE_LINE_BLANK_MARK = 'X'
const STRING_BLANK_MARK = '.'
const DIGIT_PATTERN = /^[1-9]$/
const WHITESPACE_PATTERN = /\s/
const WHITESPACE_RUN_PATTERN = /\s+/
const LINE_BREAK_PATTERN = /\r?\n/

export type PuzzleParseError =
  | { kind: 'wrongLineCount'; lineCount: number }
  | { kind: 'wrongCellCountInLine'; lineNumber: number; cellCount: number }
  | { kind: 'invalidCharacterInLine'; lineNumber: number; character: string }
  | { kind: 'wrongStringLength'; length: number }
  | { kind: 'invalidCharacterInString'; position: number; character: string }

export type PuzzleParseResult =
  | { ok: true; grid: Grid }
  | { ok: false; error: PuzzleParseError }

export function parsePuzzle(text: string): PuzzleParseResult {
  const trimmedText = text.trim()
  if (WHITESPACE_PATTERN.test(trimmedText)) {
    return parseNineLineFormat(trimmedText)
  }
  return parseSingleString(trimmedText)
}

function parseNineLineFormat(text: string): PuzzleParseResult {
  const lines = text
    .split(LINE_BREAK_PATTERN)
    .map(line => line.trim())
    .filter(line => line.length > 0)
  if (lines.length !== SIZE) {
    return { ok: false, error: { kind: 'wrongLineCount', lineCount: lines.length } }
  }

  const grid: Grid = []
  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    const lineNumber = lineIndex + 1
    const cellTexts = splitLineIntoCellTexts(lines[lineIndex])
    if (cellTexts.length !== SIZE) {
      return { ok: false, error: { kind: 'wrongCellCountInLine', lineNumber, cellCount: cellTexts.length } }
    }
    for (const cellText of cellTexts) {
      if (cellText === NINE_LINE_BLANK_MARK) {
        grid.push(EMPTY)
      } else if (DIGIT_PATTERN.test(cellText)) {
        grid.push(Number(cellText))
      } else {
        return { ok: false, error: { kind: 'invalidCharacterInLine', lineNumber, character: cellText } }
      }
    }
  }
  return { ok: true, grid }
}

function splitLineIntoCellTexts(line: string): string[] {
  if (WHITESPACE_PATTERN.test(line)) {
    return line.split(WHITESPACE_RUN_PATTERN)
  }
  return [...line]
}

function parseSingleString(text: string): PuzzleParseResult {
  const characters = [...text]
  if (characters.length !== CELL_COUNT) {
    return { ok: false, error: { kind: 'wrongStringLength', length: characters.length } }
  }

  const grid: Grid = []
  for (let characterIndex = 0; characterIndex < characters.length; characterIndex++) {
    const character = characters[characterIndex]
    if (character === STRING_BLANK_MARK) {
      grid.push(EMPTY)
    } else if (DIGIT_PATTERN.test(character)) {
      grid.push(Number(character))
    } else {
      return { ok: false, error: { kind: 'invalidCharacterInString', position: characterIndex + 1, character } }
    }
  }
  return { ok: true, grid }
}

export function gridToString(grid: Grid): string {
  return grid.map(digit => (digit === EMPTY ? STRING_BLANK_MARK : String(digit))).join('')
}
