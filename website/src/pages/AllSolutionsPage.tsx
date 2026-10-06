import { ChevronDown, Pause, Play, RotateCcw, Square, StepForward, Zap } from 'lucide-react'
import { useId, useMemo, useState } from 'react'
import { SolutionThumbnail } from '../components/allSolutions/SolutionThumbnail.tsx'
import { ICON_SIZE, ICON_STROKE_WIDTH } from '../components/iconSizes.ts'
import { PseudocodePanel } from '../components/solver/PseudocodePanel.tsx'
import { SudokuGrid } from '../components/solver/SudokuGrid.tsx'
import { SpeedSlider } from '../components/SpeedSlider.tsx'
import { useAllSolutionsSearch } from '../hooks/useAllSolutionsSearch.ts'
import { useDocumentTitle } from '../hooks/useDocumentTitle.ts'
import { formatMessage, messages } from '../i18n/messages.ts'
import { KEPT_SOLUTION_LIMIT, type AllSolutionsState } from '../playback/allSolutionsEngine.ts'
import { parsePuzzle } from '../solver/puzzleParser.ts'
import { analyzePuzzle } from '../solver/puzzleValidator.ts'
import { findSamplePuzzle, LISTED_SAMPLE_PUZZLES } from '../solver/samplePuzzles.ts'
import type { Grid } from '../solver/sudokuRules.ts'
import { formatCount } from '../solverView/formatting.ts'
import { buildGridView } from '../solverView/gridView.ts'
import { highlightForEvent } from '../solverView/pseudocode.ts'
import { samplePuzzleLabel } from '../solverView/puzzleLabels.ts'
import '../styles/pages/AllSolutionsPage.css'

const ALL_SOLUTIONS = messages.allSolutions
const MULTIPLE_SOLUTIONS_PUZZLE_ID = 8
const MIDDLE_PUZZLE_ID = 3
const EMPTY_GRID_PUZZLE_ID = 6
const ARTO_INKALA_PUZZLE_ID = 5

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

function fullSearchCountsOf(puzzleId: number) {
  const measuredFullSearch = findSamplePuzzle(puzzleId).measuredFullSearch
  if (measuredFullSearch === null) {
    throw new Error(`Puzzle ${puzzleId} has no full-search measurement`)
  }
  return measuredFullSearch
}

const ARTO_INKALA = findSamplePuzzle(ARTO_INKALA_PUZZLE_ID)
const ARTO_INKALA_FULL_SEARCH = fullSearchCountsOf(ARTO_INKALA_PUZZLE_ID)
const COST_VALUES = {
  firstTryCount: formatCount(ARTO_INKALA.measured.tryCount),
  fullTryCount: formatCount(ARTO_INKALA_FULL_SEARCH.tryCount),
  ratio: formatCount(Math.round(ARTO_INKALA_FULL_SEARCH.tryCount / ARTO_INKALA.measured.tryCount)),
}
const MIDDLE_PUZZLE_NOTE = formatMessage(ALL_SOLUTIONS.middlePuzzleNote, {
  solutionCount: fullSearchCountsOf(MIDDLE_PUZZLE_ID).solutionCount,
})

function statusText(state: AllSolutionsState): string {
  const { progress } = state
  const values = { tryCount: formatCount(progress.tryCount), solutionCount: formatCount(progress.solutionCount) }
  switch (state.mode) {
    case 'notStarted':
      return ALL_SOLUTIONS.status.notStarted
    case 'autoPlaying':
    case 'searchingInstantly':
      return formatMessage(ALL_SOLUTIONS.status.searching, values)
    case 'pausedAtSolution':
      return formatMessage(ALL_SOLUTIONS.status.pausedAtSolution, { ...values, solutionNumber: progress.solutionCount })
    case 'paused':
      return formatMessage(ALL_SOLUTIONS.status.paused, values)
    case 'finished':
      if (progress.solutionCount === 0) {
        return formatMessage(ALL_SOLUTIONS.status.finishedNone, values)
      }
      if (progress.solutionCount === 1) {
        return formatMessage(ALL_SOLUTIONS.status.finishedOne, values)
      }
      return formatMessage(ALL_SOLUTIONS.status.finishedMany, values)
  }
}

export default function AllSolutionsPage() {
  useDocumentTitle(ALL_SOLUTIONS.documentTitle)
  const puzzleSelectId = useId()
  const [puzzleId, setPuzzleId] = useState(MULTIPLE_SOLUTIONS_PUZZLE_ID)
  const puzzle = useMemo(() => parseSamplePuzzleById(puzzleId), [puzzleId])
  const puzzleStatus = useMemo(() => analyzePuzzle(puzzle), [puzzle])
  const { state, triesPerSecond, run, step, searchInstantly, pause, reset, changeSpeed } = useAllSolutionsSearch(puzzle)

  if (state === null) {
    return null
  }

  const { mode, progress, keptSolutions } = state
  const isAutoPlaying = mode === 'autoPlaying'
  const isSearchingInstantly = mode === 'searchingInstantly'
  const isFinished = mode === 'finished'
  const cellViews = buildGridView({ puzzle, lockedGivens: puzzle, puzzleStatus, progress })
  const highlight = highlightForEvent(progress.lastPseudocodeEvent)
  const firstSolution = keptSolutions[0]

  return (
    <>
      <div className="page-band">
        <div className="page-band__inner all-solutions-page__width">
          <h1 className="page-title">{ALL_SOLUTIONS.title}</h1>
          <p className="all-solutions-page__intro">{ALL_SOLUTIONS.intro}</p>
        </div>
      </div>
      <main className="all-solutions-page all-solutions-page__width">
        <div className="all-solutions-page__controls">
          <div className="all-solutions-page__puzzle">
            <label className="all-solutions-page__label" htmlFor={puzzleSelectId}>
              {ALL_SOLUTIONS.puzzleSelectLabel}
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
          <div className="all-solutions-page__buttons">
            {isAutoPlaying ? (
              <button type="button" className="button button--primary" onClick={pause}>
                <Pause size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} aria-hidden />
                {ALL_SOLUTIONS.pauseButton}
              </button>
            ) : (
              <button type="button" className="button button--primary" onClick={run} disabled={isFinished || isSearchingInstantly}>
                <Play size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} aria-hidden />
                {ALL_SOLUTIONS.runButton}
              </button>
            )}
            <button
              type="button"
              className="button button--secondary"
              onClick={step}
              disabled={isFinished || isSearchingInstantly}
            >
              <StepForward size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} aria-hidden />
              {ALL_SOLUTIONS.stepButton}
            </button>
            {isSearchingInstantly ? (
              <button type="button" className="button button--secondary" onClick={pause}>
                <Square size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} aria-hidden />
                {ALL_SOLUTIONS.stopButton}
              </button>
            ) : (
              <button type="button" className="button button--secondary" onClick={searchInstantly} disabled={isFinished}>
                <Zap size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} aria-hidden />
                {ALL_SOLUTIONS.searchAllButton}
              </button>
            )}
            <button type="button" className="button button--ghost" onClick={reset}>
              <RotateCcw size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} aria-hidden />
              {ALL_SOLUTIONS.resetButton}
            </button>
          </div>
          <SpeedSlider triesPerSecond={triesPerSecond} onChangeSpeed={changeSpeed} />
        </div>
        {puzzleId === EMPTY_GRID_PUZZLE_ID && <p className="all-solutions-page__note">{ALL_SOLUTIONS.emptyGridNote}</p>}

        <div className="all-solutions-page__workspace">
          <div className="all-solutions-page__grid">
            <SudokuGrid cellViews={cellViews} showLineNumbers={false} onTypeDigit={ignoreTypedDigit} />
          </div>
          <div className="all-solutions-page__side">
            <dl className="card all-solutions-page__counters">
              <div>
                <dt>{ALL_SOLUTIONS.counters.solutionCount}</dt>
                <dd>{formatCount(progress.solutionCount)}</dd>
              </div>
              <div>
                <dt>{ALL_SOLUTIONS.counters.tryCount}</dt>
                <dd>{formatCount(progress.tryCount)}</dd>
              </div>
              <div>
                <dt>{ALL_SOLUTIONS.counters.restoreCount}</dt>
                <dd>{formatCount(progress.restoreCount)}</dd>
              </div>
            </dl>
            <p className="card all-solutions-page__status" role="status">
              {statusText(state)}
            </p>
            <PseudocodePanel highlight={highlight} isCollapsible={false} />
          </div>
        </div>

        <section className="all-solutions-page__section" aria-labelledby="all-solutions-gallery">
          <h2 id="all-solutions-gallery">{ALL_SOLUTIONS.gallery.title}</h2>
          {firstSolution === undefined ? (
            <p className="all-solutions-page__muted">{ALL_SOLUTIONS.gallery.empty}</p>
          ) : (
            <>
              <p className="all-solutions-page__muted">{ALL_SOLUTIONS.gallery.legend}</p>
              <div className="all-solutions-page__gallery">
                {keptSolutions.map((solution, solutionIndex) => (
                  <SolutionThumbnail
                    key={solutionIndex}
                    solutionNumber={solutionIndex + 1}
                    solution={solution}
                    puzzle={puzzle}
                    firstSolution={firstSolution}
                  />
                ))}
              </div>
              {progress.solutionCount > KEPT_SOLUTION_LIMIT && (
                <p className="all-solutions-page__muted">
                  {formatMessage(ALL_SOLUTIONS.gallery.limitNote, { limit: KEPT_SOLUTION_LIMIT })}
                </p>
              )}
            </>
          )}
        </section>

        <section className="all-solutions-page__section" aria-labelledby="all-solutions-cost">
          <h2 id="all-solutions-cost">{ALL_SOLUTIONS.costTitle}</h2>
          <p className="all-solutions-page__paragraph">{formatMessage(ALL_SOLUTIONS.costText, COST_VALUES)}</p>
          <p className="all-solutions-page__paragraph">{MIDDLE_PUZZLE_NOTE}</p>
        </section>
      </main>
    </>
  )
}
