import { solveByBacktracking } from '../solver/backtrackingSolver.ts'
import { analyzePuzzle } from '../solver/puzzleValidator.ts'
import { applySolverEvent, createSolverProgress, isVisibleStep } from '../solver/solverProgress.ts'
import type { Grid } from '../solver/sudokuRules.ts'
import { buildGridView, type CellView } from './gridView.ts'

export function buildReplayFrames(puzzle: Grid, firstTryNumber: number, lastTryNumber: number): CellView[][] {
  const puzzleStatus = analyzePuzzle(puzzle)
  const progress = createSolverProgress(puzzle)
  const frames: CellView[][] = []
  for (const event of solveByBacktracking(puzzle)) {
    applySolverEvent(progress, event)
    if (!isVisibleStep(event) || progress.tryCount < firstTryNumber) {
      continue
    }
    frames.push(buildGridView({ puzzle, lockedGivens: puzzle, puzzleStatus, progress }))
    const isLastTry = event.kind === 'acceptCandidate' || event.kind === 'rejectCandidate'
    if (isLastTry && progress.tryCount === lastTryNumber) {
      break
    }
  }
  return frames
}
