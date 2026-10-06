import type { SolverProgress } from '../solver/solverProgress.ts'
import { EMPTY } from '../solver/sudokuRules.ts'

export type SlotState = 'empty' | 'recorded' | 'trying' | 'restored' | 'rejected'

export type SlotView = {
  index: number
  digit: number
  state: SlotState
}

export function buildSolutionVectorView(blankCount: number, progress: SolverProgress | null): SlotView[] {
  const slotViews: SlotView[] = []
  for (let index = 1; index <= blankCount; index++) {
    const digit = progress === null ? EMPTY : progress.solutionVector[index]
    const state: SlotState = digit === EMPTY ? 'empty' : 'recorded'
    slotViews.push({ index, digit, state })
  }

  const lastEvent = progress?.lastEvent ?? null
  if (lastEvent === null) {
    return slotViews
  }
  switch (lastEvent.kind) {
    case 'acceptCandidate':
    case 'rejectCandidate':
      slotViews[lastEvent.index - 1] = { index: lastEvent.index, digit: lastEvent.digit, state: 'trying' }
      break
    case 'restoreState':
      slotViews[lastEvent.index - 1] = { index: lastEvent.index, digit: lastEvent.digit, state: 'restored' }
      break
    case 'noSolution':
      slotViews[0] = { index: 1, digit: EMPTY, state: 'rejected' }
      break
    case 'recordState':
    case 'descend':
    case 'solutionFound':
    case 'solutionListed':
    case 'searchExhausted':
      break
  }
  return slotViews
}
