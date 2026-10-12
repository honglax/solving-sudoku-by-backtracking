import { mkdirSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { measureMethod, MAXIMUM_RUN_COUNT, MINIMUM_MEASURED_MILLISECONDS } from '../../website/src/comparison/comparisonMeasurement.ts'
import { COMPARISON_METHODS } from '../../website/src/comparison/comparisonMethods.ts'
import { solveByBacktracking } from '../../website/src/solver/backtrackingSolver.ts'
import { parsePuzzle } from '../../website/src/solver/puzzleParser.ts'
import { findSamplePuzzle } from '../../website/src/solver/samplePuzzles.ts'
import type { Grid } from '../../website/src/solver/sudokuRules.ts'

const MEASURED_PUZZLE_IDS = [3, 4, 5, 10]
const RECURSIVE_METHOD_ID = 'rowMajor:usageFlags'
const OUTPUT_PATH = fileURLToPath(new URL('../data/generator-overhead.csv', import.meta.url))
const CSV_COLUMNS = ['puzzleId', 'tryCount', 'generatorMilliseconds', 'generatorRunCount', 'recursiveMilliseconds', 'recursiveRunCount', 'slowdown']
const MILLISECOND_DECIMALS = 3
const SLOWDOWN_DECIMALS = 1

function readClock(): number {
  return performance.now()
}

function drainGenerator(puzzle: Grid): number {
  let tryCount = 0
  for (const event of solveByBacktracking(puzzle)) {
    if (event.kind === 'acceptCandidate' || event.kind === 'rejectCandidate') {
      tryCount++
    }
  }
  return tryCount
}

function measureGenerator(puzzle: Grid): { tryCount: number; millisecondsPerRun: number; runCount: number } {
  const firstRunStart = readClock()
  const tryCount = drainGenerator(puzzle)
  const firstRunMilliseconds = readClock() - firstRunStart
  if (firstRunMilliseconds >= MINIMUM_MEASURED_MILLISECONDS) {
    return { tryCount, millisecondsPerRun: firstRunMilliseconds, runCount: 1 }
  }
  let runCount = 0
  const repeatedRunsStart = readClock()
  while (readClock() - repeatedRunsStart < MINIMUM_MEASURED_MILLISECONDS && runCount < MAXIMUM_RUN_COUNT) {
    drainGenerator(puzzle)
    runCount++
  }
  return { tryCount, millisecondsPerRun: (readClock() - repeatedRunsStart) / runCount, runCount }
}

const recursiveMethod = COMPARISON_METHODS.find(method => method.id === RECURSIVE_METHOD_ID)
if (recursiveMethod === undefined) {
  throw new Error(`Comparison method ${RECURSIVE_METHOD_ID} is missing`)
}

const rows: string[] = [CSV_COLUMNS.join(',')]
for (const puzzleId of MEASURED_PUZZLE_IDS) {
  const parseResult = parsePuzzle(findSamplePuzzle(puzzleId).puzzle)
  if (!parseResult.ok) {
    throw new Error(`Sample puzzle ${puzzleId} does not parse`)
  }
  const generator = measureGenerator(parseResult.grid)
  const recursive = measureMethod(parseResult.grid, recursiveMethod, readClock)
  if (generator.tryCount !== recursive.counts.tryCount) {
    throw new Error(`Puzzle ${puzzleId}: generator tried ${generator.tryCount} times, recursion ${recursive.counts.tryCount}`)
  }
  const slowdown = generator.millisecondsPerRun / recursive.millisecondsPerRun
  rows.push(
    [
      puzzleId,
      generator.tryCount,
      generator.millisecondsPerRun.toFixed(MILLISECOND_DECIMALS),
      generator.runCount,
      recursive.millisecondsPerRun.toFixed(MILLISECOND_DECIMALS),
      recursive.runCount,
      slowdown.toFixed(SLOWDOWN_DECIMALS),
    ].join(','),
  )
  console.log(`puzzle ${puzzleId}: ${generator.tryCount} tries, generator ${generator.millisecondsPerRun.toFixed(2)} ms, recursion ${recursive.millisecondsPerRun.toFixed(2)} ms, x${slowdown.toFixed(1)}`)
}
mkdirSync(fileURLToPath(new URL('../data/', import.meta.url)), { recursive: true })
writeFileSync(OUTPUT_PATH, rows.join('\n') + '\n')
console.log('-> report/data/generator-overhead.csv')
