import { DIGIT_CHARACTERS, EMPTY, EMPTY_MARK, ZERO_MARK, type GridShape, type SizedGrid } from './sizedRules.ts'

export type SizedParseError =
  | { kind: 'wrongLength'; length: number }
  | { kind: 'invalidCharacter'; position: number; character: string }

export type SizedParseResult = { ok: true; grid: SizedGrid } | { ok: false; error: SizedParseError }

export function parseSizedPuzzle(text: string, shape: GridShape): SizedParseResult {
  const characters = [...text.replace(/\s+/g, '').toUpperCase()]
  if (characters.length !== shape.cellCount) {
    return { ok: false, error: { kind: 'wrongLength', length: characters.length } }
  }
  const allowedDigits = DIGIT_CHARACTERS.slice(0, shape.size)
  const grid: SizedGrid = []
  for (let position = 0; position < characters.length; position++) {
    const character = characters[position]
    if (character === EMPTY_MARK || character === ZERO_MARK) {
      grid.push(EMPTY)
    } else if (allowedDigits.includes(character)) {
      grid.push(allowedDigits.indexOf(character) + 1)
    } else {
      return { ok: false, error: { kind: 'invalidCharacter', position: position + 1, character } }
    }
  }
  return { ok: true, grid }
}

export function sizedGridToString(grid: SizedGrid): string {
  return grid.map(digit => (digit === EMPTY ? EMPTY_MARK : DIGIT_CHARACTERS[digit - 1])).join('')
}
