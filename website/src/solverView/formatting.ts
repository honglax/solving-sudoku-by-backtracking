import { formatMessage, LOCALE, messages } from '../i18n/messages.ts'
import { BOX_SIZE, type CellPosition, type Unit } from '../solver/sudokuRules.ts'

const NUMBER_FORMAT = new Intl.NumberFormat(LOCALE)

export function formatCount(count: number): string {
  return NUMBER_FORMAT.format(count)
}

export function describeCell(cell: CellPosition): string {
  return formatMessage(messages.units.cell, { row: cell.row, column: cell.column })
}

export function describeBoxRange(cell: CellPosition): string {
  const firstRow = Math.floor((cell.row - 1) / BOX_SIZE) * BOX_SIZE + 1
  const firstColumn = Math.floor((cell.column - 1) / BOX_SIZE) * BOX_SIZE + 1
  return formatMessage(messages.units.box, {
    firstRow,
    lastRow: firstRow + BOX_SIZE - 1,
    firstColumn,
    lastColumn: firstColumn + BOX_SIZE - 1,
  })
}

export function describeUnitOfCell(unit: Unit, cell: CellPosition): string {
  if (unit === 'row') {
    return formatMessage(messages.units.row, { row: cell.row })
  }
  if (unit === 'column') {
    return formatMessage(messages.units.column, { column: cell.column })
  }
  return describeBoxRange(cell)
}
