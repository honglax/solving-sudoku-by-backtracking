import { isVisibleStep, type SolverProgress } from './solverProgress.ts'
import type { SolverEvent } from './solverEvents.ts'
import { cellIndex, EMPTY } from './sudokuRules.ts'

export const HISTORY_STEP_COUNT = 100
const MOST_EVENTS_PER_VISIBLE_STEP = 3

type HistoryEntry = {
  sequence: number
  event: SolverEvent | null
  currentIndexBefore: number
  lastEventBefore: SolverEvent | null
  lastMessageEventBefore: SolverEvent | null
  lastPseudocodeEventBefore: SolverEvent | null
  isFinishedBefore: boolean
}

export type HistoryStep = {
  sequence: number
  eventsBack: number
  event: SolverEvent
  tryCount: number
}

function createEmptyEntry(): HistoryEntry {
  return {
    sequence: 0,
    event: null,
    currentIndexBefore: 0,
    lastEventBefore: null,
    lastMessageEventBefore: null,
    lastPseudocodeEventBefore: null,
    isFinishedBefore: false,
  }
}

export class SolverHistory {
  private readonly entries: HistoryEntry[]
  private newestPosition = -1
  private storedEventCount = 0
  private recordedEventTotal = 0
  private readonly stepCapacity: number

  constructor(stepCapacity: number = HISTORY_STEP_COUNT) {
    this.stepCapacity = stepCapacity
    this.entries = Array.from({ length: stepCapacity * MOST_EVENTS_PER_VISIBLE_STEP }, createEmptyEntry)
  }

  get eventCount(): number {
    return this.storedEventCount
  }

  get newestSequence(): number {
    return this.recordedEventTotal
  }

  clear() {
    this.newestPosition = -1
    this.storedEventCount = 0
  }

  recordBeforeApplying(progress: SolverProgress, event: SolverEvent) {
    this.newestPosition = (this.newestPosition + 1) % this.entries.length
    this.storedEventCount = Math.min(this.storedEventCount + 1, this.entries.length)
    this.recordedEventTotal += 1
    const entry = this.entries[this.newestPosition]
    entry.sequence = this.recordedEventTotal
    entry.event = event
    entry.currentIndexBefore = progress.currentIndex
    entry.lastEventBefore = progress.lastEvent
    entry.lastMessageEventBefore = progress.lastMessageEvent
    entry.lastPseudocodeEventBefore = progress.lastPseudocodeEvent
    entry.isFinishedBefore = progress.isFinished
  }

  undoEvents(progress: SolverProgress, eventsToUndo: number) {
    const undoCount = Math.min(eventsToUndo, this.storedEventCount)
    for (let eventsBack = 0; eventsBack < undoCount; eventsBack++) {
      this.undoEntry(progress, this.entryAt(eventsBack))
    }
  }

  visibleSteps(currentTryCount: number): HistoryStep[] {
    const steps: HistoryStep[] = []
    let tryCountAfterEvent = currentTryCount
    for (let eventsBack = 0; eventsBack < this.storedEventCount && steps.length < this.stepCapacity; eventsBack++) {
      const entry = this.entryAt(eventsBack)
      const event = entry.event
      if (event === null) {
        break
      }
      if (isVisibleStep(event)) {
        steps.push({ sequence: entry.sequence, eventsBack, event, tryCount: tryCountAfterEvent })
      }
      if (event.kind === 'acceptCandidate' || event.kind === 'rejectCandidate') {
        tryCountAfterEvent -= 1
      }
    }
    return steps
  }

  private entryAt(eventsBack: number): HistoryEntry {
    const position = (this.newestPosition - eventsBack + this.entries.length) % this.entries.length
    return this.entries[position]
  }

  private undoEntry(progress: SolverProgress, entry: HistoryEntry) {
    const event = entry.event
    if (event === null) {
      return
    }
    switch (event.kind) {
      case 'acceptCandidate':
      case 'rejectCandidate':
        progress.tryCount -= 1
        break
      case 'recordState':
        progress.grid[cellIndex(event.cell)] = EMPTY
        progress.solutionVector[event.index] = EMPTY
        progress.recordCount -= 1
        break
      case 'restoreState':
        progress.grid[cellIndex(event.cell)] = event.digit
        progress.solutionVector[event.index] = event.digit
        progress.restoreCount -= 1
        break
      case 'descend':
      case 'solutionFound':
      case 'noSolution':
        break
    }
    progress.currentIndex = entry.currentIndexBefore
    progress.lastEvent = entry.lastEventBefore
    progress.lastMessageEvent = entry.lastMessageEventBefore
    progress.lastPseudocodeEvent = entry.lastPseudocodeEventBefore
    progress.isFinished = entry.isFinishedBefore
  }
}
