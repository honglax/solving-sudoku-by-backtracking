import type { SolverEvent } from './solverEvents.ts'
import { cellIndex, countBlankCells, EMPTY, type Grid } from './sudokuRules.ts'

export type SolverProgress = {
  grid: Grid
  solutionVector: number[]
  blankCount: number
  currentIndex: number
  tryCount: number
  recordCount: number
  restoreCount: number
  lastEvent: SolverEvent | null
  lastPseudocodeEvent: SolverEvent | null
  lastMessageEvent: SolverEvent | null
  isFinished: boolean
}

export function createSolverProgress(puzzle: Grid): SolverProgress {
  const blankCount = countBlankCells(puzzle)
  return {
    grid: [...puzzle],
    solutionVector: new Array<number>(blankCount + 1).fill(EMPTY),
    blankCount,
    currentIndex: 0,
    tryCount: 0,
    recordCount: 0,
    restoreCount: 0,
    lastEvent: null,
    lastPseudocodeEvent: null,
    lastMessageEvent: null,
    isFinished: false,
  }
}

export function applySolverEvent(progress: SolverProgress, event: SolverEvent): void {
  switch (event.kind) {
    case 'acceptCandidate':
    case 'rejectCandidate':
      progress.tryCount += 1
      progress.currentIndex = event.index
      progress.lastMessageEvent = event
      progress.lastPseudocodeEvent = event
      break
    case 'recordState':
      progress.grid[cellIndex(event.cell)] = event.digit
      progress.solutionVector[event.index] = event.digit
      progress.recordCount += 1
      progress.lastPseudocodeEvent = event
      break
    case 'descend':
      progress.currentIndex = event.toIndex
      progress.lastPseudocodeEvent = event
      break
    case 'restoreState':
      progress.grid[cellIndex(event.cell)] = EMPTY
      progress.solutionVector[event.index] = EMPTY
      progress.restoreCount += 1
      progress.currentIndex = event.index
      progress.lastMessageEvent = event
      progress.lastPseudocodeEvent = event
      break
    case 'solutionFound':
      progress.isFinished = true
      progress.lastMessageEvent = event
      progress.lastPseudocodeEvent = event
      break
    case 'noSolution':
      progress.isFinished = true
      progress.lastMessageEvent = event
      break
  }
  progress.lastEvent = event
}

export function copySolverProgress(progress: SolverProgress): SolverProgress {
  return {
    ...progress,
    grid: [...progress.grid],
    solutionVector: [...progress.solutionVector],
  }
}

export function isVisibleStep(event: SolverEvent): boolean {
  return event.kind !== 'recordState' && event.kind !== 'descend'
}
