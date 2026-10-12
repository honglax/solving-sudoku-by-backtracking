import { useEffect, useState } from 'react'
import type { SolverProgress } from '../solver/solverProgress.ts'
import type { Grid } from '../solver/sudokuRules.ts'
import { DEFAULT_TRIES_PER_SECOND } from '../solverView/speed.ts'
import { PlaybackEngine, type HistoryView, type PlaybackMode } from '../playback/playbackEngine.ts'

export function useSolverPlayback(puzzle: Grid) {
  const [loadedPuzzle, setLoadedPuzzle] = useState<Grid>(puzzle)
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
        onPuzzleLoaded: setLoadedPuzzle,
      }),
  )

  useEffect(() => {
    engine.loadPuzzle(puzzle)
  }, [engine, puzzle])

  const isCurrentPuzzleLoaded = loadedPuzzle === puzzle

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
    progress: isCurrentPuzzleLoaded ? progress : null,
    mode: isCurrentPuzzleLoaded ? mode : ('notStarted' as PlaybackMode),
    isLongInstantSolve: isCurrentPuzzleLoaded && isLongInstantSolve,
    triesPerSecond,
    changeSpeed,
    step: () => engine.step(),
    toggleAutoPlay,
    solveInstantly: () => engine.solveInstantly(),
    jumpToNextBacktrack: () => engine.jumpToNextBacktrack(),
    stepBack: () => engine.stepBack(),
    canStepBack: isCurrentPuzzleLoaded && historyView.reviewEventsBack < historyView.storedEventCount,
    stopInstantSolve: () => engine.stopInstantSolve(),
    reset: () => engine.reset(),
    historySteps: isCurrentPuzzleLoaded ? historyView.steps : [],
    reviewEventsBack: isCurrentPuzzleLoaded ? historyView.reviewEventsBack : 0,
    isReviewing: isCurrentPuzzleLoaded && historyView.reviewEventsBack > 0,
    reviewSequence: (sequence: number) => engine.reviewSequence(sequence),
    reviewOlderStep: () => engine.reviewOlderStep(),
    reviewNewerStep: () => engine.reviewNewerStep(),
    returnToLatest: () => engine.returnToLatest(),
  }
}
