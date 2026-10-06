import { solveByBacktracking } from '../solver/backtrackingSolver.ts'
import type { SolverEvent } from '../solver/solverEvents.ts'
import { applySolverEvent, copySolverProgress, createSolverProgress, type SolverProgress } from '../solver/solverProgress.ts'
import type { Grid } from '../solver/sudokuRules.ts'

export type AllSolutionsMode =
  | 'notStarted'
  | 'autoPlaying'
  | 'pausedAtSolution'
  | 'paused'
  | 'searchingInstantly'
  | 'finished'

export type AllSolutionsState = {
  mode: AllSolutionsMode
  progress: SolverProgress
  keptSolutions: Grid[]
}

export type AllSolutionsListener = (state: AllSolutionsState) => void

export const KEPT_SOLUTION_LIMIT = 100

const MILLISECONDS_PER_SECOND = 1000
const MAXIMUM_FRAME_GAP_MILLISECONDS = 100
const INSTANT_SEARCH_SLICE_MILLISECONDS = 10
const INSTANT_SEARCH_PUBLISH_INTERVAL_MILLISECONDS = 100
const EVENTS_BETWEEN_CLOCK_CHECKS = 1000

function isTry(event: SolverEvent): boolean {
  return event.kind === 'acceptCandidate' || event.kind === 'rejectCandidate'
}

export class AllSolutionsEngine {
  private readonly listener: AllSolutionsListener
  private generator: Generator<SolverEvent, void, undefined> | null = null
  private progress: SolverProgress = createSolverProgress([])
  private keptSolutions: Grid[] = []
  private mode: AllSolutionsMode = 'notStarted'
  private triesPerSecond: number
  private tryBudget = 0
  private lastFrameTime = 0
  private lastPublishTime = 0
  private animationFrameId: number | null = null

  constructor(listener: AllSolutionsListener, triesPerSecond: number) {
    this.listener = listener
    this.triesPerSecond = triesPerSecond
  }

  loadPuzzle(puzzle: Grid) {
    this.cancelAnimation()
    this.generator = solveByBacktracking(puzzle, { findsAllSolutions: true })
    this.progress = createSolverProgress(puzzle)
    this.keptSolutions = []
    this.setModeAndPublish('notStarted')
  }

  setSpeed(triesPerSecond: number) {
    this.triesPerSecond = triesPerSecond
  }

  step() {
    this.cancelAnimation()
    const event = this.advanceToNextVisibleEvent()
    this.setModeAndPublish(this.modeAfterPausingOn(event))
  }

  startAutoPlay() {
    this.cancelAnimation()
    this.tryBudget = 1
    this.lastFrameTime = performance.now()
    this.setModeAndPublish('autoPlaying')
    this.animationFrameId = requestAnimationFrame(frameTime => this.runAutoPlayFrame(frameTime))
  }

  searchInstantly() {
    this.cancelAnimation()
    this.lastPublishTime = performance.now()
    this.setModeAndPublish('searchingInstantly')
    this.animationFrameId = requestAnimationFrame(() => this.runInstantSearchFrame())
  }

  pause() {
    this.cancelAnimation()
    this.setModeAndPublish(this.progress.isFinished ? 'finished' : 'paused')
  }

  dispose() {
    this.cancelAnimation()
  }

  private runAutoPlayFrame(frameTime: number) {
    const elapsedMilliseconds = Math.min(frameTime - this.lastFrameTime, MAXIMUM_FRAME_GAP_MILLISECONDS)
    this.lastFrameTime = frameTime
    this.tryBudget += (this.triesPerSecond * Math.max(elapsedMilliseconds, 0)) / MILLISECONDS_PER_SECOND

    while (this.tryBudget >= 1 && !this.progress.isFinished) {
      const event = this.advanceToNextVisibleEvent()
      this.tryBudget -= 1
      if (event?.kind === 'solutionListed') {
        this.animationFrameId = null
        this.setModeAndPublish('pausedAtSolution')
        return
      }
    }

    if (this.progress.isFinished) {
      this.animationFrameId = null
      this.setModeAndPublish('finished')
      return
    }
    this.publish()
    this.animationFrameId = requestAnimationFrame(nextFrameTime => this.runAutoPlayFrame(nextFrameTime))
  }

  private runInstantSearchFrame() {
    const sliceDeadline = performance.now() + INSTANT_SEARCH_SLICE_MILLISECONDS
    while (!this.progress.isFinished && performance.now() < sliceDeadline) {
      for (let pulledCount = 0; pulledCount < EVENTS_BETWEEN_CLOCK_CHECKS && !this.progress.isFinished; pulledCount++) {
        this.pullNextEvent()
      }
    }

    if (this.progress.isFinished) {
      this.animationFrameId = null
      this.setModeAndPublish('finished')
      return
    }
    const now = performance.now()
    if (now - this.lastPublishTime >= INSTANT_SEARCH_PUBLISH_INTERVAL_MILLISECONDS) {
      this.lastPublishTime = now
      this.publish()
    }
    this.animationFrameId = requestAnimationFrame(() => this.runInstantSearchFrame())
  }

  private advanceToNextVisibleEvent(): SolverEvent | null {
    while (!this.progress.isFinished) {
      const event = this.pullNextEvent()
      if (event === null) {
        return null
      }
      if (isTry(event) || event.kind === 'solutionListed' || event.kind === 'searchExhausted') {
        return event
      }
    }
    return null
  }

  private pullNextEvent(): SolverEvent | null {
    if (this.generator === null) {
      return null
    }
    const result = this.generator.next()
    if (result.done) {
      return null
    }
    applySolverEvent(this.progress, result.value)
    if (result.value.kind === 'solutionListed' && this.keptSolutions.length < KEPT_SOLUTION_LIMIT) {
      this.keptSolutions.push([...this.progress.grid])
    }
    return result.value
  }

  private modeAfterPausingOn(event: SolverEvent | null): AllSolutionsMode {
    if (this.progress.isFinished) {
      return 'finished'
    }
    if (event?.kind === 'solutionListed') {
      return 'pausedAtSolution'
    }
    return 'paused'
  }

  private setModeAndPublish(mode: AllSolutionsMode) {
    this.mode = mode
    this.publish()
  }

  private publish() {
    this.listener({ mode: this.mode, progress: copySolverProgress(this.progress), keptSolutions: [...this.keptSolutions] })
  }

  private cancelAnimation() {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId)
      this.animationFrameId = null
    }
  }
}
