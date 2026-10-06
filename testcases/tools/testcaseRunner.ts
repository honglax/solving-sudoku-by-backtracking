import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { solveByBacktracking } from '../../website/src/solver/backtrackingSolver.ts'
import { parsePuzzle, type PuzzleParseError } from '../../website/src/solver/puzzleParser.ts'
import { analyzePuzzle, type DuplicateDigit } from '../../website/src/solver/puzzleValidator.ts'
import { applySolverEvent, createSolverProgress } from '../../website/src/solver/solverProgress.ts'
import { LAST_DIGIT, SIZE, type Grid, type Unit } from '../../website/src/solver/sudokuRules.ts'

export const TESTCASES_DIRECTORY = fileURLToPath(new URL('..', import.meta.url))
const MANIFEST_PATH = `${TESTCASES_DIRECTORY}manifest.csv`
const NO_SOLUTION_LINE = 'NO SOLUTION'
const INVALID_LINE = 'INVALID'
const CAPPED_COUNT_SUFFIX = '+'
const TRY_BUDGET_FOR_INVALID_INPUT = 0

export type ExpectedKind = 'solved' | 'complete' | 'noSolution' | 'invalid'

export type ResultKind = ExpectedKind | 'stoppedOverTryBudget'

export type ManifestEntry = {
  id: string
  group: string
  file: string
  inputFormat: string
  blankCount: number | null
  expectedKind: ExpectedKind
  solutionCount: string
  tryCount: number | null
  recordCount: number | null
  restoreCount: number | null
  rejectCounts: Record<Unit, number | null>
  isSlow: boolean
  description: string
}

export const ALL_COVERAGE_TAGS = [
  'format:nineLines',
  'format:compactLines',
  'format:singleString',
  'parse:wrongLineCount',
  'parse:wrongCellCountInLine',
  'parse:invalidCharacterInLine',
  'parse:wrongStringLength',
  'parse:invalidCharacterInString',
  'duplicate:row',
  'duplicate:column',
  'duplicate:box',
  'result:complete',
  'result:solved',
  'result:solvedWithManySolutions',
  'result:noSolutionWithoutAnyRecord',
  'result:noSolutionAfterSearch',
  'reject:row',
  'reject:column',
  'reject:box',
  'backtrack:afterLastDigit',
] as const

export type CoverageTag = (typeof ALL_COVERAGE_TAGS)[number]

export type CaseRunResult = {
  kind: ResultKind
  outputText: string
  tryCount: number | null
  recordCount: number | null
  restoreCount: number | null
  rejectCounts: Record<Unit, number> | null
  coverage: Set<CoverageTag>
}

export type CaseVerdict = {
  entry: ManifestEntry
  result: CaseRunResult
  elapsedMilliseconds: number
  mismatches: string[]
}

function describeParseError(error: PuzzleParseError): string {
  switch (error.kind) {
    case 'wrongLineCount':
      return `wrong line count: ${error.lineCount}`
    case 'wrongCellCountInLine':
      return `line ${error.lineNumber}: wrong cell count: ${error.cellCount}`
    case 'invalidCharacterInLine':
      return `line ${error.lineNumber}: invalid character "${error.character}"`
    case 'wrongStringLength':
      return `wrong string length: ${error.length}`
    case 'invalidCharacterInString':
      return `position ${error.position}: invalid character "${error.character}"`
  }
}

function describeDuplicate(duplicate: DuplicateDigit): string {
  return `duplicate ${duplicate.digit} in ${duplicate.unit} ${duplicate.unitNumber}`
}

function gridToNineLines(grid: Grid): string {
  const lines: string[] = []
  for (let rowStart = 0; rowStart < grid.length; rowStart += SIZE) {
    lines.push(grid.slice(rowStart, rowStart + SIZE).join(' '))
  }
  return `${lines.join('\n')}\n`
}

function invalidResult(detailLines: string[], coverage: Set<CoverageTag>): CaseRunResult {
  return {
    kind: 'invalid',
    outputText: `${[INVALID_LINE, ...detailLines].join('\n')}\n`,
    tryCount: null,
    recordCount: null,
    restoreCount: null,
    rejectCounts: null,
    coverage,
  }
}

export function runCase(inputText: string, inputFormat: string, tryBudget: number): CaseRunResult {
  const coverage = new Set<CoverageTag>()
  const parseResult = parsePuzzle(inputText)
  if (!parseResult.ok) {
    coverage.add(`parse:${parseResult.error.kind}`)
    return invalidResult([describeParseError(parseResult.error)], coverage)
  }
  if (inputFormat === 'nineLines' || inputFormat === 'compactLines' || inputFormat === 'singleString') {
    coverage.add(`format:${inputFormat}`)
  }

  const puzzle = parseResult.grid
  const status = analyzePuzzle(puzzle)
  if (status.kind === 'invalid') {
    for (const duplicate of status.duplicates) {
      coverage.add(`duplicate:${duplicate.unit}`)
    }
    return invalidResult(status.duplicates.map(describeDuplicate).sort(), coverage)
  }
  if (status.kind === 'complete') {
    coverage.add('result:complete')
    return {
      kind: 'complete',
      outputText: gridToNineLines(puzzle),
      tryCount: 0,
      recordCount: 0,
      restoreCount: 0,
      rejectCounts: { row: 0, column: 0, box: 0 },
      coverage,
    }
  }

  const progress = createSolverProgress(puzzle)
  const rejectCounts: Record<Unit, number> = { row: 0, column: 0, box: 0 }
  for (const event of solveByBacktracking(puzzle)) {
    applySolverEvent(progress, event)
    if (progress.tryCount > tryBudget) {
      return {
        kind: 'stoppedOverTryBudget',
        outputText: '',
        tryCount: progress.tryCount,
        recordCount: progress.recordCount,
        restoreCount: progress.restoreCount,
        rejectCounts,
        coverage,
      }
    }
    if (event.kind === 'rejectCandidate') {
      rejectCounts[event.conflictingUnit] += 1
      coverage.add(`reject:${event.conflictingUnit}`)
    }
    if (event.kind === 'restoreState' && event.digit === LAST_DIGIT) {
      coverage.add('backtrack:afterLastDigit')
    }
  }
  const counts = {
    tryCount: progress.tryCount,
    recordCount: progress.recordCount,
    restoreCount: progress.restoreCount,
    rejectCounts,
  }
  if (progress.lastEvent?.kind === 'noSolution') {
    coverage.add(progress.recordCount === 0 ? 'result:noSolutionWithoutAnyRecord' : 'result:noSolutionAfterSearch')
    return { kind: 'noSolution', outputText: `${NO_SOLUTION_LINE}\n`, ...counts, coverage }
  }
  coverage.add('result:solved')
  return { kind: 'solved', outputText: gridToNineLines(progress.grid), ...counts, coverage }
}

function hasManySolutions(entry: ManifestEntry): boolean {
  if (entry.solutionCount.endsWith(CAPPED_COUNT_SUFFIX)) {
    return true
  }
  return Number(entry.solutionCount) > 1
}

function compareCounts(entry: ManifestEntry, result: CaseRunResult): string[] {
  const mismatches: string[] = []
  const countPairs: [string, number | null, number | null][] = [
    ['tryCount', entry.tryCount, result.tryCount],
    ['recordCount', entry.recordCount, result.recordCount],
    ['restoreCount', entry.restoreCount, result.restoreCount],
    ['rowRejectCount', entry.rejectCounts.row, result.rejectCounts?.row ?? null],
    ['columnRejectCount', entry.rejectCounts.column, result.rejectCounts?.column ?? null],
    ['boxRejectCount', entry.rejectCounts.box, result.rejectCounts?.box ?? null],
  ]
  for (const [countName, expectedCount, actualCount] of countPairs) {
    const isUnmeasuredSlowCount = entry.isSlow && expectedCount === null
    if (!isUnmeasuredSlowCount && expectedCount !== actualCount) {
      mismatches.push(`${countName}: expected ${expectedCount}, got ${actualCount}`)
    }
  }
  return mismatches
}

type CaseFiles = { input: string; expectedOutput: string }

const CASE_HEADER_SEPARATOR = '\n=== '
const CASE_TITLE_SEPARATOR = ' · '
const INPUT_MARKER = '--- input\n'
const EXPECTED_MARKER = '--- expected\n'
const LINE_BREAK = '\n'

const casesByGroupFile = new Map<string, Map<string, CaseFiles>>()

function parseGroupFile(text: string): Map<string, CaseFiles> {
  const cases = new Map<string, CaseFiles>()
  const [, ...caseChunks] = (LINE_BREAK + text).split(CASE_HEADER_SEPARATOR)
  for (const chunk of caseChunks) {
    const headerEnd = chunk.indexOf(LINE_BREAK)
    const caseId = chunk.slice(0, headerEnd).split(CASE_TITLE_SEPARATOR)[0]
    const body = chunk.slice(headerEnd + LINE_BREAK.length)
    if (!body.startsWith(INPUT_MARKER)) {
      throw new Error(`Case ${caseId} has no "${INPUT_MARKER.trim()}" section`)
    }
    const expectedStart = body.indexOf(EXPECTED_MARKER, INPUT_MARKER.length)
    if (expectedStart < 0) {
      throw new Error(`Case ${caseId} has no "${EXPECTED_MARKER.trim()}" section`)
    }
    cases.set(caseId, {
      input: body.slice(INPUT_MARKER.length, expectedStart),
      expectedOutput: body.slice(expectedStart + EXPECTED_MARKER.length),
    })
  }
  return cases
}

export function readCaseFiles(entry: ManifestEntry): CaseFiles {
  let groupCases = casesByGroupFile.get(entry.file)
  if (groupCases === undefined) {
    groupCases = parseGroupFile(readFileSync(`${TESTCASES_DIRECTORY}${entry.file}`, 'utf-8'))
    casesByGroupFile.set(entry.file, groupCases)
  }
  const caseFiles = groupCases.get(entry.id)
  if (caseFiles === undefined) {
    throw new Error(`Case ${entry.id} is listed in manifest.csv but missing from ${entry.file}`)
  }
  return caseFiles
}

export function verifyCase(entry: ManifestEntry): CaseVerdict {
  const { input: inputText, expectedOutput } = readCaseFiles(entry)
  const startTime = performance.now()
  const result = runCase(inputText, entry.inputFormat, entry.tryCount ?? TRY_BUDGET_FOR_INVALID_INPUT)
  const elapsedMilliseconds = performance.now() - startTime

  const mismatches: string[] = []
  if (result.kind === 'stoppedOverTryBudget') {
    if (entry.tryCount === null) {
      mismatches.push('reached the solver although the input should have been rejected')
    } else {
      mismatches.push(`stopped after going over the expected ${entry.tryCount} tries`)
    }
    return { entry, result, elapsedMilliseconds, mismatches }
  }
  if (result.kind !== entry.expectedKind) {
    mismatches.push(`kind: expected ${entry.expectedKind}, got ${result.kind}`)
  }
  if (result.outputText !== expectedOutput) {
    mismatches.push(`output differs from the expected section in ${entry.file}`)
  }
  mismatches.push(...compareCounts(entry, result))
  if (result.kind === 'solved' && hasManySolutions(entry)) {
    result.coverage.add('result:solvedWithManySolutions')
  }
  return { entry, result, elapsedMilliseconds, mismatches }
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let isInsideQuotes = false
  for (let position = 0; position < text.length; position++) {
    const character = text[position]
    if (isInsideQuotes) {
      if (character === '"' && text[position + 1] === '"') {
        field += '"'
        position++
      } else if (character === '"') {
        isInsideQuotes = false
      } else {
        field += character
      }
    } else if (character === '"') {
      isInsideQuotes = true
    } else if (character === ',') {
      row.push(field)
      field = ''
    } else if (character === '\n') {
      row.push(field)
      rows.push(row)
      row = []
      field = ''
    } else if (character !== '\r') {
      field += character
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field)
    rows.push(row)
  }
  return rows
}

function optionalNumber(text: string): number | null {
  if (text === '') {
    return null
  }
  return Number(text)
}

export function readManifest(): ManifestEntry[] {
  const [header, ...dataRows] = parseCsv(readFileSync(MANIFEST_PATH, 'utf-8'))
  return dataRows.map(cells => {
    const field = (columnName: string): string => cells[header.indexOf(columnName)]
    return {
      id: field('id'),
      group: field('group'),
      file: field('file'),
      inputFormat: field('inputFormat'),
      blankCount: optionalNumber(field('blankCount')),
      expectedKind: field('expectedKind') as ExpectedKind,
      solutionCount: field('solutionCount'),
      tryCount: optionalNumber(field('tryCount')),
      recordCount: optionalNumber(field('recordCount')),
      restoreCount: optionalNumber(field('restoreCount')),
      rejectCounts: {
        row: optionalNumber(field('rowRejectCount')),
        column: optionalNumber(field('columnRejectCount')),
        box: optionalNumber(field('boxRejectCount')),
      },
      isSlow: field('isSlow') === 'yes',
      description: field('description'),
    }
  })
}

export function findMissingCoverage(verdicts: CaseVerdict[]): CoverageTag[] {
  const reached = new Set<CoverageTag>()
  for (const verdict of verdicts) {
    for (const tag of verdict.result.coverage) {
      reached.add(tag)
    }
  }
  return ALL_COVERAGE_TAGS.filter(tag => !reached.has(tag))
}
