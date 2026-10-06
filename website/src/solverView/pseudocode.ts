import { messages } from '../i18n/messages.ts'
import type { SolverEvent } from '../solver/solverEvents.ts'

export const PSEUDOCODE_LINES: string[] = messages.solver.pseudocode.lines

const ACCEPTABILITY_CHECK_LINE = 3
const RECORD_STATE_LINE = 5
const RECURSIVE_CALL_LINE = 7
const WRITE_SOLUTION_LINE = 9
const RESTORE_STATE_LINE = 10

export type CheckResult = 'accepted' | 'rejected'

export type PseudocodeHighlight = {
  lineNumber: number
  checkResult: CheckResult | null
}

export function highlightForEvent(event: SolverEvent | null): PseudocodeHighlight | null {
  if (event === null) {
    return null
  }
  switch (event.kind) {
    case 'acceptCandidate':
      return { lineNumber: ACCEPTABILITY_CHECK_LINE, checkResult: 'accepted' }
    case 'rejectCandidate':
      return { lineNumber: ACCEPTABILITY_CHECK_LINE, checkResult: 'rejected' }
    case 'recordState':
      return { lineNumber: RECORD_STATE_LINE, checkResult: null }
    case 'descend':
      return { lineNumber: RECURSIVE_CALL_LINE, checkResult: null }
    case 'solutionFound':
      return { lineNumber: WRITE_SOLUTION_LINE, checkResult: null }
    case 'restoreState':
      return { lineNumber: RESTORE_STATE_LINE, checkResult: null }
    case 'noSolution':
      return null
  }
}
