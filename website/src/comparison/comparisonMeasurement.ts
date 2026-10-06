import type { Grid } from '../solver/sudokuRules.ts'
import type { ComparisonMethodId } from './comparisonMethods.ts'
import { solveForComparison, type ComparisonCounts, type ComparisonMethod } from './comparisonSolver.ts'

export const MINIMUM_MEASURED_MILLISECONDS = 300
export const MAXIMUM_RUN_COUNT = 10_000

export type MethodMeasurement = {
  counts: ComparisonCounts
  millisecondsPerRun: number
  runCount: number
}

export type MeasurementRequest = {
  puzzle: Grid
  methodIds: ComparisonMethodId[]
}

export type MeasurementMessage =
  | { kind: 'methodStarted'; methodId: ComparisonMethodId }
  | { kind: 'methodMeasured'; methodId: ComparisonMethodId; measurement: MethodMeasurement }
  | { kind: 'allMeasured' }

export function measureMethod(puzzle: Grid, method: ComparisonMethod, readClock: () => number): MethodMeasurement {
  const firstRunStart = readClock()
  const firstRun = solveForComparison(puzzle, method)
  const firstRunMilliseconds = readClock() - firstRunStart
  if (firstRunMilliseconds >= MINIMUM_MEASURED_MILLISECONDS) {
    return { counts: firstRun.counts, millisecondsPerRun: firstRunMilliseconds, runCount: 1 }
  }

  let runCount = 0
  const repeatedRunsStart = readClock()
  while (readClock() - repeatedRunsStart < MINIMUM_MEASURED_MILLISECONDS && runCount < MAXIMUM_RUN_COUNT) {
    solveForComparison(puzzle, method)
    runCount++
  }
  const repeatedRunsMilliseconds = readClock() - repeatedRunsStart
  return { counts: firstRun.counts, millisecondsPerRun: repeatedRunsMilliseconds / runCount, runCount }
}
