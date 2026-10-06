import { mkdirSync, writeFileSync } from 'node:fs'
import {
  findMissingCoverage,
  readManifest,
  TESTCASES_DIRECTORY,
  verifyCase,
  type CaseVerdict,
} from './testcaseRunner.ts'

const INCLUDE_SLOW_FLAG = '--include-slow'
const RESULTS_DIRECTORY = `${TESTCASES_DIRECTORY}results/`
const RESULTS_FILE_NAME = 'results.csv'
const RESULTS_PATH = `${RESULTS_DIRECTORY}${RESULTS_FILE_NAME}`
const MILLISECOND_DECIMALS = 1
const GROUP_COLUMN_WIDTH = 12
const NUMBER_COLUMN_WIDTH = 10

function median(values: number[]): number {
  const sorted = [...values].sort((first, second) => first - second)
  const middle = Math.floor(sorted.length / 2)
  if (sorted.length % 2 === 0) {
    return (sorted[middle - 1] + sorted[middle]) / 2
  }
  return sorted[middle]
}

function formatMilliseconds(value: number): string {
  return value.toFixed(MILLISECOND_DECIMALS)
}

function printGroupSummary(verdicts: CaseVerdict[]) {
  const groups = [...new Set(verdicts.map(verdict => verdict.entry.group))]
  const columns = ['Cases', 'Passed', 'Failed', 'Median ms', 'Max ms']
  console.log('Group'.padEnd(GROUP_COLUMN_WIDTH) + columns.map(column => column.padStart(NUMBER_COLUMN_WIDTH)).join(''))
  for (const group of [...groups, 'total']) {
    const groupVerdicts = group === 'total' ? verdicts : verdicts.filter(verdict => verdict.entry.group === group)
    const failedCount = groupVerdicts.filter(verdict => verdict.mismatches.length > 0).length
    const times = groupVerdicts.map(verdict => verdict.elapsedMilliseconds)
    const cells = [
      String(groupVerdicts.length),
      String(groupVerdicts.length - failedCount),
      String(failedCount),
      formatMilliseconds(median(times)),
      formatMilliseconds(Math.max(...times)),
    ]
    console.log(group.padEnd(GROUP_COLUMN_WIDTH) + cells.map(cell => cell.padStart(NUMBER_COLUMN_WIDTH)).join(''))
  }
}

function writeResultsCsv(verdicts: CaseVerdict[]) {
  const header = ['id', 'group', 'status', 'expectedKind', 'actualKind', 'tryCount', 'recordCount', 'restoreCount', 'milliseconds']
  const rows = verdicts.map(({ entry, result, elapsedMilliseconds, mismatches }) => [
    entry.id,
    entry.group,
    mismatches.length === 0 ? 'passed' : 'failed',
    entry.expectedKind,
    result.kind,
    result.tryCount ?? '',
    result.recordCount ?? '',
    result.restoreCount ?? '',
    formatMilliseconds(elapsedMilliseconds),
  ])
  mkdirSync(RESULTS_DIRECTORY, { recursive: true })
  writeFileSync(RESULTS_PATH, [header, ...rows].map(row => row.join(',')).join('\n') + '\n')
}

function main() {
  const includeSlowCases = process.argv.includes(INCLUDE_SLOW_FLAG)
  const manifest = readManifest()
  const selectedEntries = manifest.filter(entry => includeSlowCases || !entry.isSlow)
  const skippedCount = manifest.length - selectedEntries.length

  const verdicts: CaseVerdict[] = []
  for (const entry of selectedEntries) {
    verdicts.push(verifyCase(entry))
  }

  printGroupSummary(verdicts)
  if (skippedCount > 0) {
    console.log(`\nSkipped ${skippedCount} slow case(s); run with ${INCLUDE_SLOW_FLAG} to include them.`)
  }

  const failedVerdicts = verdicts.filter(verdict => verdict.mismatches.length > 0)
  for (const { entry, mismatches } of failedVerdicts) {
    console.log(`\nFAILED ${entry.id} in ${entry.file}: ${entry.description}`)
    for (const mismatch of mismatches) {
      console.log(`  - ${mismatch}`)
    }
  }

  const missingCoverage = findMissingCoverage(verdicts)
  if (missingCoverage.length === 0) {
    console.log('\nCoverage: every tracked behaviour is reached by at least one case.')
  } else {
    console.log(`\nCoverage missing: ${missingCoverage.join(', ')}`)
  }

  writeResultsCsv(verdicts)
  console.log(`Results written to testcases/results/${RESULTS_FILE_NAME}`)
  if (failedVerdicts.length > 0 || missingCoverage.length > 0) {
    process.exitCode = 1
  }
}

main()
