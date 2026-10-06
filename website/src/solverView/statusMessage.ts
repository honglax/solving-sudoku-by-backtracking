import { formatMessage, joinListItems, messages, type MessageValues } from '../i18n/messages.ts'
import { parseRichText } from '../i18n/richText.ts'
import type { PuzzleParseError } from '../solver/puzzleParser.ts'
import type { DuplicateDigit, PuzzleStatus } from '../solver/puzzleValidator.ts'
import type { SolverProgress } from '../solver/solverProgress.ts'
import {
  cellPositionAt,
  cellsInUnit,
  digitAt,
  EMPTY,
  FIRST_DIGIT,
  LAST_DIGIT,
  UNITS,
  unitNumberOf,
  type CellPosition,
  type Grid,
  type Unit,
} from '../solver/sudokuRules.ts'
import { describeBoxRange, describeCell, describeUnitOfCell, formatCount } from './formatting.ts'

export type MessageTone = 'info' | 'busy' | 'trying' | 'rejected' | 'restored' | 'solved' | 'error'

export type MessageSegment = {
  text: string
  isEmphasized: boolean
}

export type StatusMessage = {
  tone: MessageTone
  segments: MessageSegment[]
}

export type PlaybackPhase =
  | 'notStarted'
  | 'running'
  | 'pausedAtFirstBacktrack'
  | 'solvingInstantlyLong'
  | 'instantSolvePaused'

type StatusMessageInput = {
  puzzle: Grid
  puzzleStatus: PuzzleStatus
  progress: SolverProgress | null
  phase: PlaybackPhase
}

const MESSAGES = messages.solver.messages

function buildMessage(tone: MessageTone, template: string, values: MessageValues = {}): StatusMessage {
  const segments = parseRichText(formatMessage(template, values)).map(segment => ({
    text: segment.text,
    isEmphasized: segment.style === 'strong',
  }))
  return { tone, segments }
}

export function buildStatusMessage({ puzzle, puzzleStatus, progress, phase }: StatusMessageInput): StatusMessage {
  if (progress === null || progress.lastMessageEvent === null) {
    return puzzleStatusMessage(puzzleStatus)
  }
  if (phase === 'solvingInstantlyLong') {
    return buildMessage('busy', MESSAGES.solvingLong, { tryCount: formatCount(progress.tryCount) })
  }
  if (phase === 'instantSolvePaused') {
    return buildMessage('info', MESSAGES.instantSolvePaused, { tryCount: formatCount(progress.tryCount) })
  }

  const event = progress.lastMessageEvent
  if (phase === 'pausedAtFirstBacktrack' && event.kind === 'restoreState') {
    return buildMessage('restored', MESSAGES.firstBacktrack, { cell: describeCell(event.cell), digit: event.digit })
  }
  switch (event.kind) {
    case 'acceptCandidate':
      return buildMessage('trying', MESSAGES.accepted, { cell: describeCell(event.cell), digit: event.digit })
    case 'rejectCandidate':
      return buildMessage('rejected', MESSAGES.rejected, {
        cell: describeCell(event.cell),
        digit: event.digit,
        unit: describeUnitOfCell(event.conflictingUnit, event.cell),
      })
    case 'restoreState':
      return restoreMessage(event.cell, event.digit)
    case 'solutionFound':
    case 'solutionListed':
      return buildMessage('solved', MESSAGES.solved, {
        tryCount: formatCount(progress.tryCount),
        restoreCount: formatCount(progress.restoreCount),
      })
    case 'noSolution':
      return noSolutionMessage(puzzle, progress)
    case 'searchExhausted':
      if (event.solutionCount === 0) {
        return noSolutionMessage(puzzle, progress)
      }
      return buildMessage('solved', MESSAGES.solved, {
        tryCount: formatCount(progress.tryCount),
        restoreCount: formatCount(progress.restoreCount),
      })
    case 'recordState':
    case 'descend':
      return puzzleStatusMessage(puzzleStatus)
  }
}

function restoreMessage(cell: CellPosition, removedDigit: number): StatusMessage {
  if (removedDigit === LAST_DIGIT) {
    return buildMessage('restored', MESSAGES.restoredAfterLastDigit, {
      cell: describeCell(cell),
      digit: removedDigit,
      firstDigit: FIRST_DIGIT,
      lastDigit: LAST_DIGIT,
    })
  }
  return buildMessage('restored', MESSAGES.restoredWithNextDigit, {
    cell: describeCell(cell),
    digit: removedDigit,
    nextDigit: removedDigit + 1,
  })
}

function puzzleStatusMessage(puzzleStatus: PuzzleStatus): StatusMessage {
  switch (puzzleStatus.kind) {
    case 'ready':
      return buildMessage('info', MESSAGES.ready, { blankCount: formatCount(puzzleStatus.blankCount) })
    case 'complete':
      return buildMessage('info', MESSAGES.complete)
    case 'invalid':
      return duplicateMessage(puzzleStatus.duplicates[0])
  }
}

function duplicateMessage(duplicate: DuplicateDigit): StatusMessage {
  return buildMessage('error', MESSAGES.duplicate, {
    digit: duplicate.digit,
    count: duplicate.cells.length,
    location: describeDuplicateLocation(duplicate),
  })
}

function describeDuplicateLocation(duplicate: DuplicateDigit): string {
  const firstCell = duplicate.cells[0]
  if (duplicate.unit === 'row') {
    const columns = duplicate.cells.map(cell => formatMessage(messages.units.column, { column: cell.column }))
    return formatMessage(MESSAGES.duplicateInRow, { row: firstCell.row, columns: joinListItems(columns) })
  }
  if (duplicate.unit === 'column') {
    const rows = duplicate.cells.map(cell => formatMessage(messages.units.row, { row: cell.row }))
    return formatMessage(MESSAGES.duplicateInColumn, { column: firstCell.column, rows: joinListItems(rows) })
  }
  const cells = duplicate.cells.map(cell => formatMessage(MESSAGES.duplicateCell, { cell: describeCell(cell) }))
  return formatMessage(MESSAGES.duplicateInBox, { box: describeBoxRange(firstCell), cells: joinListItems(cells) })
}

function noSolutionMessage(puzzle: Grid, progress: SolverProgress): StatusMessage {
  const everyDigitRejectedAtFirstCell = progress.recordCount === 0
  if (!everyDigitRejectedAtFirstCell) {
    return buildMessage('rejected', MESSAGES.noSolutionGeneral, { tryCount: formatCount(progress.tryCount) })
  }
  const firstBlankCell = cellPositionAt(puzzle.indexOf(EMPTY))
  return buildMessage('rejected', MESSAGES.noSolutionAtFirstCell, {
    cell: describeCell(firstBlankCell),
    reasons: describeRejectionReasons(puzzle, firstBlankCell),
  })
}

type RejectionGroup = {
  unit: Unit
  digits: number[]
}

function firstUnitHoldingDigit(puzzle: Grid, cell: CellPosition, digit: number): Unit {
  const holdingUnit = UNITS.find(unit =>
    cellsInUnit(unit, unitNumberOf(unit, cell)).some(cellOfUnit => digitAt(puzzle, cellOfUnit) === digit),
  )
  if (holdingUnit === undefined) {
    throw new Error(`Digit ${digit} was rejected at ${describeCell(cell)} but no unit holds it`)
  }
  return holdingUnit
}

function describeRejectionReasons(puzzle: Grid, cell: CellPosition): string {
  const groups: RejectionGroup[] = []
  for (let digit = FIRST_DIGIT; digit <= LAST_DIGIT; digit++) {
    const unit = firstUnitHoldingDigit(puzzle, cell, digit)
    const lastGroup = groups[groups.length - 1]
    if (lastGroup !== undefined && lastGroup.unit === unit) {
      lastGroup.digits.push(digit)
    } else {
      groups.push({ unit, digits: [digit] })
    }
  }
  return groups
    .map(group =>
      formatMessage(MESSAGES.rejectionReason, {
        digits: describeDigits(group.digits),
        unit: describeUnitOfCell(group.unit, cell),
      }),
    )
    .join(MESSAGES.rejectionReasonSeparator)
}

function describeDigits(digits: number[]): string {
  if (digits.length === 1) {
    return formatMessage(MESSAGES.singleDigit, { digit: digits[0] })
  }
  return formatMessage(MESSAGES.digitRange, { firstDigit: digits[0], lastDigit: digits[digits.length - 1] })
}

export function parseErrorMessage(error: PuzzleParseError): StatusMessage {
  const PARSE_ERRORS = messages.solver.parseErrors
  switch (error.kind) {
    case 'wrongLineCount':
      return buildMessage('error', PARSE_ERRORS.wrongLineCount, { lineCount: error.lineCount })
    case 'wrongCellCountInLine':
      return buildMessage('error', PARSE_ERRORS.wrongCellCountInLine, {
        lineNumber: error.lineNumber,
        cellCount: error.cellCount,
      })
    case 'invalidCharacterInLine':
      return buildMessage('error', PARSE_ERRORS.invalidCharacterInLine, {
        lineNumber: error.lineNumber,
        character: error.character,
      })
    case 'wrongStringLength':
      return buildMessage('error', PARSE_ERRORS.wrongStringLength, { length: formatCount(error.length) })
    case 'invalidCharacterInString':
      return buildMessage('error', PARSE_ERRORS.invalidCharacterInString, {
        position: error.position,
        character: error.character,
      })
  }
}
