import { mkdirSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { solveByBacktracking } from '../../website/src/solver/backtrackingSolver.ts'
import { parsePuzzle } from '../../website/src/solver/puzzleParser.ts'
import { findSamplePuzzle } from '../../website/src/solver/samplePuzzles.ts'
import type { SolverEvent } from '../../website/src/solver/solverEvents.ts'
import { applySolverEvent, createSolverProgress, type SolverProgress } from '../../website/src/solver/solverProgress.ts'
import { EMPTY, SIZE, type CellPosition, type Grid } from '../../website/src/solver/sudokuRules.ts'

const ILLUSTRATION_PUZZLE_ID = 13
const EXCERPT_FLAG = '--excerpt='
const EXCERPT_STEPS_PATH_NAME = 'excerpt-steps.csv'
const EXCERPT_CSV_COLUMNS = ['stepButtonPresses', 'tryNumber', 'index', 'row', 'column', 'digit', 'action', 'unit', 'conflictRow', 'conflictColumn', 'window']
const DATA_DIRECTORY = fileURLToPath(new URL('../data/', import.meta.url))
const STEPS_PATH = `${DATA_DIRECTORY}illustration-steps.csv`
const SNAPSHOTS_PATH = `${DATA_DIRECTORY}illustration-snapshots.json`
const EMPTY_SLOT_MARK = '.'
const CSV_COLUMNS = ['step', 'stepButtonPresses', 'tryNumber', 'index', 'row', 'column', 'digit', 'action', 'unit', 'conflictRow', 'conflictColumn', 'solutionVector']

type StepAction = 'accept' | 'reject' | 'restore' | 'solution' | 'noSolution'

type StepRow = {
  step: number
  stepButtonPresses: number
  tryNumber: number
  index: number | null
  cell: CellPosition | null
  digit: number | null
  action: StepAction
  unit: string
  conflictingCell: CellPosition | null
  solutionVector: string
}

type SnapshotMoment = 'start' | StepAction

type GridSnapshot = {
  afterStep: number
  stepButtonPresses: number
  tryNumber: number
  moment: SnapshotMoment
  grid: string
  solutionVector: string
}

function isVisibleStep(event: SolverEvent): boolean {
  return (
    event.kind === 'acceptCandidate' ||
    event.kind === 'rejectCandidate' ||
    event.kind === 'restoreState' ||
    event.kind === 'solutionFound' ||
    event.kind === 'noSolution'
  )
}

function solutionVectorText(progress: SolverProgress): string {
  return progress.solutionVector
    .slice(1)
    .map(digit => (digit === EMPTY ? EMPTY_SLOT_MARK : String(digit)))
    .join(' ')
}

function gridText(grid: Grid): string {
  const lines: string[] = []
  for (let rowStart = 0; rowStart < grid.length; rowStart += SIZE) {
    lines.push(
      grid
        .slice(rowStart, rowStart + SIZE)
        .map(digit => (digit === EMPTY ? EMPTY_SLOT_MARK : String(digit)))
        .join(''),
    )
  }
  return lines.join('\n')
}

function startRow(event: SolverEvent, step: number, stepButtonPresses: number, tryNumber: number): StepRow {
  const row: StepRow = {
    step,
    stepButtonPresses,
    tryNumber,
    index: null,
    cell: null,
    digit: null,
    action: 'solution',
    unit: '',
    conflictingCell: null,
    solutionVector: '',
  }
  switch (event.kind) {
    case 'acceptCandidate':
      return { ...row, index: event.index, cell: event.cell, digit: event.digit, action: 'accept' }
    case 'rejectCandidate':
      return {
        ...row,
        index: event.index,
        cell: event.cell,
        digit: event.digit,
        action: 'reject',
        unit: event.conflictingUnit,
        conflictingCell: event.conflictingCell,
      }
    case 'restoreState':
      return { ...row, index: event.index, cell: event.cell, digit: event.digit, action: 'restore' }
    case 'noSolution':
      return { ...row, action: 'noSolution' }
    default:
      return row
  }
}

function csvLine(row: StepRow): string {
  return [
    row.step,
    row.stepButtonPresses,
    row.tryNumber,
    row.index ?? '',
    row.cell?.row ?? '',
    row.cell?.column ?? '',
    row.digit ?? '',
    row.action,
    row.unit,
    row.conflictingCell?.row ?? '',
    row.conflictingCell?.column ?? '',
    row.solutionVector,
  ].join(',')
}

type Excerpt = { puzzleId: number; fromTry: number; toTry: number; firstIndex: number; lastIndex: number }

function parseExcerpt(): Excerpt | null {
  const argument = process.argv.find(candidate => candidate.startsWith(EXCERPT_FLAG))
  if (argument === undefined) {
    return null
  }
  const [puzzleId, fromTry, toTry, firstIndex, lastIndex] = argument.slice(EXCERPT_FLAG.length).split(':').map(Number)
  return { puzzleId, fromTry, toTry, firstIndex, lastIndex }
}

function windowText(solutionVector: string, excerpt: Excerpt): string {
  return solutionVector.split(' ').slice(excerpt.firstIndex - 1, excerpt.lastIndex).join(' ')
}

function excerptLine(row: StepRow, excerpt: Excerpt): string {
  return [
    row.stepButtonPresses,
    row.tryNumber,
    row.index ?? '',
    row.cell?.row ?? '',
    row.cell?.column ?? '',
    row.digit ?? '',
    row.action,
    row.unit,
    row.conflictingCell?.row ?? '',
    row.conflictingCell?.column ?? '',
    windowText(row.solutionVector, excerpt),
  ].join(',')
}

function main() {
  const excerpt = parseExcerpt()
  const sample = findSamplePuzzle(excerpt?.puzzleId ?? ILLUSTRATION_PUZZLE_ID)
  const parseResult = parsePuzzle(sample.puzzle)
  if (!parseResult.ok) {
    throw new Error(`Illustration puzzle ${ILLUSTRATION_PUZZLE_ID} does not parse`)
  }
  const puzzle = parseResult.grid
  const progress = createSolverProgress(puzzle)
  const rows: StepRow[] = []
  const snapshots: GridSnapshot[] = [
    { afterStep: 0, stepButtonPresses: 0, tryNumber: 0, moment: 'start', grid: gridText(puzzle), solutionVector: solutionVectorText(progress) },
  ]

  const finishRow = (row: StepRow | undefined) => {
    if (row === undefined) {
      return
    }
    row.solutionVector = solutionVectorText(progress)
    if (row.action === 'restore' || row.action === 'solution' || row.action === 'noSolution') {
      snapshots.push({
        afterStep: row.step,
        stepButtonPresses: row.stepButtonPresses,
        tryNumber: row.tryNumber,
        moment: row.action,
        grid: gridText(progress.grid),
        solutionVector: row.solutionVector,
      })
    }
  }

  let eventCount = 0
  for (const event of solveByBacktracking(puzzle)) {
    if (isVisibleStep(event)) {
      finishRow(rows.at(-1))
    }
    applySolverEvent(progress, event)
    eventCount++
    if (isVisibleStep(event)) {
      rows.push(startRow(event, rows.length + 1, eventCount, progress.tryCount))
    }
  }
  finishRow(rows.at(-1))

  const measured = sample.measured
  if (progress.tryCount !== measured.tryCount || progress.restoreCount !== measured.restoreCount) {
    throw new Error('The exported trace does not match the measured counts of the sample puzzle')
  }

  mkdirSync(DATA_DIRECTORY, { recursive: true })
  if (excerpt !== null) {
    const excerptRows = rows.filter(row => row.tryNumber >= excerpt.fromTry && row.tryNumber <= excerpt.toTry)
    writeFileSync(`${DATA_DIRECTORY}${EXCERPT_STEPS_PATH_NAME}`, [EXCERPT_CSV_COLUMNS.join(','), ...excerptRows.map(row => excerptLine(row, excerpt))].join('\n') + '\n')
    console.log(`${excerptRows.length} excerpt steps from try ${excerpt.fromTry} to ${excerpt.toTry} -> report/data/${EXCERPT_STEPS_PATH_NAME}`)
    return
  }
  writeFileSync(STEPS_PATH, [CSV_COLUMNS.join(','), ...rows.map(csvLine)].join('\n') + '\n')
  writeFileSync(SNAPSHOTS_PATH, JSON.stringify(snapshots, null, 2) + '\n')
  console.log(`${rows.length} steps, ${progress.tryCount} tries, ${progress.restoreCount} restores`)
  console.log(`-> report/data/illustration-steps.csv, report/data/illustration-snapshots.json (${snapshots.length} grids)`)
}

main()
