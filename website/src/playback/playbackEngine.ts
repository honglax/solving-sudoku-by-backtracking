import { solveByBacktracking } from '../solver/backtrackingSolver.ts'
import type { SolverEvent } from '../solver/solverEvents.ts'
import { SolverHistory, type HistoryStep } from '../solver/solverHistory.ts'
import {
  applySolverEvent,
  copySolverProgress,
  createSolverProgress,
  isVisibleStep,
  type SolverProgress,
} from '../solver/solverProgress.ts'
import type { Grid } from '../solver/sudokuRules.ts'
import { DEFAULT_TRIES_PER_SECOND } from '../solverView/speed.ts'

export type PlaybackMode =
  | 'notStarted'
  | 'paused'
  | 'autoPlaying'
  | 'pausedAtFirstBacktrack'
  | 'solvingInstantly'
  | 'instantSolvePaused'
  | 'finished'

export type HistoryView = {
  steps: HistoryStep[]
  reviewEventsBack: number
  newestSequence: number
  storedEventCount: number
}

export type PlaybackListener = {
  onProgressChange: (progress: SolverProgress | null) => void
  onModeChange: (mode: PlaybackMode) => void
  onLongInstantSolveChange: (isLongInstantSolve: boolean) => void
  onHistoryChange: (historyView: HistoryView) => void
}

const EMPTY_HISTORY_VIEW: HistoryView = { steps: [], reviewEventsBack: 0, newestSequence: 0, storedEventCount: 0 }

type PlaybackSession = {
  generator: Generator<SolverEvent, void, undefined>
  progress: SolverProgress
}

const MILLISECONDS_PER_SECOND = 1000
const MAXIMUM_FRAME_GAP_MILLISECONDS = 100
const INSTANT_SOLVE_SLICE_MILLISECONDS = 10
const INSTANT_SOLVE_PUBLISH_INTERVAL_MILLISECONDS = 100
const LONG_INSTANT_SOLVE_THRESHOLD_MILLISECONDS = 300
const EVENTS_BETWEEN_CLOCK_CHECKS = 1000

export class PlaybackEngine {
  private readonly listener: PlaybackListener
  private puzzle: Grid = []
  private session: PlaybackSession | null = null
  private animationFrameId: number | null = null
  private triesPerSecond = DEFAULT_TRIES_PER_SECOND
  private stepBudget = 0
  private lastFrameTime = 0
  private instantSolveStartTime = 0
  private lastPublishTime = 0
  private isLongInstantSolve = false
  private mode: PlaybackMode = 'notStarted'
  private readonly history = new SolverHistory()
  private reviewEventsBack = 0
  private isStoppingAtNextBacktrack = false
  private hasPausedAtFirstBacktrack = false

  constructor(listener: PlaybackListener) {
    this.listener = listener
  }

  loadPuzzle(puzzle: Grid) {
    this.cancelAnimation()
    this.puzzle = [...puzzle]
    this.session = null
    this.history.clear()
    this.reviewEventsBack = 0
    this.isStoppingAtNextBacktrack = false
    this.hasPausedAtFirstBacktrack = false
    this.setLongInstantSolve(false)
    this.listener.onProgressChange(null)
    this.listener.onHistoryChange(EMPTY_HISTORY_VIEW)
    this.setMode('notStarted')
  }

  reset() {
    this.loadPuzzle(this.puzzle)
  }

  setSpeed(triesPerSecond: number) {
    this.triesPerSecond = triesPerSecond
  }

  step() {
    this.cancelAnimation()
    const session = this.ensureSession()
    if (this.reviewEventsBack > 0) {
      this.reviewEventsBack -= 1
      this.publishProgress(session)
      this.finishOrSetMode(session, 'paused')
      return
    }
    this.pullNextEvent(session)
    this.publishProgress(session)
    this.finishOrSetMode(session, 'paused')
  }

  startAutoPlay() {
    this.cancelAnimation()
    this.returnToLatestWithoutPublishing()
    this.ensureSession()
    this.stepBudget = 1
    this.lastFrameTime = performance.now()
    this.setMode('autoPlaying')
    this.animationFrameId = requestAnimationFrame(frameTime => this.runAutoPlayFrame(frameTime))
  }

  pauseAutoPlay() {
    this.cancelAnimation()
    this.setMode('paused')
  }

  solveInstantly() {
    this.runInstantly(false)
  }

  jumpToNextBacktrack() {
    this.runInstantly(true)
  }

  stepBack() {
    if (this.reviewEventsBack < this.history.eventCount) {
      this.reviewStep(this.reviewEventsBack + 1)
    }
  }

  private runInstantly(isStoppingAtNextBacktrack: boolean) {
    this.cancelAnimation()
    this.returnToLatestWithoutPublishing()
    this.isStoppingAtNextBacktrack = isStoppingAtNextBacktrack
    this.ensureSession()
    this.instantSolveStartTime = performance.now()
    this.lastPublishTime = this.instantSolveStartTime
    this.setLongInstantSolve(false)
    this.setMode('solvingInstantly')
    this.animationFrameId = requestAnimationFrame(() => this.runInstantSolveFrame())
  }

  stopInstantSolve() {
    this.cancelAnimation()
    const session = this.ensureSession()
    this.publishProgress(session)
    this.setLongInstantSolve(false)
    this.setMode('instantSolvePaused')
  }

  reviewStep(eventsBack: number) {
    const session = this.ensureSession()
    this.pauseRunningPlayback(session)
    this.reviewEventsBack = Math.min(eventsBack, this.history.eventCount)
    this.publishProgress(session)
  }

  reviewSequence(sequence: number) {
    this.reviewStep(this.history.newestSequence - sequence)
  }

  reviewOlderStep() {
    const olderStep = this.currentHistorySteps().find(step => step.eventsBack > this.reviewEventsBack)
    if (olderStep !== undefined) {
      this.reviewStep(olderStep.eventsBack)
    }
  }

  reviewNewerStep() {
    const newerSteps = this.currentHistorySteps().filter(step => step.eventsBack < this.reviewEventsBack)
    const nearestNewerStep = newerSteps[newerSteps.length - 1]
    this.reviewStep(nearestNewerStep === undefined ? 0 : nearestNewerStep.eventsBack)
  }

  returnToLatest() {
    this.reviewStep(0)
  }

  dispose() {
    this.cancelAnimation()
  }

  private runAutoPlayFrame(frameTime: number) {
    const session = this.ensureSession()
    const elapsedMilliseconds = Math.min(frameTime - this.lastFrameTime, MAXIMUM_FRAME_GAP_MILLISECONDS)
    this.lastFrameTime = frameTime
    this.stepBudget += (this.triesPerSecond * Math.max(elapsedMilliseconds, 0)) / MILLISECONDS_PER_SECOND

    while (this.stepBudget >= 1 && !session.progress.isFinished) {
      this.pullUntilVisibleStep(session)
      this.stepBudget -= 1
      if (this.hasJustReachedFirstBacktrack(session)) {
        this.hasPausedAtFirstBacktrack = true
        this.cancelAnimation()
        this.publishProgress(session)
        this.setMode('pausedAtFirstBacktrack')
        return
      }
    }

    this.publishProgress(session)
    if (session.progress.isFinished) {
      this.finishOrSetMode(session, 'autoPlaying')
      return
    }
    this.animationFrameId = requestAnimationFrame(nextFrameTime => this.runAutoPlayFrame(nextFrameTime))
  }

  private runInstantSolveFrame() {
    const session = this.ensureSession()
    const sliceDeadline = performance.now() + INSTANT_SOLVE_SLICE_MILLISECONDS

    let hasReachedBacktrack = false
    while (!session.progress.isFinished && !hasReachedBacktrack && performance.now() < sliceDeadline) {
      for (let pulledCount = 0; pulledCount < EVENTS_BETWEEN_CLOCK_CHECKS; pulledCount++) {
        const event = this.pullNextEvent(session)
        if (event === null) {
          break
        }
        if (this.isStoppingAtNextBacktrack && event.kind === 'restoreState') {
          hasReachedBacktrack = true
          break
        }
      }
    }

    if (hasReachedBacktrack) {
      this.isStoppingAtNextBacktrack = false
      this.publishProgress(session)
      this.setLongInstantSolve(false)
      this.setMode('paused')
      return
    }

    const now = performance.now()
    if (session.progress.isFinished) {
      this.publishProgress(session)
      this.setLongInstantSolve(false)
      this.finishOrSetMode(session, 'solvingInstantly')
      return
    }
    if (now - this.instantSolveStartTime >= LONG_INSTANT_SOLVE_THRESHOLD_MILLISECONDS) {
      this.setLongInstantSolve(true)
    }
    if (now - this.lastPublishTime >= INSTANT_SOLVE_PUBLISH_INTERVAL_MILLISECONDS) {
      this.lastPublishTime = now
      this.publishProgress(session)
    }
    this.animationFrameId = requestAnimationFrame(() => this.runInstantSolveFrame())
  }

  private ensureSession(): PlaybackSession {
    if (this.session === null) {
      this.session = {
        generator: solveByBacktracking(this.puzzle),
        progress: createSolverProgress(this.puzzle),
      }
    }
    return this.session
  }

  private pullNextEvent(session: PlaybackSession): SolverEvent | null {
    const result = session.generator.next()
    if (result.done) {
      return null
    }
    this.history.recordBeforeApplying(session.progress, result.value)
    applySolverEvent(session.progress, result.value)
    return result.value
  }

  private hasJustReachedFirstBacktrack(session: PlaybackSession): boolean {
    const isFirstBacktrack = session.progress.restoreCount === 1 && session.progress.lastEvent?.kind === 'restoreState'
    return isFirstBacktrack && !this.hasPausedAtFirstBacktrack
  }

  private currentHistorySteps(): HistoryStep[] {
    if (this.session === null) {
      return []
    }
    return this.history.visibleSteps(this.session.progress.tryCount)
  }

  private returnToLatestWithoutPublishing() {
    this.reviewEventsBack = 0
  }

  private pauseRunningPlayback(session: PlaybackSession) {
    if (this.mode === 'autoPlaying') {
      this.cancelAnimation()
      this.setMode('paused')
    }
    if (this.mode === 'solvingInstantly') {
      this.cancelAnimation()
      this.setLongInstantSolve(false)
      this.finishOrSetMode(session, 'paused')
    }
  }

  private setMode(mode: PlaybackMode) {
    this.mode = mode
    this.listener.onModeChange(mode)
  }

  private pullUntilVisibleStep(session: PlaybackSession) {
    let event = this.pullNextEvent(session)
    while (event !== null && !isVisibleStep(event)) {
      event = this.pullNextEvent(session)
    }
  }

  private publishProgress(session: PlaybackSession) {
    const shownProgress = copySolverProgress(session.progress)
    if (this.reviewEventsBack > 0) {
      this.history.undoEvents(shownProgress, this.reviewEventsBack)
    }
    this.listener.onProgressChange(shownProgress)
    this.listener.onHistoryChange({
      steps: this.currentHistorySteps(),
      reviewEventsBack: this.reviewEventsBack,
      newestSequence: this.history.newestSequence,
      storedEventCount: this.history.eventCount,
    })
  }

  private finishOrSetMode(session: PlaybackSession, modeWhileUnfinished: PlaybackMode) {
    if (session.progress.isFinished) {
      this.cancelAnimation()
      this.setMode('finished')
    } else {
      this.setMode(modeWhileUnfinished)
    }
  }

  private setLongInstantSolve(isLongInstantSolve: boolean) {
    if (this.isLongInstantSolve !== isLongInstantSolve) {
      this.isLongInstantSolve = isLongInstantSolve
      this.listener.onLongInstantSolveChange(isLongInstantSolve)
    }
  }

  private cancelAnimation() {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId)
      this.animationFrameId = null
    }
  }
}
