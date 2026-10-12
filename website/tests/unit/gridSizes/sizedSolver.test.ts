import { describe, expect, it } from 'vitest'
import expectedSized from '../../../../checks/expected_sized.json'
import { parseSizedPuzzle, sizedGridToString } from '../../../src/gridSizes/sizedPuzzleParser.ts'
import { applySizedEvent, createSizedProgress, type SizedProgress } from '../../../src/gridSizes/sizedProgress.ts'
import { shapeOf, type GridShape, type SizedGrid } from '../../../src/gridSizes/sizedRules.ts'
import { SIZED_SAMPLE_PUZZLES, findSizedSamplePuzzle } from '../../../src/gridSizes/sizedSamplePuzzles.ts'
import { solveSizedBacktracking } from '../../../src/gridSizes/sizedSolver.ts'
import { solveByBacktracking } from '../../../src/solver/backtrackingSolver.ts'
import { parsePuzzle } from '../../../src/solver/puzzleParser.ts'
import { findSamplePuzzle } from '../../../src/solver/samplePuzzles.ts'
import { applySolverEvent, createSolverProgress } from '../../../src/solver/solverProgress.ts'

function parseOrFail(text: string, shape: GridShape): SizedGrid {
  const result = parseSizedPuzzle(text, shape)
  if (!result.ok) {
    throw new Error(`Puzzle does not parse: ${JSON.stringify(result.error)}`)
  }
  return result.grid
}

function runToEnd(shape: GridShape, puzzle: SizedGrid): SizedProgress {
  const progress = createSizedProgress(puzzle)
  for (const event of solveSizedBacktracking(shape, puzzle)) {
    applySizedEvent(shape, progress, event)
  }
  return progress
}

describe('the sized solver follows model 1 on every sample puzzle', () => {
  for (const sample of SIZED_SAMPLE_PUZZLES) {
    const shape = shapeOf(sample.boxSize)
    it(`sample ${sample.id} (${shape.size}x${shape.size}) matches the Python reference counts`, () => {
      const progress = runToEnd(shape, parseOrFail(sample.puzzle, shape))
      expect({ tryCount: progress.tryCount, recordCount: progress.recordCount, restoreCount: progress.restoreCount }).toEqual(sample.measured)
    })
  }

  for (const expected of expectedSized.puzzles) {
    const sample = findSizedSamplePuzzle(expected.id)
    const shape = shapeOf(sample.boxSize)
    it(`sample ${expected.id} gives the reference outcome and first solution`, () => {
      const progress = runToEnd(shape, parseOrFail(sample.puzzle, shape))
      expect(progress.outcome).toBe(expected.solution === null ? 'noSolution' : 'solved')
      if (expected.solution !== null) {
        expect(sizedGridToString(progress.grid)).toBe(expected.solution)
      }
    })
  }

  it('keeps the sample data in step with the reference file', () => {
    expect(expectedSized.puzzles.map(item => item.id)).toEqual(SIZED_SAMPLE_PUZZLES.map(sample => sample.id))
    for (const expected of expectedSized.puzzles) {
      const sample = findSizedSamplePuzzle(expected.id)
      expect(sample.measured).toEqual({ tryCount: expected.tryCount, recordCount: expected.recordCount, restoreCount: expected.restoreCount })
      expect(sample.solutionCount).toBe(expected.solutionCount)
    }
  })
})

describe('the sized solver agrees with the 9x9 solver of the main page', () => {
  for (const sampleId of [1, 2, 3, 4, 8, 9, 10, 13]) {
    it(`gives identical events on 9x9 sample ${sampleId}`, () => {
      const nineShape = shapeOf(3)
      const mainSample = findSamplePuzzle(sampleId)
      const mainParse = parsePuzzle(mainSample.puzzle)
      if (!mainParse.ok) {
        throw new Error('Main sample does not parse')
      }
      const mainProgress = createSolverProgress(mainParse.grid)
      const mainEvents = solveByBacktracking(mainParse.grid)
      const sizedGrid = parseOrFail(mainSample.puzzle, nineShape)
      const sizedEvents = solveSizedBacktracking(nineShape, sizedGrid)
      let eventCount = 0
      for (;;) {
        const mainStep = mainEvents.next()
        const sizedStep = sizedEvents.next()
        expect(sizedStep.done).toBe(mainStep.done)
        if (mainStep.done === true || sizedStep.done === true) {
          break
        }
        expect(sizedStep.value).toEqual(mainStep.value)
        applySolverEvent(mainProgress, mainStep.value)
        eventCount++
      }
      expect(eventCount).toBeGreaterThan(0)
    })
  }
})
