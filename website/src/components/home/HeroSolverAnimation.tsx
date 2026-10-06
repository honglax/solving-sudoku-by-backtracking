import { useEffect, useState } from 'react'
import { useMediaQuery } from '../../hooks/useMediaQuery.ts'
import type { CellView } from '../../solverView/gridView.ts'
import { SudokuGrid } from '../solver/SudokuGrid.tsx'

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'
const FRAME_INTERVAL_MILLISECONDS = 350
const LAST_FRAME_HOLD_INTERVALS = 6

type HeroSolverAnimationProps = {
  frames: CellView[][]
  label: string
}

function ignoreTypedDigit() {
  return
}

export function HeroSolverAnimation({ frames, label }: HeroSolverAnimationProps) {
  const prefersReducedMotion = useMediaQuery(REDUCED_MOTION_QUERY)
  const [frameIndex, setFrameIndex] = useState(0)
  const lastFrameIndex = frames.length - 1

  useEffect(() => {
    if (prefersReducedMotion) {
      return
    }
    const ticksPerLoop = frames.length + LAST_FRAME_HOLD_INTERVALS
    let tick = 0
    const intervalId = window.setInterval(() => {
      tick = (tick + 1) % ticksPerLoop
      setFrameIndex(Math.min(tick, lastFrameIndex))
    }, FRAME_INTERVAL_MILLISECONDS)
    return () => window.clearInterval(intervalId)
  }, [prefersReducedMotion, frames.length, lastFrameIndex])

  const shownFrame = prefersReducedMotion ? frames[lastFrameIndex] : frames[frameIndex]

  return (
    <figure className="home-hero__picture" role="img" aria-label={label}>
      <SudokuGrid cellViews={shownFrame} showLineNumbers={false} onTypeDigit={ignoreTypedDigit} />
    </figure>
  )
}
