import { useCallback, useMemo, useState } from 'react'
import { gridToString, parsePuzzle } from '../solver/puzzleParser.ts'
import {
  DEFAULT_SAMPLE_PUZZLE_ID,
  findSamplePuzzle,
  SAMPLE_PUZZLES,
  type PuzzleSource,
} from '../solver/samplePuzzles.ts'
import { CELL_COUNT, EMPTY, type Grid } from '../solver/sudokuRules.ts'


type EditorState = {
  source: PuzzleSource
  lockedGivens: Grid
  typedDigits: Grid
}

function createEmptyGrid(): Grid {
  return new Array<number>(CELL_COUNT).fill(EMPTY)
}

function samplePuzzleGrid(sampleId: number): Grid {
  const parseResult = parsePuzzle(findSamplePuzzle(sampleId).puzzle)
  if (!parseResult.ok) {
    throw new Error(`Sample puzzle ${sampleId} does not parse`)
  }
  return parseResult.grid
}

function sourceOfGrid(grid: Grid): PuzzleSource {
  const gridText = gridToString(grid)
  const matchingSample = SAMPLE_PUZZLES.find(sample => sample.puzzle === gridText)
  if (matchingSample === undefined) {
    return { kind: 'custom' }
  }
  return { kind: 'sample', sampleId: matchingSample.id }
}

function createSampleState(sampleId: number): EditorState {
  return {
    source: { kind: 'sample', sampleId },
    lockedGivens: samplePuzzleGrid(sampleId),
    typedDigits: createEmptyGrid(),
  }
}

function createGridState(grid: Grid): EditorState {
  return { source: sourceOfGrid(grid), lockedGivens: [...grid], typedDigits: createEmptyGrid() }
}

function createInitialState(initialPuzzleText: string | null): EditorState {
  if (initialPuzzleText !== null) {
    const parseResult = parsePuzzle(initialPuzzleText)
    if (parseResult.ok) {
      return createGridState(parseResult.grid)
    }
  }
  return createSampleState(DEFAULT_SAMPLE_PUZZLE_ID)
}

export function usePuzzleEditor(initialPuzzleText: string | null) {
  const [editorState, setEditorState] = useState<EditorState>(() => createInitialState(initialPuzzleText))
  const { source, lockedGivens, typedDigits } = editorState

  const puzzle = useMemo(
    () => lockedGivens.map((givenDigit, index) => (givenDigit === EMPTY ? typedDigits[index] : givenDigit)),
    [lockedGivens, typedDigits],
  )

  const selectSample = useCallback((sampleId: number) => {
    setEditorState(createSampleState(sampleId))
  }, [])

  const loadPastedPuzzle = useCallback((grid: Grid) => {
    setEditorState(createGridState(grid))
  }, [])

  const typeDigit = useCallback((index: number, digit: number) => {
    setEditorState(previousState => {
      const isLockedGiven = previousState.lockedGivens[index] !== EMPTY
      const isUnchanged = previousState.typedDigits[index] === digit
      if (isLockedGiven || isUnchanged) {
        return previousState
      }
      const typedDigitsAfterEdit = [...previousState.typedDigits]
      typedDigitsAfterEdit[index] = digit
      return { ...previousState, source: { kind: 'custom' }, typedDigits: typedDigitsAfterEdit }
    })
  }, [])

  return { source, lockedGivens, puzzle, selectSample, loadPastedPuzzle, typeDigit }
}
