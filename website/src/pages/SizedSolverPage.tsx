import { ChevronDown, Pause, Play, RotateCcw, Square, StepForward, Zap } from 'lucide-react'
import { useId, useMemo, useState } from 'react'
import { ICON_SIZE, ICON_STROKE_WIDTH } from '../components/iconSizes.ts'
import { PseudocodePanel } from '../components/solver/PseudocodePanel.tsx'
import { SolverCounters } from '../components/solver/ProgressPanel.tsx'
import { SizedGrid, type SizedCellView } from '../components/sizes/SizedGrid.tsx'
import { SpeedSlider } from '../components/SpeedSlider.tsx'
import { boundDigitCount } from '../gridSizes/sizedFormatting.ts'
import { parseSizedPuzzle } from '../gridSizes/sizedPuzzleParser.ts'
import type { SizedProgress } from '../gridSizes/sizedProgress.ts'
import { cellIndexOf, digitCharacter, EMPTY, shapeOf, SMALLEST_BOX_SIZE, LARGEST_BOX_SIZE, unitNumberOf, type GridShape, type SizedGrid as SizedGridData } from '../gridSizes/sizedRules.ts'
import { findSizedSamplePuzzle, sizedSamplesOfBoxSize, SIZED_SAMPLE_PUZZLES, type SizedSamplePuzzle } from '../gridSizes/sizedSamplePuzzles.ts'
import { useSizedPlayback } from '../gridSizes/useSizedPlayback.ts'
import { useDocumentTitle } from '../hooks/useDocumentTitle.ts'
import { formatMessage, messages } from '../i18n/messages.ts'
import { highlightForEvent } from '../solverView/pseudocode.ts'
import { describeCell, formatCount } from '../solverView/formatting.ts'
import '../styles/pages/SizedSolverPage.css'

const SIZES = messages.sizes
const BOX_SIZES = Array.from({ length: LARGEST_BOX_SIZE - SMALLEST_BOX_SIZE + 1 }, (_, offset) => SMALLEST_BOX_SIZE + offset)
const DEFAULT_BOX_SIZE = 3
const FIRST_PUZZLE_OF_BOX_SIZE: Record<number, number> = { 2: 2, 3: 6, 4: 9 }

function parseSamplePuzzle(sample: SizedSamplePuzzle): { shape: GridShape; puzzle: SizedGridData } {
  const shape = shapeOf(sample.boxSize)
  const parseResult = parseSizedPuzzle(sample.puzzle, shape)
  if (!parseResult.ok) {
    throw new Error(`Sized sample puzzle ${sample.id} does not parse`)
  }
  return { shape, puzzle: parseResult.grid }
}

function samplePuzzleLabel(sample: SizedSamplePuzzle): string {
  const blankCount = [...sample.puzzle].filter(character => character === '.').length
  return formatMessage(SIZES.puzzleLabel, { name: SIZES.puzzleNames[String(sample.id) as keyof typeof SIZES.puzzleNames], blankCount })
}

function buildCellViews(shape: GridShape, puzzle: SizedGridData, progress: SizedProgress): SizedCellView[] {
  const views: SizedCellView[] = puzzle.map((givenDigit, index) => {
    const digit = progress.grid[index]
    if (givenDigit !== EMPTY) {
      return { digit, state: 'given', isConflict: false, ghostDigit: 0 }
    }
    if (digit !== EMPTY) {
      return { digit, state: progress.outcome === 'solved' ? 'solved' : 'recorded', isConflict: false, ghostDigit: 0 }
    }
    return { digit: 0, state: 'empty', isConflict: false, ghostDigit: 0 }
  })
  const event = progress.lastMessageEvent
  if (event === null) {
    return views
  }
  if (event.kind === 'acceptCandidate') {
    views[cellIndexOf(shape, event.cell)] = { digit: event.digit, state: 'trying', isConflict: false, ghostDigit: 0 }
  } else if (event.kind === 'rejectCandidate') {
    views[cellIndexOf(shape, event.cell)] = { digit: event.digit, state: 'rejected', isConflict: false, ghostDigit: 0 }
    views[cellIndexOf(shape, event.conflictingCell)].isConflict = true
  } else if (event.kind === 'restoreState') {
    views[cellIndexOf(shape, event.cell)] = { digit: 0, state: 'restored', isConflict: false, ghostDigit: event.digit }
  }
  return views
}

function statusText(shape: GridShape, progress: SizedProgress, isRunning: boolean): string {
  const counts = {
    tryCount: formatCount(progress.tryCount),
    recordCount: formatCount(progress.recordCount),
    restoreCount: formatCount(progress.restoreCount),
  }
  if (progress.outcome === 'solved') {
    return formatMessage(SIZES.status.solved, counts)
  }
  if (progress.outcome === 'noSolution') {
    return formatMessage(SIZES.status.noSolution, counts)
  }
  const event = progress.lastMessageEvent
  if (isRunning) {
    return formatMessage(SIZES.status.searching, counts)
  }
  if (event === null) {
    return formatMessage(SIZES.status.notStarted, { blankCount: progress.blankCount, size: shape.size })
  }
  if (event.kind === 'acceptCandidate') {
    return formatMessage(SIZES.status.accepted, { cell: describeCell(event.cell), digit: digitCharacter(event.digit) })
  }
  if (event.kind === 'rejectCandidate') {
    const unitNumber = unitNumberOf(shape, event.conflictingUnit, event.cell)
    return formatMessage(SIZES.status.rejected, {
      cell: describeCell(event.cell),
      digit: digitCharacter(event.digit),
      unit: formatMessage(SIZES.units[event.conflictingUnit], { number: unitNumber }),
    })
  }
  if (event.kind === 'restoreState') {
    return formatMessage(SIZES.status.restored, { cell: describeCell(event.cell), digit: digitCharacter(event.digit) })
  }
  return formatMessage(SIZES.status.searching, counts)
}

type WorkspaceProps = {
  shape: GridShape
  puzzle: SizedGridData
}

function SizedWorkspace({ shape, puzzle }: WorkspaceProps) {
  const playback = useSizedPlayback(shape, puzzle)
  const { progress, mode } = playback
  const cellViews = useMemo(() => buildCellViews(shape, puzzle, progress), [shape, puzzle, progress])
  const highlight = highlightForEvent(progress.lastPseudocodeEvent)
  const isFinished = mode === 'finished'
  const isAutoPlaying = mode === 'autoPlaying'
  const isSolvingInstantly = mode === 'solvingInstantly'
  const caption = formatMessage(SIZES.pseudocodeCaption, { size: shape.size })
  const boundText = formatMessage(SIZES.boundText, {
    blankCount: progress.blankCount,
    size: shape.size,
    digits: boundDigitCount(shape.size, progress.blankCount),
  })

  return (
    <>
      <div className="sized-page__buttons">
        {isAutoPlaying ? (
          <button type="button" className="button button--primary" onClick={playback.pause}>
            <Pause size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} aria-hidden />
            {SIZES.controls.pause}
          </button>
        ) : (
          <button type="button" className="button button--primary" onClick={playback.startAutoPlay} disabled={isFinished || isSolvingInstantly}>
            <Play size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} aria-hidden />
            {SIZES.controls.autoPlay}
          </button>
        )}
        <button type="button" className="button button--secondary" onClick={playback.step} disabled={isFinished || isSolvingInstantly}>
          <StepForward size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} aria-hidden />
          {SIZES.controls.step}
        </button>
        {isSolvingInstantly ? (
          <button type="button" className="button button--secondary" onClick={playback.pause}>
            <Square size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} aria-hidden />
            {SIZES.controls.stop}
          </button>
        ) : (
          <button type="button" className="button button--secondary" onClick={playback.solveInstantly} disabled={isFinished}>
            <Zap size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} aria-hidden />
            {SIZES.controls.solveInstantly}
          </button>
        )}
        <button type="button" className="button button--ghost" onClick={playback.reset}>
          <RotateCcw size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} aria-hidden />
          {SIZES.controls.reset}
        </button>
      </div>
      <SpeedSlider triesPerSecond={playback.triesPerSecond} onChangeSpeed={playback.changeSpeed} />

      <div className="sized-page__workspace">
        <div className="sized-page__grid">
          <SizedGrid shape={shape} cellViews={cellViews} />
        </div>
        <div className="sized-page__side">
          <div className="card sized-page__counters">
            <SolverCounters progress={progress} />
          </div>
          <p className="card sized-page__status" role="status">
            {statusText(shape, progress, isAutoPlaying || isSolvingInstantly)}
          </p>
          <p className="sized-page__bound">{boundText}</p>
          <PseudocodePanel highlight={highlight} isCollapsible={false} caption={caption} />
        </div>
      </div>
    </>
  )
}

function SizesTable() {
  return (
    <section className="sized-page__section" aria-labelledby="sizes-table-title">
      <h2 id="sizes-table-title">{SIZES.tableTitle}</h2>
      <table className="sized-page__table">
        <caption>{SIZES.tableCaption}</caption>
        <thead>
          <tr>
            <th scope="col">{SIZES.tableColumns.size}</th>
            <th scope="col">{SIZES.tableColumns.puzzle}</th>
            <th scope="col">{SIZES.tableColumns.blankCount}</th>
            <th scope="col">{SIZES.tableColumns.bound}</th>
            <th scope="col">{SIZES.tableColumns.tryCount}</th>
            <th scope="col">{SIZES.tableColumns.restoreCount}</th>
          </tr>
        </thead>
        <tbody>
          {SIZED_SAMPLE_PUZZLES.map(sample => {
            const shape = shapeOf(sample.boxSize)
            const blankCount = [...sample.puzzle].filter(character => character === '.').length
            return (
              <tr key={sample.id}>
                <td>{formatMessage(SIZES.tableSize, { size: shape.size })}</td>
                <td>{SIZES.puzzleNames[String(sample.id) as keyof typeof SIZES.puzzleNames]}</td>
                <td>{blankCount}</td>
                <td>{boundDigitCount(shape.size, blankCount)}</td>
                <td>{formatCount(sample.measured.tryCount)}</td>
                <td>{formatCount(sample.measured.restoreCount)}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </section>
  )
}

export default function SizedSolverPage() {
  useDocumentTitle(SIZES.documentTitle)
  const sizeSelectId = useId()
  const puzzleSelectId = useId()
  const [boxSize, setBoxSize] = useState(DEFAULT_BOX_SIZE)
  const [puzzleId, setPuzzleId] = useState(FIRST_PUZZLE_OF_BOX_SIZE[DEFAULT_BOX_SIZE])
  const sample = findSizedSamplePuzzle(puzzleId)
  const { shape, puzzle } = useMemo(() => parseSamplePuzzle(sample), [sample])

  const changeBoxSize = (newBoxSize: number) => {
    setBoxSize(newBoxSize)
    setPuzzleId(FIRST_PUZZLE_OF_BOX_SIZE[newBoxSize])
  }

  return (
    <>
      <div className="page-band">
        <div className="page-band__inner sized-page__width">
          <h1 className="page-title">{SIZES.title}</h1>
          <p className="sized-page__intro">{SIZES.intro}</p>
        </div>
      </div>
      <main className="sized-page sized-page__width">
        <div className="sized-page__controls">
          <div className="sized-page__field">
            <label className="sized-page__label" htmlFor={sizeSelectId}>
              {SIZES.sizeLabel}
            </label>
            <div className="select-field">
              <select id={sizeSelectId} className="select-field__control" value={boxSize} onChange={event => changeBoxSize(Number(event.target.value))}>
                {BOX_SIZES.map(option => (
                  <option key={option} value={option}>
                    {SIZES.sizeOptions[String(option) as keyof typeof SIZES.sizeOptions]}
                  </option>
                ))}
              </select>
              <ChevronDown className="select-field__icon" size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} aria-hidden />
            </div>
          </div>
          <div className="sized-page__field sized-page__field--wide">
            <label className="sized-page__label" htmlFor={puzzleSelectId}>
              {SIZES.puzzleSelectLabel}
            </label>
            <div className="select-field">
              <select id={puzzleSelectId} className="select-field__control" value={puzzleId} onChange={event => setPuzzleId(Number(event.target.value))}>
                {sizedSamplesOfBoxSize(boxSize).map(option => (
                  <option key={option.id} value={option.id}>
                    {samplePuzzleLabel(option)}
                  </option>
                ))}
              </select>
              <ChevronDown className="select-field__icon" size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} aria-hidden />
            </div>
          </div>
        </div>
        <SizedWorkspace key={puzzleId} shape={shape} puzzle={puzzle} />
        <SizesTable />
      </main>
    </>
  )
}
