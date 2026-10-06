import { describe, expect, it } from 'vitest'
import { solveByBacktracking } from '../../../src/solver/backtrackingSolver.ts'
import { parsePuzzle } from '../../../src/solver/puzzleParser.ts'
import { findSamplePuzzle } from '../../../src/solver/samplePuzzles.ts'
import { SolverHistory } from '../../../src/solver/solverHistory.ts'
import { applySolverEvent, copySolverProgress, createSolverProgress, isVisibleStep, type SolverProgress } from '../../../src/solver/solverProgress.ts'
import type { Grid } from '../../../src/solver/sudokuRules.ts'

function samplePuzzle(sampleId: number): Grid {
  const parseResult = parsePuzzle(findSamplePuzzle(sampleId).puzzle)
  if (!parseResult.ok) {
    throw new Error(`Sample puzzle ${sampleId} does not parse`)
  }
  return parseResult.grid
}

type ForwardRun = {
  live: SolverProgress
  history: SolverHistory
  snapshotsAfterEachEvent: SolverProgress[]
}

function runForward(puzzle: Grid, stopAfterTry: number, stepCapacity?: number): ForwardRun {
  const live = createSolverProgress(puzzle)
  const history = new SolverHistory(stepCapacity)
  const snapshotsAfterEachEvent: SolverProgress[] = [copySolverProgress(live)]
  for (const event of solveByBacktracking(puzzle)) {
    history.recordBeforeApplying(live, event)
    applySolverEvent(live, event)
    snapshotsAfterEachEvent.push(copySolverProgress(live))
    if (live.tryCount === stopAfterTry) {
      break
    }
  }
  return { live, history, snapshotsAfterEachEvent }
}

describe('SolverHistory', () => {
  it('going back k events gives exactly the state the solver had k events earlier', () => {
    const { live, history, snapshotsAfterEachEvent } = runForward(samplePuzzle(3), 900)
    const newestSnapshotIndex = snapshotsAfterEachEvent.length - 1
    expect(history.eventCount).toBe(300)

    for (let eventsBack = 1; eventsBack <= history.eventCount; eventsBack++) {
      const reviewed = copySolverProgress(live)
      history.undoEvents(reviewed, eventsBack)
      expect(reviewed).toEqual(snapshotsAfterEachEvent[newestSnapshotIndex - eventsBack])
    }
  })

  it('lists the last 100 visible steps, newest first, with the try count after each', () => {
    const { live, history, snapshotsAfterEachEvent } = runForward(samplePuzzle(3), 900)
    const steps = history.visibleSteps(live.tryCount)
    const newestSnapshotIndex = snapshotsAfterEachEvent.length - 1

    expect(steps).toHaveLength(100)
    expect(steps[0].eventsBack).toBe(0)
    for (const step of steps) {
      expect(isVisibleStep(step.event)).toBe(true)
      expect(step.tryCount).toBe(snapshotsAfterEachEvent[newestSnapshotIndex - step.eventsBack].tryCount)
      expect(snapshotsAfterEachEvent[newestSnapshotIndex - step.eventsBack].lastEvent).toBe(step.event)
    }
  })

  it('works across the end of a solve, including the final solution step', () => {
    const { live, history, snapshotsAfterEachEvent } = runForward(samplePuzzle(3), Number.POSITIVE_INFINITY)
    expect(live.lastEvent?.kind).toBe('solutionFound')
    const steps = history.visibleSteps(live.tryCount)
    expect(steps[0].event.kind).toBe('solutionFound')

    const reviewed = copySolverProgress(live)
    history.undoEvents(reviewed, steps[5].eventsBack)
    expect(reviewed).toEqual(snapshotsAfterEachEvent[snapshotsAfterEachEvent.length - 1 - steps[5].eventsBack])
    expect(reviewed.isFinished).toBe(false)
  })

  it('never goes back further than it stored', () => {
    const { live, history } = runForward(samplePuzzle(3), 900, 5)
    const reviewed = copySolverProgress(live)
    history.undoEvents(reviewed, 1000)
    expect(live.tryCount - reviewed.tryCount).toBeLessThanOrEqual(15)
    expect(history.visibleSteps(live.tryCount).length).toBeLessThanOrEqual(5)
  })

  it('forgets everything after clear', () => {
    const { live, history } = runForward(samplePuzzle(3), 50)
    history.clear()
    expect(history.eventCount).toBe(0)
    expect(history.visibleSteps(live.tryCount)).toEqual([])
  })
})
