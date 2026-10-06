import { formatMessage, messages, puzzleName } from '../i18n/messages.ts'
import { findSamplePuzzle, type PuzzleSource, type SamplePuzzle } from '../solver/samplePuzzles.ts'
import { countBlankCells, type Grid } from '../solver/sudokuRules.ts'

export function countPuzzleTextBlanks(puzzleText: string): number {
  return [...puzzleText].filter(character => character === '.').length
}

export function samplePuzzleLabel(sample: SamplePuzzle): string {
  return formatMessage(messages.puzzles.sampleLabel, {
    id: sample.id,
    name: puzzleName(sample.id),
    blankCount: countPuzzleTextBlanks(sample.puzzle),
  })
}

export function unlistedPuzzleLabel(sample: SamplePuzzle): string {
  return formatMessage(messages.puzzles.unlistedLabel, {
    name: puzzleName(sample.id),
    blankCount: countPuzzleTextBlanks(sample.puzzle),
  })
}

export function customPuzzleLabel(puzzle: Grid): string {
  return formatMessage(messages.puzzles.customLabel, { blankCount: countBlankCells(puzzle) })
}

export function currentPuzzleLabel(source: PuzzleSource, puzzle: Grid): string {
  if (source.kind === 'custom') {
    return customPuzzleLabel(puzzle)
  }
  const sample = findSamplePuzzle(source.sampleId)
  if (sample.isListed) {
    return samplePuzzleLabel(sample)
  }
  return unlistedPuzzleLabel(sample)
}
