import type { SolverEvent } from '../solver/solverEvents.ts'
import { cellIndexOf, countBlankCells, EMPTY, type GridShape, type SizedGrid } from './sizedRules.ts'

export type SizedOutcome = 'running' | 'solved' | 'noSolution'

export type SizedProgress = {
  grid: SizedGrid
  blankCount: number
  tryCount: number
  recordCount: number
  restoreCount: number
  lastEvent: SolverEvent | null
  lastPseudocodeEvent: SolverEvent | null
  lastMessageEvent: SolverEvent | null
  outcome: SizedOutcome
}

export function createSizedProgress(puzzle: SizedGrid): SizedProgress {
  return {
    grid: [...puzzle],
    blankCount: countBlankCells(puzzle),
    tryCount: 0,
    recordCount: 0,
    restoreCount: 0,
    lastEvent: null,
    lastPseudocodeEvent: null,
    lastMessageEvent: null,
    outcome: 'running',
  }
}

export function applySizedEvent(shape: GridShape, progress: SizedProgress, event: SolverEvent): void {
  progress.lastEvent = event
  switch (event.kind) {
    case 'acceptCandidate':
    case 'rejectCandidate':
      progress.tryCount += 1
      progress.lastMessageEvent = event
      progress.lastPseudocodeEvent = event
      break
    case 'recordState':
      progress.grid[cellIndexOf(shape, event.cell)] = event.digit
      progress.recordCount += 1
      progress.lastPseudocodeEvent = event
      break
    case 'descend':
      progress.lastPseudocodeEvent = event
      break
    case 'restoreState':
      progress.grid[cellIndexOf(shape, event.cell)] = EMPTY
      progress.restoreCount += 1
      progress.lastMessageEvent = event
      progress.lastPseudocodeEvent = event
      break
    case 'solutionFound':
      progress.outcome = 'solved'
      progress.lastPseudocodeEvent = event
      break
    case 'noSolution':
      progress.outcome = 'noSolution'
      break
    case 'solutionListed':
    case 'searchExhausted':
      break
  }
}
