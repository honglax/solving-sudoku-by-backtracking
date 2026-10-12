import { mkdirSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { measureMethod } from '../../website/src/comparison/comparisonMeasurement.ts'
import { COMPARISON_METHODS } from '../../website/src/comparison/comparisonMethods.ts'
import { parsePuzzle } from '../../website/src/solver/puzzleParser.ts'
import { findSamplePuzzle } from '../../website/src/solver/samplePuzzles.ts'

const MEASURED_PUZZLE_IDS = [3, 4, 5, 10, 11, 12]
const OUTPUT_PATH = fileURLToPath(new URL('../data/comparison-measurements.csv', import.meta.url))
const CSV_COLUMNS = ['puzzleId', 'methodId', 'tryCount', 'checkReadCount', 'cellChoiceReadCount', 'millisecondsPerRun', 'runCount']
const MILLISECOND_DECIMALS = 3

function readClock(): number {
  return performance.now()
}

const rows: string[] = [CSV_COLUMNS.join(',')]
for (const puzzleId of MEASURED_PUZZLE_IDS) {
  const parseResult = parsePuzzle(findSamplePuzzle(puzzleId).puzzle)
  if (!parseResult.ok) {
    throw new Error(`Sample puzzle ${puzzleId} does not parse`)
  }
  for (const method of COMPARISON_METHODS) {
    const measurement = measureMethod(parseResult.grid, method, readClock)
    const { counts } = measurement
    rows.push(
      [
        puzzleId,
        method.id,
        counts.tryCount,
        counts.checkReadCount,
        counts.cellChoiceReadCount,
        measurement.millisecondsPerRun.toFixed(MILLISECOND_DECIMALS),
        measurement.runCount,
      ].join(','),
    )
    console.log(`puzzle ${puzzleId} ${method.id}: ${counts.tryCount} tries, ${measurement.millisecondsPerRun.toFixed(2)} ms x ${measurement.runCount}`)
  }
}
mkdirSync(fileURLToPath(new URL('../data/', import.meta.url)), { recursive: true })
writeFileSync(OUTPUT_PATH, rows.join('\n') + '\n')
console.log('-> report/data/comparison-measurements.csv')
