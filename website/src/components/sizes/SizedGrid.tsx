import { memo } from 'react'
import { formatMessage, messages } from '../../i18n/messages.ts'
import { digitCharacter, type GridShape } from '../../gridSizes/sizedRules.ts'
import { cellPositionOf } from '../../gridSizes/sizedRules.ts'
import { describeCell } from '../../solverView/formatting.ts'
import '../../styles/components/solver/SudokuGrid.css'
import '../../styles/components/sizes/SizedGrid.css'

const SIZES = messages.sizes

export type SizedCellState = 'empty' | 'given' | 'recorded' | 'trying' | 'rejected' | 'restored' | 'solved'

export type SizedCellView = {
  digit: number
  state: SizedCellState
  isConflict: boolean
  ghostDigit: number
}

type SizedCellProps = {
  view: SizedCellView
  index: number
  shape: GridShape
}

const SizedCell = memo(function SizedCell({ view, index, shape }: SizedCellProps) {
  const cell = cellPositionOf(shape, index)
  const classNames = ['sudoku-cell', `sudoku-cell--${view.state}`]
  if (view.isConflict) {
    classNames.push('sudoku-cell--conflict')
  }
  if (cell.column % shape.boxSize === 0 && cell.column < shape.size) {
    classNames.push('sudoku-cell--box-right-edge')
  }
  if (cell.row % shape.boxSize === 0 && cell.row < shape.size) {
    classNames.push('sudoku-cell--box-bottom-edge')
  }
  if (cell.column === shape.size) {
    classNames.push('sudoku-cell--last-column')
  }
  if (cell.row === shape.size) {
    classNames.push('sudoku-cell--last-row')
  }
  const label =
    view.digit === 0
      ? formatMessage(SIZES.emptyCellLabel, { cell: describeCell(cell) })
      : formatMessage(SIZES.cellLabel, { cell: describeCell(cell), digit: digitCharacter(view.digit) })
  return (
    <div className={classNames.join(' ')} role="img" aria-label={label}>
      {view.digit !== 0 && <span className="sudoku-cell__digit">{digitCharacter(view.digit)}</span>}
      {view.digit === 0 && view.ghostDigit !== 0 && <span className="sudoku-cell__ghost">{digitCharacter(view.ghostDigit)}</span>}
    </div>
  )
})

type SizedGridProps = {
  shape: GridShape
  cellViews: SizedCellView[]
}

export function SizedGrid({ shape, cellViews }: SizedGridProps) {
  return (
    <div className="sudoku-grid sized-grid" data-size={shape.size}>
      <div
        className="sudoku-grid__cells"
        role="group"
        aria-label={formatMessage(SIZES.gridLabel, { size: shape.size })}
        style={{ gridTemplateColumns: `repeat(${shape.size}, var(--size-cell))` }}
      >
        {cellViews.map((view, index) => (
          <SizedCell key={index} view={view} index={index} shape={shape} />
        ))}
      </div>
    </div>
  )
}
