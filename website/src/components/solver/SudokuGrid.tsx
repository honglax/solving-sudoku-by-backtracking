import { memo, useCallback, useRef, type KeyboardEvent } from 'react'
import { formatMessage, messages } from '../../i18n/messages.ts'
import { BOX_SIZE, CELL_COUNT, cellPositionAt, EMPTY, SIZE } from '../../solver/sudokuRules.ts'
import type { CandidateCount } from '../../solverView/candidateCounts.ts'
import { describeCellState, type CellView } from '../../solverView/gridView.ts'
import { describeCell } from '../../solverView/formatting.ts'
import '../../styles/components/solver/SudokuGrid.css'

const DIGIT_KEY_PATTERN = /^[1-9]$/
const LINE_NUMBERS = Array.from({ length: SIZE }, (_, offset) => offset + 1)

type ArrowDirection = { rowStep: number; columnStep: number }

const ARROW_DIRECTIONS: Record<string, ArrowDirection> = {
  ArrowUp: { rowStep: -1, columnStep: 0 },
  ArrowDown: { rowStep: 1, columnStep: 0 },
  ArrowLeft: { rowStep: 0, columnStep: -1 },
  ArrowRight: { rowStep: 0, columnStep: 1 },
}

type SudokuGridProps = {
  cellViews: CellView[]
  showLineNumbers: boolean
  onTypeDigit: (index: number, digit: number) => void
  candidateCounts?: CandidateCount[]
}

export function SudokuGrid({ cellViews, showLineNumbers, onTypeDigit, candidateCounts }: SudokuGridProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>(new Array(CELL_COUNT).fill(null))

  const registerInput = useCallback((index: number, input: HTMLInputElement | null) => {
    inputRefs.current[index] = input
  }, [])

  const moveFocus = useCallback((fromIndex: number, direction: ArrowDirection) => {
    let { row, column } = cellPositionAt(fromIndex)
    while (true) {
      row += direction.rowStep
      column += direction.columnStep
      if (row < 1 || row > SIZE || column < 1 || column > SIZE) {
        return
      }
      const nextInput = inputRefs.current[(row - 1) * SIZE + (column - 1)]
      if (nextInput !== null) {
        nextInput.focus()
        return
      }
    }
  }, [])

  return (
    <div className={showLineNumbers ? 'sudoku-grid sudoku-grid--numbered' : 'sudoku-grid'}>
      {showLineNumbers && (
        <>
          <span className="sudoku-grid__corner" />
          <div className="sudoku-grid__column-numbers" aria-hidden="true">
            {LINE_NUMBERS.map(columnNumber => (
              <span key={columnNumber}>{columnNumber}</span>
            ))}
          </div>
          <div className="sudoku-grid__row-numbers" aria-hidden="true">
            {LINE_NUMBERS.map(rowNumber => (
              <span key={rowNumber}>{rowNumber}</span>
            ))}
          </div>
        </>
      )}
      <div className="sudoku-grid__cells" role="group" aria-label={messages.solver.gridLabel}>
        {cellViews.map((cellView, index) => (
          <SudokuCell
            key={index}
            index={index}
            digit={cellView.digit}
            state={cellView.state}
            ghostDigit={cellView.ghostDigit}
            hasConflictRing={cellView.hasConflictRing}
            isEditable={cellView.isEditable}
            stateLabel={describeCellState(cellView)}
            candidateCount={candidateCounts?.[index] ?? null}
            registerInput={registerInput}
            onTypeDigit={onTypeDigit}
            onMoveFocus={moveFocus}
          />
        ))}
      </div>
    </div>
  )
}

type SudokuCellProps = CellView & {
  index: number
  stateLabel: string | undefined
  candidateCount: CandidateCount
  registerInput: (index: number, input: HTMLInputElement | null) => void
  onTypeDigit: (index: number, digit: number) => void
  onMoveFocus: (fromIndex: number, direction: ArrowDirection) => void
}

function cellClassName(index: number, state: CellView['state'], hasConflictRing: boolean): string {
  const { row, column } = cellPositionAt(index)
  const classNames = ['sudoku-cell', `sudoku-cell--${state}`]
  if (column % BOX_SIZE === 0 && column < SIZE) {
    classNames.push('sudoku-cell--box-right-edge')
  }
  if (row % BOX_SIZE === 0 && row < SIZE) {
    classNames.push('sudoku-cell--box-bottom-edge')
  }
  if (column === SIZE) {
    classNames.push('sudoku-cell--last-column')
  }
  if (row === SIZE) {
    classNames.push('sudoku-cell--last-row')
  }
  if (hasConflictRing) {
    classNames.push('sudoku-cell--conflict')
  }
  return classNames.join(' ')
}

const SudokuCell = memo(function SudokuCell({
  index,
  digit,
  state,
  ghostDigit,
  hasConflictRing,
  isEditable,
  stateLabel,
  candidateCount,
  registerInput,
  onTypeDigit,
  onMoveFocus,
}: SudokuCellProps) {
  const className = cellClassName(index, state, hasConflictRing)
  const digitText = digit === EMPTY ? '' : String(digit)

  if (!isEditable) {
    const showsCandidateCount = candidateCount !== null && digit === EMPTY
    const candidateLabel = showsCandidateCount
      ? formatMessage(messages.solver.candidateCountLabel, { count: candidateCount })
      : undefined
    return (
      <div
        className={className}
        title={stateLabel ?? candidateLabel}
        data-candidate-count={showsCandidateCount ? candidateCount : undefined}
      >
        <span className="sudoku-cell__digit">{digitText}</span>
        {ghostDigit !== EMPTY && <span className="sudoku-cell__ghost">{ghostDigit}</span>}
        {showsCandidateCount && (
          <span className="sudoku-cell__candidate-count" aria-hidden="true">
            {candidateCount}
          </span>
        )}
      </div>
    )
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    const direction = ARROW_DIRECTIONS[event.key]
    if (direction !== undefined) {
      event.preventDefault()
      onMoveFocus(index, direction)
      return
    }
    if (event.key === 'Backspace' || event.key === 'Delete') {
      event.preventDefault()
      onTypeDigit(index, EMPTY)
    }
  }

  const handleTypedText = (typedText: string) => {
    const lastCharacter = typedText.slice(-1)
    if (DIGIT_KEY_PATTERN.test(lastCharacter)) {
      onTypeDigit(index, Number(lastCharacter))
    }
  }

  return (
    <div className={className} title={stateLabel}>
      <input
        ref={input => registerInput(index, input)}
        className="sudoku-cell__input"
        type="text"
        inputMode="numeric"
        autoComplete="off"
        aria-label={formatMessage(messages.solver.cellLabel, { cell: describeCell(cellPositionAt(index)) })}
        value={digitText}
        onKeyDown={handleKeyDown}
        onChange={event => handleTypedText(event.target.value)}
      />
    </div>
  )
})
