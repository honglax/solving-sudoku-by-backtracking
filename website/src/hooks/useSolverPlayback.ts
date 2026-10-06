import { useEffect, useState } from 'react'
import type { SolverProgress } from '../solver/solverProgress.ts'
import type { Grid } from '../solver/sudokuRules.ts'
import { DEFAULT_TRIES_PER_SECOND } from '../solverView/speed.ts'
import { PlaybackEngine, type HistoryView, type PlaybackMode } from '../playback/playbackEngine.ts'

export function useSolverPlayback(puzzle: Grid) {
  const [progress, setProgress] = useState<SolverProgress | null>(null)
  const [mode, setMode] = useState<PlaybackMode>('notStarted')
  const [isLongInstantSolve, setIsLongInstantSolve] = useState(false)
  const [triesPerSecond, setTriesPerSecond] = useState(DEFAULT_TRIES_PER_SECOND)
  const [historyView, setHistoryView] = useState<HistoryView>({
    steps: [],
    reviewEventsBack: 0,
    newestSequence: 0,
    storedEventCount: 0,
  })
  const [engine] = useState(
    () =>
      new PlaybackEngine({
        onProgressChange: setProgress,
        onModeChange: setMode,
        onLongInstantSolveChange: setIsLongInstantSolve,
        onHistoryChange: setHistoryView,
      }),
  )

  useEffect(() => {
    engine.loadPuzzle(puzzle)
  }, [engine, puzzle])

  useEffect(() => () => engine.dispose(), [engine])

  const changeSpeed = (newTriesPerSecond: number) => {
    setTriesPerSecond(newTriesPerSecond)
    engine.setSpeed(newTriesPerSecond)
  }

  const toggleAutoPlay = () => {
    if (mode === 'autoPlaying') {
      engine.pauseAutoPlay()
    } else {
      engine.startAutoPlay()
    }
  }

  return {
    progress,
    mode,
    isLongInstantSolve,
    triesPerSecond,
    changeSpeed,
    step: () => engine.step(),
    toggleAutoPlay,
    solveInstantly: () => engine.solveInstantly(),
    jumpToNextBacktrack: () => engine.jumpToNextBacktrack(),
    stepBack: () => engine.stepBack(),
    canStepBack: historyView.reviewEventsBack < historyView.storedEventCount,
    stopInstantSolve: () => engine.stopInstantSolve(),
    reset: () => engine.reset(),
    historySteps: historyView.steps,
    reviewEventsBack: historyView.reviewEventsBack,
    isReviewing: historyView.reviewEventsBack > 0,
    reviewSequence: (sequence: number) => engine.reviewSequence(sequence),
    reviewOlderStep: () => engine.reviewOlderStep(),
    reviewNewerStep: () => engine.reviewNewerStep(),
    returnToLatest: () => engine.returnToLatest(),
  }
}
