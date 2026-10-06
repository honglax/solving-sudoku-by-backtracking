import { formatMessage, messages } from '../i18n/messages.ts'
import type { PuzzleStatus } from '../solver/puzzleValidator.ts'
import type { SolverProgress } from '../solver/solverProgress.ts'
import { CELL_COUNT, cellIndex, EMPTY, type Grid } from '../solver/sudokuRules.ts'

export type CellState =
  | 'empty'
  | 'given'
  | 'recorded'
  | 'trying'
  | 'rejected'
  | 'restored'
  | 'solved'
  | 'inputError'

export type CellView = {
  digit: number
  state: CellState
  ghostDigit: number
  hasConflictRing: boolean
  isEditable: boolean
}

type GridViewInput = {
  puzzle: Grid
  lockedGivens: Grid
  puzzleStatus: PuzzleStatus
  progress: SolverProgress | null
}

function baseCellView(digit: number, state: CellState, isEditable: boolean): CellView {
  return { digit, state, ghostDigit: EMPTY, hasConflictRing: false, isEditable }
}

export function buildGridView({ puzzle, lockedGivens, puzzleStatus, progress }: GridViewInput): CellView[] {
  if (progress === null) {
    return buildIdleGridView(puzzle, lockedGivens, puzzleStatus)
  }
  return buildRunningGridView(puzzle, progress)
}

function buildIdleGridView(puzzle: Grid, lockedGivens: Grid, puzzleStatus: PuzzleStatus): CellView[] {
  const cellViews: CellView[] = []
  for (let index = 0; index < CELL_COUNT; index++) {
    const isEditable = lockedGivens[index] === EMPTY
    if (puzzle[index] === EMPTY) {
      cellViews.push(baseCellView(EMPTY, 'empty', isEditable))
    } else {
      cellViews.push(baseCellView(puzzle[index], 'given', isEditable))
    }
  }
  if (puzzleStatus.kind === 'invalid') {
    for (const duplicate of puzzleStatus.duplicates) {
      for (const cell of duplicate.cells) {
        cellViews[cellIndex(cell)].state = 'inputError'
      }
    }
  }
  return cellViews
}

function buildRunningGridView(puzzle: Grid, progress: SolverProgress): CellView[] {
  const isSolved = progress.lastEvent?.kind === 'solutionFound' || progress.lastEvent?.kind === 'solutionListed'
  const cellViews: CellView[] = []
  for (let index = 0; index < CELL_COUNT; index++) {
    if (puzzle[index] !== EMPTY) {
      cellViews.push(baseCellView(puzzle[index], 'given', false))
    } else if (progress.grid[index] === EMPTY) {
      cellViews.push(baseCellView(EMPTY, 'empty', false))
    } else if (isSolved) {
      cellViews.push(baseCellView(progress.grid[index], 'solved', false))
    } else {
      cellViews.push(baseCellView(progress.grid[index], 'recorded', false))
    }
  }

  const lastEvent = progress.lastEvent
  if (lastEvent === null) {
    return cellViews
  }
  switch (lastEvent.kind) {
    case 'acceptCandidate': {
      const cellView = cellViews[cellIndex(lastEvent.cell)]
      cellView.digit = lastEvent.digit
      cellView.state = 'trying'
      break
    }
    case 'rejectCandidate': {
      const cellView = cellViews[cellIndex(lastEvent.cell)]
      cellView.digit = lastEvent.digit
      cellView.state = 'rejected'
      cellViews[cellIndex(lastEvent.conflictingCell)].hasConflictRing = true
      break
    }
    case 'restoreState': {
      const cellView = cellViews[cellIndex(lastEvent.cell)]
      cellView.state = 'restored'
      cellView.ghostDigit = lastEvent.digit
      break
    }
    case 'noSolution': {
      const firstBlankIndex = puzzle.indexOf(EMPTY)
      cellViews[firstBlankIndex].hasConflictRing = true
      break
    }
    case 'recordState':
    case 'descend':
    case 'solutionFound':
    case 'solutionListed':
    case 'searchExhausted':
      break
  }
  return cellViews
}

const CELL_STATE_LABELS: Record<Exclude<CellState, 'empty'>, string> = messages.solver.cellStates

export function describeCellState(cellView: CellView): string | undefined {
  if (cellView.state === 'empty') {
    return undefined
  }
  const stateLabel = CELL_STATE_LABELS[cellView.state]
  if (cellView.hasConflictRing) {
    return formatMessage(messages.solver.cellStates.withConflict, { state: stateLabel })
  }
  return stateLabel
}
