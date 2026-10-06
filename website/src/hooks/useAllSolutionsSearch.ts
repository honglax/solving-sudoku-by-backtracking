import { useEffect, useState } from 'react'
import { AllSolutionsEngine, type AllSolutionsState } from '../playback/allSolutionsEngine.ts'
import type { Grid } from '../solver/sudokuRules.ts'
import { DEFAULT_TRIES_PER_SECOND } from '../solverView/speed.ts'

export function useAllSolutionsSearch(puzzle: Grid) {
  const [state, setState] = useState<AllSolutionsState | null>(null)
  const [triesPerSecond, setTriesPerSecond] = useState(DEFAULT_TRIES_PER_SECOND)
  const [engine] = useState(() => new AllSolutionsEngine(setState, DEFAULT_TRIES_PER_SECOND))

  useEffect(() => {
    engine.loadPuzzle(puzzle)
  }, [engine, puzzle])

  useEffect(() => () => engine.dispose(), [engine])

  const changeSpeed = (newTriesPerSecond: number) => {
    setTriesPerSecond(newTriesPerSecond)
    engine.setSpeed(newTriesPerSecond)
  }

  return {
    state,
    triesPerSecond,
    run: () => engine.startAutoPlay(),
    step: () => engine.step(),
    searchInstantly: () => engine.searchInstantly(),
    pause: () => engine.pause(),
    reset: () => engine.loadPuzzle(puzzle),
    changeSpeed,
  }
}
