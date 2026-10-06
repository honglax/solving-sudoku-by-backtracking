import type { CellPosition, Unit } from './sudokuRules.ts'

export type AcceptCandidateEvent = {
  kind: 'acceptCandidate'
  index: number
  cell: CellPosition
  digit: number
}

export type RejectCandidateEvent = {
  kind: 'rejectCandidate'
  index: number
  cell: CellPosition
  digit: number
  conflictingUnit: Unit
  conflictingCell: CellPosition
}

export type RecordStateEvent = {
  kind: 'recordState'
  index: number
  cell: CellPosition
  digit: number
}

export type DescendEvent = {
  kind: 'descend'
  fromIndex: number
  toIndex: number
}

export type RestoreStateEvent = {
  kind: 'restoreState'
  index: number
  cell: CellPosition
  digit: number
}

export type SolutionFoundEvent = {
  kind: 'solutionFound'
}

export type NoSolutionEvent = {
  kind: 'noSolution'
}

export type SolutionListedEvent = {
  kind: 'solutionListed'
  solutionNumber: number
}

export type SearchExhaustedEvent = {
  kind: 'searchExhausted'
  solutionCount: number
}

export type SolverEvent =
  | AcceptCandidateEvent
  | RejectCandidateEvent
  | RecordStateEvent
  | DescendEvent
  | RestoreStateEvent
  | SolutionFoundEvent
  | NoSolutionEvent
  | SolutionListedEvent
  | SearchExhaustedEvent
