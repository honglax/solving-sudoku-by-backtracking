import { useEffect, useState } from 'react'
import { RaceEngine, type RaceLane, type RaceMode } from '../playback/raceEngine.ts'
import type { CellOrder } from '../solver/backtrackingSolver.ts'
import type { Grid } from '../solver/sudokuRules.ts'
import { DEFAULT_TRIES_PER_SECOND } from '../solverView/speed.ts'

export const RACE_CELL_ORDERS: CellOrder[] = ['rowMajor', 'fewestCandidates']

export function useSolverRace(puzzle: Grid) {
  const [lanes, setLanes] = useState<RaceLane[]>([])
  const [mode, setMode] = useState<RaceMode>('notStarted')
  const [triesPerSecond, setTriesPerSecond] = useState(DEFAULT_TRIES_PER_SECOND)
  const [engine] = useState(
    () => new RaceEngine({ onLanesChange: setLanes, onModeChange: setMode }, RACE_CELL_ORDERS, DEFAULT_TRIES_PER_SECOND),
  )

  useEffect(() => {
    engine.loadPuzzle(puzzle)
  }, [engine, puzzle])

  useEffect(() => () => engine.dispose(), [engine])

  const changeSpeed = (newTriesPerSecond: number) => {
    setTriesPerSecond(newTriesPerSecond)
    engine.setSpeed(newTriesPerSecond)
  }

  return {
    lanes,
    mode,
    triesPerSecond,
    run: () => engine.start(),
    pause: () => engine.pause(),
    step: () => engine.step(),
    reset: () => engine.loadPuzzle(puzzle),
    changeSpeed,
  }
}
