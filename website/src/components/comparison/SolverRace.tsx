import { ChevronDown, Pause, Play, RotateCcw, StepForward } from 'lucide-react'
import { useId, useMemo, useState } from 'react'
import { useSolverRace } from '../../hooks/useSolverRace.ts'
import { formatMessage, messages } from '../../i18n/messages.ts'
import type { RaceLane, RaceMode } from '../../playback/raceEngine.ts'
import { parsePuzzle } from '../../solver/puzzleParser.ts'
import { analyzePuzzle } from '../../solver/puzzleValidator.ts'
import { findSamplePuzzle, LISTED_SAMPLE_PUZZLES } from '../../solver/samplePuzzles.ts'
import type { Grid } from '../../solver/sudokuRules.ts'
import { countCandidatesOfEmptyCells } from '../../solverView/candidateCounts.ts'
import { formatCount } from '../../solverView/formatting.ts'
import { buildGridView } from '../../solverView/gridView.ts'
import { samplePuzzleLabel } from '../../solverView/puzzleLabels.ts'
import { ICON_SIZE, ICON_STROKE_WIDTH } from '../iconSizes.ts'
import { SpeedSlider } from '../SpeedSlider.tsx'
import { SudokuGrid } from '../solver/SudokuGrid.tsx'
import '../../styles/components/comparison/SolverRace.css'

const RACE = messages.comparison.race
const DEFAULT_RACE_PUZZLE_ID = 3

function parseSamplePuzzleById(puzzleId: number): Grid {
  const parseResult = parsePuzzle(findSamplePuzzle(puzzleId).puzzle)
  if (!parseResult.ok) {
    throw new Error(`Sample puzzle ${puzzleId} does not parse`)
  }
  return parseResult.grid
}

function ignoreTypedDigit() {
  return
}

function laneStatusText(lane: RaceLane, raceMode: RaceMode): string {
  const { progress } = lane
  const tryCount = formatCount(progress.tryCount)
  if (progress.lastEvent?.kind === 'solutionFound') {
    return formatMessage(RACE.laneStatus.solved, { tryCount })
  }
  if (progress.lastEvent?.kind === 'noSolution') {
    return formatMessage(RACE.laneStatus.noSolution, { tryCount })
  }
  if (progress.tryCount === 0 && raceMode === 'notStarted') {
    return RACE.laneStatus.notStarted
  }
  return RACE.laneStatus.running
}

function raceSummary(lanes: RaceLane[]): string | null {
  const rowMajorLane = lanes.find(lane => lane.cellOrder === 'rowMajor')
  const fewestCandidatesLane = lanes.find(lane => lane.cellOrder === 'fewestCandidates')
  if (rowMajorLane === undefined || fewestCandidatesLane === undefined) {
    return null
  }
  const rowMajorTryCount = rowMajorLane.progress.tryCount
  const fewestTryCount = fewestCandidatesLane.progress.tryCount
  const values = {
    rowMajorTryCount: formatCount(rowMajorTryCount),
    fewestTryCount: formatCount(fewestTryCount),
    ratio: formatCount(Math.round(rowMajorTryCount / Math.max(fewestTryCount, 1))),
  }
  if (fewestTryCount < rowMajorTryCount) {
    return formatMessage(RACE.summary.fewerTries, values)
  }
  if (fewestTryCount === rowMajorTryCount) {
    return formatMessage(RACE.summary.sameTries, values)
  }
  return formatMessage(RACE.summary.moreTries, values)
}

type RaceLaneViewProps = {
  lane: RaceLane
  puzzle: Grid
  raceMode: RaceMode
}

function RaceLaneView({ lane, puzzle, raceMode }: RaceLaneViewProps) {
  const laneText = RACE.lanes[lane.cellOrder]
  const cellViews = buildGridView({ puzzle, lockedGivens: puzzle, puzzleStatus: analyzePuzzle(puzzle), progress: lane.progress })
  const isSolved = lane.progress.lastEvent?.kind === 'solutionFound'
  const candidateCounts = isSolved ? undefined : countCandidatesOfEmptyCells(lane.progress.grid)

  return (
    <section className="race-lane card" aria-label={laneText.title}>
      <header className="race-lane__header">
        <h3 className="race-lane__title">{laneText.title}</h3>
        <p className="race-lane__subtitle">{laneText.subtitle}</p>
      </header>
      <div className="race-lane__grid">
        <SudokuGrid
          cellViews={cellViews}
          showLineNumbers={false}
          onTypeDigit={ignoreTypedDigit}
          candidateCounts={candidateCounts}
        />
      </div>
      <dl className="race-lane__counters">
        <div>
          <dt>{RACE.tryCount}</dt>
          <dd>{formatCount(lane.progress.tryCount)}</dd>
        </div>
        <div>
          <dt>{RACE.restoreCount}</dt>
          <dd>{formatCount(lane.progress.restoreCount)}</dd>
        </div>
      </dl>
      <p className="race-lane__status" data-finished={lane.progress.isFinished ? 'true' : undefined}>
        {laneStatusText(lane, raceMode)}
      </p>
    </section>
  )
}

export function SolverRace() {
  const puzzleSelectId = useId()
  const [puzzleId, setPuzzleId] = useState(DEFAULT_RACE_PUZZLE_ID)
  const puzzle = useMemo(() => parseSamplePuzzleById(puzzleId), [puzzleId])
  const { lanes, mode, triesPerSecond, run, pause, step, reset, changeSpeed } = useSolverRace(puzzle)
  const isRunning = mode === 'running'
  const isFinished = mode === 'finished'
  const summary = isFinished ? raceSummary(lanes) : null

  return (
    <div className="solver-race">
      <div className="solver-race__controls">
        <div className="solver-race__puzzle">
          <label className="solver-race__label" htmlFor={puzzleSelectId}>
            {RACE.puzzleSelectLabel}
          </label>
          <div className="select-field">
            <select
              id={puzzleSelectId}
              className="select-field__control"
              value={puzzleId}
              onChange={event => setPuzzleId(Number(event.target.value))}
            >
              {LISTED_SAMPLE_PUZZLES.map(sample => (
                <option key={sample.id} value={sample.id}>
                  {samplePuzzleLabel(sample)}
                </option>
              ))}
            </select>
            <ChevronDown className="select-field__icon" size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} aria-hidden />
          </div>
        </div>
        <div className="solver-race__buttons">
          {isRunning ? (
            <button type="button" className="button button--primary" onClick={pause}>
              <Pause size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} aria-hidden />
              {RACE.pauseButton}
            </button>
          ) : (
            <button type="button" className="button button--primary" onClick={run} disabled={isFinished}>
              <Play size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} aria-hidden />
              {RACE.runButton}
            </button>
          )}
          <button type="button" className="button button--secondary" onClick={step} disabled={isFinished}>
            <StepForward size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} aria-hidden />
            {RACE.stepButton}
          </button>
          <button type="button" className="button button--ghost" onClick={reset}>
            <RotateCcw size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} aria-hidden />
            {RACE.resetButton}
          </button>
        </div>
        <SpeedSlider triesPerSecond={triesPerSecond} onChangeSpeed={changeSpeed} />
      </div>

      <p className="solver-race__legend">{RACE.legend}</p>

      <div className="solver-race__lanes">
        {lanes.map(lane => (
          <RaceLaneView key={lane.cellOrder} lane={lane} puzzle={puzzle} raceMode={mode} />
        ))}
      </div>

      {summary !== null && (
        <p className="solver-race__summary" role="status">
          {summary}
        </p>
      )}
    </div>
  )
}
