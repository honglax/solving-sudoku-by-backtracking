import { solveByBacktracking, type CellOrder } from '../solver/backtrackingSolver.ts'
import type { SolverEvent } from '../solver/solverEvents.ts'
import { applySolverEvent, copySolverProgress, createSolverProgress, type SolverProgress } from '../solver/solverProgress.ts'
import type { Grid } from '../solver/sudokuRules.ts'

export type RaceMode = 'notStarted' | 'running' | 'paused' | 'finished'

export type RaceLane = {
  cellOrder: CellOrder
  progress: SolverProgress
}

export type RaceListener = {
  onLanesChange: (lanes: RaceLane[]) => void
  onModeChange: (mode: RaceMode) => void
}

type LaneSession = {
  cellOrder: CellOrder
  generator: Generator<SolverEvent, void, undefined>
  progress: SolverProgress
}

const MILLISECONDS_PER_SECOND = 1000
const MAXIMUM_FRAME_GAP_MILLISECONDS = 100

export class RaceEngine {
  private readonly listener: RaceListener
  private readonly cellOrders: CellOrder[]
  private lanes: LaneSession[] = []
  private triesPerSecond: number
  private tryBudget = 0
  private lastFrameTime = 0
  private animationFrameId: number | null = null

  constructor(listener: RaceListener, cellOrders: CellOrder[], triesPerSecond: number) {
    this.listener = listener
    this.cellOrders = cellOrders
    this.triesPerSecond = triesPerSecond
  }

  loadPuzzle(puzzle: Grid) {
    this.cancelAnimation()
    this.lanes = this.cellOrders.map(cellOrder => ({
      cellOrder,
      generator: solveByBacktracking(puzzle, { cellOrder }),
      progress: createSolverProgress(puzzle),
    }))
    this.publishLanes()
    this.listener.onModeChange('notStarted')
  }

  setSpeed(triesPerSecond: number) {
    this.triesPerSecond = triesPerSecond
  }

  step() {
    this.cancelAnimation()
    this.advanceEveryLaneByOneTry()
    this.publishLanes()
    this.listener.onModeChange(this.isFinished() ? 'finished' : 'paused')
  }

  start() {
    this.cancelAnimation()
    this.tryBudget = 1
    this.lastFrameTime = performance.now()
    this.listener.onModeChange('running')
    this.animationFrameId = requestAnimationFrame(frameTime => this.runFrame(frameTime))
  }

  pause() {
    this.cancelAnimation()
    this.listener.onModeChange('paused')
  }

  dispose() {
    this.cancelAnimation()
  }

  private runFrame(frameTime: number) {
    const elapsedMilliseconds = Math.min(frameTime - this.lastFrameTime, MAXIMUM_FRAME_GAP_MILLISECONDS)
    this.lastFrameTime = frameTime
    this.tryBudget += (this.triesPerSecond * Math.max(elapsedMilliseconds, 0)) / MILLISECONDS_PER_SECOND

    while (this.tryBudget >= 1 && !this.isFinished()) {
      this.advanceEveryLaneByOneTry()
      this.tryBudget -= 1
    }

    this.publishLanes()
    if (this.isFinished()) {
      this.animationFrameId = null
      this.listener.onModeChange('finished')
      return
    }
    this.animationFrameId = requestAnimationFrame(nextFrameTime => this.runFrame(nextFrameTime))
  }

  private advanceEveryLaneByOneTry() {
    for (const lane of this.lanes) {
      this.advanceLaneByOneTry(lane)
    }
  }

  private advanceLaneByOneTry(lane: LaneSession) {
    while (!lane.progress.isFinished) {
      const result = lane.generator.next()
      if (result.done) {
        return
      }
      applySolverEvent(lane.progress, result.value)
      const isTry = result.value.kind === 'acceptCandidate' || result.value.kind === 'rejectCandidate'
      if (isTry) {
        return
      }
    }
  }

  private isFinished(): boolean {
    return this.lanes.every(lane => lane.progress.isFinished)
  }

  private publishLanes() {
    this.listener.onLanesChange(this.lanes.map(lane => ({ cellOrder: lane.cellOrder, progress: copySolverProgress(lane.progress) })))
  }

  private cancelAnimation() {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId)
      this.animationFrameId = null
    }
  }
}
