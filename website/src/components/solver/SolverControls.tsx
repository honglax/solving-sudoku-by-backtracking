import type { RefObject } from 'react'
import { formatMessage, messages } from '../../i18n/messages.ts'
import { ChevronDown, Pause, Play, RotateCcw, SkipForward, StepBack, StepForward, Zap } from 'lucide-react'
import { ICON_SIZE, ICON_STROKE_WIDTH } from '../iconSizes.ts'
import { findSamplePuzzle, LISTED_SAMPLE_PUZZLES, type PuzzleSource } from '../../solver/samplePuzzles.ts'
import { customPuzzleLabel, samplePuzzleLabel, unlistedPuzzleLabel } from '../../solverView/puzzleLabels.ts'
import {
  SPEED_SLIDER_MAXIMUM,
  SPEED_SLIDER_MINIMUM,
  sliderPositionToSpeed,
  speedToSliderPosition,
} from '../../solverView/speed.ts'
import { formatCount } from '../../solverView/formatting.ts'
import type { Grid } from '../../solver/sudokuRules.ts'
import '../../styles/components/solver/SolverControls.css'

const CONTROLS = messages.solver.controls
const CUSTOM_PUZZLE_OPTION_VALUE = 'custom'
const PUZZLE_SELECT_ID = 'sample-puzzle'
const SPEED_SLIDER_ID = 'playback-speed'

type PuzzleControlsProps = {
  source: PuzzleSource
  puzzle: Grid
  pasteButtonRef?: RefObject<HTMLButtonElement | null>
  onSelectSample: (sampleId: number) => void
  onOpenPasteDialog: () => void
  onCheckPuzzle: () => void
}

export function PuzzleControls({
  source,
  puzzle,
  pasteButtonRef,
  onSelectSample,
  onOpenPasteDialog,
  onCheckPuzzle,
}: PuzzleControlsProps) {
  const selectedValue = source.kind === 'sample' ? String(source.sampleId) : CUSTOM_PUZZLE_OPTION_VALUE
  const selectedUnlistedSample =
    source.kind === 'sample' && !findSamplePuzzle(source.sampleId).isListed ? findSamplePuzzle(source.sampleId) : null

  return (
    <div className="solver-controls__row">
      <label className="visually-hidden" htmlFor={PUZZLE_SELECT_ID}>
        {CONTROLS.puzzleSelectLabel}
      </label>
      <div className="select-field">
        <select
          id={PUZZLE_SELECT_ID}
          className="select-field__control"
          value={selectedValue}
          onChange={event => onSelectSample(Number(event.target.value))}
        >
          {LISTED_SAMPLE_PUZZLES.map(sample => (
            <option key={sample.id} value={sample.id}>
              {samplePuzzleLabel(sample)}
            </option>
          ))}
          {selectedUnlistedSample !== null && (
            <option value={selectedUnlistedSample.id} disabled>
              {unlistedPuzzleLabel(selectedUnlistedSample)}
            </option>
          )}
          {source.kind === 'custom' && (
            <option value={CUSTOM_PUZZLE_OPTION_VALUE} disabled>
              {customPuzzleLabel(puzzle)}
            </option>
          )}
        </select>
        <ChevronDown className="select-field__icon" size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} aria-hidden />
      </div>
      <button
        ref={pasteButtonRef}
        type="button"
        className="button button--secondary"
        aria-haspopup="dialog"
        onClick={onOpenPasteDialog}
      >
        {CONTROLS.paste}
      </button>
      <button type="button" className="button button--secondary" onClick={onCheckPuzzle}>
        {CONTROLS.check}
      </button>
    </div>
  )
}

type PlaybackControlsProps = {
  canRun: boolean
  canStep: boolean
  canStepBack: boolean
  onStepBack: () => void
  isAutoPlaying: boolean
  onStep: () => void
  onToggleAutoPlay: () => void
  onSolveInstantly: () => void
  onReset?: () => void
}

export function PlaybackControls({
  canRun,
  canStep,
  canStepBack,
  onStepBack,
  isAutoPlaying,
  onStep,
  onToggleAutoPlay,
  onSolveInstantly,
  onReset,
}: PlaybackControlsProps) {
  return (
    <div className="solver-controls__row solver-controls__playback">
      <button
        type="button"
        className="button button--secondary button--icon-only"
        aria-label={CONTROLS.stepBack}
        title={CONTROLS.stepBack}
        disabled={!canStepBack}
        onClick={onStepBack}
      >
        <StepBack size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} aria-hidden />
      </button>
      <button type="button" className="button button--secondary" disabled={!canStep} onClick={onStep}>
        <StepForward size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} aria-hidden />
        {CONTROLS.step}
      </button>
      <button type="button" className="button button--primary" disabled={!canRun} onClick={onToggleAutoPlay}>
        {isAutoPlaying ? (
          <>
            <Pause size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} aria-hidden />
            {CONTROLS.pause}
          </>
        ) : (
          <>
            <Play size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} aria-hidden />
            {CONTROLS.autoPlay}
          </>
        )}
      </button>
      <button type="button" className="button button--secondary" disabled={!canRun} onClick={onSolveInstantly}>
        <Zap size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} aria-hidden />
        {CONTROLS.solveInstantly}
      </button>
      {onReset !== undefined && <ResetButton onReset={onReset} />}
    </div>
  )
}

export function ResetButton({ onReset }: { onReset: () => void }) {
  return (
    <button type="button" className="button button--ghost" onClick={onReset}>
      <RotateCcw size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} aria-hidden />
      {CONTROLS.reset}
    </button>
  )
}

type SpeedControlProps = {
  triesPerSecond: number
  onChangeSpeed: (triesPerSecond: number) => void
  canJumpToNextBacktrack: boolean
  onJumpToNextBacktrack: () => void
}

export function SpeedControl({
  triesPerSecond,
  onChangeSpeed,
  canJumpToNextBacktrack,
  onJumpToNextBacktrack,
}: SpeedControlProps) {
  const speedLabel = formatMessage(CONTROLS.speedValue, { speed: formatCount(triesPerSecond) })
  return (
    <div className="solver-controls__speed">
      <label className="solver-controls__speed-label" htmlFor={SPEED_SLIDER_ID}>
        {CONTROLS.speedLabel}
      </label>
      <input
        id={SPEED_SLIDER_ID}
        className="solver-controls__speed-slider"
        type="range"
        min={SPEED_SLIDER_MINIMUM}
        max={SPEED_SLIDER_MAXIMUM}
        value={speedToSliderPosition(triesPerSecond)}
        aria-valuetext={speedLabel}
        onChange={event => onChangeSpeed(sliderPositionToSpeed(Number(event.target.value)))}
      />
      <output className="solver-controls__speed-value" htmlFor={SPEED_SLIDER_ID}>
        {speedLabel}
      </output>
      <button
        type="button"
        className="button button--secondary button--compact solver-controls__jump"
        disabled={!canJumpToNextBacktrack}
        onClick={onJumpToNextBacktrack}
      >
        <SkipForward size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} aria-hidden />
        {CONTROLS.jumpToNextBacktrack}
      </button>
    </div>
  )
}
