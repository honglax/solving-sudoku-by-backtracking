import { formatMessage, messages } from '../i18n/messages.ts'
import type { SolverEvent } from '../solver/solverEvents.ts'
import { HISTORY_STEP_COUNT } from '../solver/solverHistory.ts'
import { describeCell, describeUnitOfCell } from './formatting.ts'
import type { MessageTone } from './statusMessage.ts'

const HISTORY = messages.solver.history
const ROWS = HISTORY.rows

export const HISTORY_LIMIT_NOTICE = formatMessage(HISTORY.limitNotice, { limit: HISTORY_STEP_COUNT })
export const HISTORY_LIMIT_REACHED_NOTICE = formatMessage(HISTORY.limitReachedNotice, { limit: HISTORY_STEP_COUNT })

export function isHistoryFull(stepCount: number): boolean {
  return stepCount >= HISTORY_STEP_COUNT
}

export type HistoryRowView = {
  tone: MessageTone
  cellText: string
  digitText: string
  resultText: string
  reasonText: string
}

export function describeHistoryEvent(event: SolverEvent): HistoryRowView {
  switch (event.kind) {
    case 'acceptCandidate':
      return {
        tone: 'trying',
        cellText: describeCell(event.cell),
        digitText: String(event.digit),
        resultText: ROWS.accepted.result,
        reasonText: ROWS.accepted.reason,
      }
    case 'rejectCandidate':
      return {
        tone: 'rejected',
        cellText: describeCell(event.cell),
        digitText: String(event.digit),
        resultText: ROWS.rejected.result,
        reasonText: formatMessage(ROWS.rejected.reason, {
          unit: describeUnitOfCell(event.conflictingUnit, event.cell),
        }),
      }
    case 'restoreState':
      return {
        tone: 'restored',
        cellText: describeCell(event.cell),
        digitText: String(event.digit),
        resultText: ROWS.restored.result,
        reasonText: ROWS.restored.reason,
      }
    case 'solutionFound':
      return {
        tone: 'solved',
        cellText: HISTORY.notApplicable,
        digitText: HISTORY.notApplicable,
        resultText: ROWS.solved.result,
        reasonText: ROWS.solved.reason,
      }
    case 'noSolution':
      return {
        tone: 'rejected',
        cellText: HISTORY.notApplicable,
        digitText: HISTORY.notApplicable,
        resultText: ROWS.noSolution.result,
        reasonText: ROWS.noSolution.reason,
      }
    case 'recordState':
      return {
        tone: 'info',
        cellText: describeCell(event.cell),
        digitText: String(event.digit),
        resultText: ROWS.recorded.result,
        reasonText: HISTORY.notApplicable,
      }
    case 'descend':
      return {
        tone: 'info',
        cellText: HISTORY.notApplicable,
        digitText: HISTORY.notApplicable,
        resultText: ROWS.descended.result,
        reasonText: formatMessage(ROWS.descended.reason, { index: event.toIndex }),
      }
  }
}
