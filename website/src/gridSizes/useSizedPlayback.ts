import { useCallback, useEffect, useRef, useState } from 'react'
import type { SolverEvent } from '../solver/solverEvents.ts'
import { DEFAULT_TRIES_PER_SECOND } from '../solverView/speed.ts'
import { applySizedEvent, createSizedProgress, type SizedProgress } from './sizedProgress.ts'
import type { GridShape, SizedGrid } from './sizedRules.ts'
import { solveSizedBacktracking } from './sizedSolver.ts'

export type SizedMode = 'notStarted' | 'paused' | 'autoPlaying' | 'solvingInstantly' | 'finished'

const MILLISECONDS_PER_SECOND = 1000
const MAXIMUM_FRAME_GAP_MILLISECONDS = 100
const INSTANT_SOLVE_BUDGET_MILLISECONDS = 12
const EVENTS_BETWEEN_CLOCK_READS = 256

type Session = {
  generator: Generator<SolverEvent, void, undefined>
  progress: SizedProgress
}

function copyProgress(progress: SizedProgress): SizedProgress {
  return { ...progress, grid: [...progress.grid] }
}

function pullEvent(shape: GridShape, session: Session): SolverEvent | null {
  const step = session.generator.next()
  if (step.done === true) {
    return null
  }
  applySizedEvent(shape, session.progress, step.value)
  return step.value
}

function advanceOneTry(shape: GridShape, session: Session) {
  const first = pullEvent(shape, session)
  if (first?.kind === 'acceptCandidate') {
    pullEvent(shape, session)
    pullEvent(shape, session)
  }
}

export function useSizedPlayback(shape: GridShape, puzzle: SizedGrid) {
  const [progress, setProgress] = useState<SizedProgress>(() => createSizedProgress(puzzle))
  const [mode, setMode] = useState<SizedMode>('notStarted')
  const [triesPerSecond, setTriesPerSecond] = useState(DEFAULT_TRIES_PER_SECOND)
  const sessionRef = useRef<Session | null>(null)
  const frameRef = useRef<number | null>(null)
  const speedRef = useRef(triesPerSecond)
  const budgetRef = useRef(0)
  const lastFrameTimeRef = useRef(0)

  const cancelFrame = useCallback(() => {
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current)
      frameRef.current = null
    }
  }, [])

  const ensureSession = useCallback(() => {
    if (sessionRef.current === null) {
      sessionRef.current = { generator: solveSizedBacktracking(shape, puzzle), progress: createSizedProgress(puzzle) }
    }
    return sessionRef.current
  }, [shape, puzzle])

  const publish = useCallback((session: Session): boolean => {
    setProgress(copyProgress(session.progress))
    const isFinished = session.progress.outcome !== 'running'
    if (isFinished) {
      setMode('finished')
    }
    return isFinished
  }, [])

  useEffect(() => cancelFrame, [cancelFrame])

  const step = useCallback(() => {
    cancelFrame()
    const session = ensureSession()
    advanceOneTry(shape, session)
    if (!publish(session)) {
      setMode('paused')
    }
  }, [cancelFrame, ensureSession, publish, shape])

  const runAutoFrame = useCallback(
    function autoFrame(frameTime: number) {
      const session = ensureSession()
      const elapsed = Math.min(frameTime - lastFrameTimeRef.current, MAXIMUM_FRAME_GAP_MILLISECONDS)
      lastFrameTimeRef.current = frameTime
      budgetRef.current += (speedRef.current * Math.max(elapsed, 0)) / MILLISECONDS_PER_SECOND
      while (budgetRef.current >= 1 && session.progress.outcome === 'running') {
        advanceOneTry(shape, session)
        budgetRef.current -= 1
      }
      if (!publish(session)) {
        frameRef.current = requestAnimationFrame(autoFrame)
      }
    },
    [ensureSession, publish, shape],
  )

  const startAutoPlay = useCallback(() => {
    cancelFrame()
    ensureSession()
    budgetRef.current = 1
    lastFrameTimeRef.current = performance.now()
    setMode('autoPlaying')
    frameRef.current = requestAnimationFrame(runAutoFrame)
  }, [cancelFrame, ensureSession, runAutoFrame])

  const pause = useCallback(() => {
    cancelFrame()
    const session = ensureSession()
    publish(session)
    setMode('paused')
  }, [cancelFrame, ensureSession, publish])

  const runInstantFrame = useCallback(
    function instantFrame() {
      const session = ensureSession()
      const frameStart = performance.now()
      let eventCount = 0
      while (session.progress.outcome === 'running') {
        if (pullEvent(shape, session) === null) {
          break
        }
        eventCount++
        if (eventCount % EVENTS_BETWEEN_CLOCK_READS === 0 && performance.now() - frameStart >= INSTANT_SOLVE_BUDGET_MILLISECONDS) {
          break
        }
      }
      if (!publish(session)) {
        frameRef.current = requestAnimationFrame(instantFrame)
      }
    },
    [ensureSession, publish, shape],
  )

  const solveInstantly = useCallback(() => {
    cancelFrame()
    ensureSession()
    setMode('solvingInstantly')
    frameRef.current = requestAnimationFrame(runInstantFrame)
  }, [cancelFrame, ensureSession, runInstantFrame])

  const reset = useCallback(() => {
    cancelFrame()
    sessionRef.current = null
    setProgress(createSizedProgress(puzzle))
    setMode('notStarted')
  }, [cancelFrame, puzzle])

  const changeSpeed = useCallback((newTriesPerSecond: number) => {
    speedRef.current = newTriesPerSecond
    setTriesPerSecond(newTriesPerSecond)
  }, [])

  return {
    progress,
    mode,
    triesPerSecond,
    changeSpeed,
    step,
    startAutoPlay,
    pause,
    solveInstantly,
    reset,
  }
}
