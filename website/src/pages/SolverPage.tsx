import { ChevronDown, SlidersHorizontal } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router'
import { ICON_SIZE, ICON_STROKE_WIDTH } from '../components/iconSizes.ts'
import type { PlaybackMode } from '../playback/playbackEngine.ts'
import { usePuzzleEditor } from '../hooks/usePuzzleEditor.ts'
import { useSolverPlayback } from '../hooks/useSolverPlayback.ts'
import { analyzePuzzle } from '../solver/puzzleValidator.ts'
import { countBlankCells } from '../solver/sudokuRules.ts'
import { buildGridView } from '../solverView/gridView.ts'
import { highlightForEvent } from '../solverView/pseudocode.ts'
import { buildSolutionVectorView } from '../solverView/solutionVectorView.ts'
import { buildStatusMessage, type PlaybackPhase } from '../solverView/statusMessage.ts'
import { PUZZLE_SEARCH_PARAMETER } from '../sitePages.ts'
import { useDocumentTitle } from '../hooks/useDocumentTitle.ts'
import { formatMessage, messages } from '../i18n/messages.ts'
import { currentPuzzleLabel } from '../solverView/puzzleLabels.ts'
import { PHONE_LAYOUT_QUERY, useMediaQuery } from '../hooks/useMediaQuery.ts'
import { GridLegend } from '../components/solver/GridLegend.tsx'
import { PastePuzzleDialog } from '../components/solver/PastePuzzleDialog.tsx'
import { ProgressPanel, SolverCounters } from '../components/solver/ProgressPanel.tsx'
import { PseudocodePanel } from '../components/solver/PseudocodePanel.tsx'
import { PlaybackControls, PuzzleControls, ResetButton, SpeedControl } from '../components/solver/SolverControls.tsx'
import { SolverOptionsSheet } from '../components/solver/SolverOptionsSheet.tsx'
import { SolutionVectorPanel } from '../components/solver/SolutionVectorPanel.tsx'
import { StatusMessageBox } from '../components/solver/StatusMessageBox.tsx'
import { SudokuGrid } from '../components/solver/SudokuGrid.tsx'
import '../styles/pages/SolverPage.css'


function playbackPhase(mode: PlaybackMode, isLongInstantSolve: boolean, isReviewing: boolean): PlaybackPhase {
  if (isReviewing) {
    return 'running'
  }
  if (mode === 'notStarted') {
    return 'notStarted'
  }
  if (mode === 'solvingInstantly' && isLongInstantSolve) {
    return 'solvingInstantlyLong'
  }
  if (mode === 'instantSolvePaused') {
    return 'instantSolvePaused'
  }
  if (mode === 'pausedAtFirstBacktrack') {
    return 'pausedAtFirstBacktrack'
  }
  return 'running'
}

export default function SolverPage() {
  useDocumentTitle(messages.solver.documentTitle)
  const isPhoneLayout = useMediaQuery(PHONE_LAYOUT_QUERY)
  const [searchParams, setSearchParams] = useSearchParams()
  const [initialPuzzleText] = useState(() => searchParams.get(PUZZLE_SEARCH_PARAMETER))
  const editor = usePuzzleEditor(initialPuzzleText)
  const playback = useSolverPlayback(editor.puzzle)
  const [isPasteDialogOpen, setIsPasteDialogOpen] = useState(false)
  const [isOptionsSheetOpen, setIsOptionsSheetOpen] = useState(false)
  const pasteButtonRef = useRef<HTMLButtonElement>(null)
  const optionsButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (searchParams.has(PUZZLE_SEARCH_PARAMETER)) {
      setSearchParams({}, { replace: true })
    }
  }, [searchParams, setSearchParams])

  const puzzleStatus = useMemo(() => analyzePuzzle(editor.puzzle), [editor.puzzle])
  const blankCount = useMemo(() => countBlankCells(editor.puzzle), [editor.puzzle])
  const progress = playback.progress
  const phase = playbackPhase(playback.mode, playback.isLongInstantSolve, playback.isReviewing)

  const cellViews = useMemo(
    () => buildGridView({ puzzle: editor.puzzle, lockedGivens: editor.lockedGivens, puzzleStatus, progress }),
    [editor.puzzle, editor.lockedGivens, puzzleStatus, progress],
  )
  const slotViews = useMemo(() => buildSolutionVectorView(blankCount, progress), [blankCount, progress])
  const message = buildStatusMessage({ puzzle: editor.puzzle, puzzleStatus, progress, phase })
  const highlight = highlightForEvent(progress?.lastPseudocodeEvent ?? null)

  const isSolvingInstantly = playback.mode === 'solvingInstantly'
  const canRun = puzzleStatus.kind === 'ready' && playback.mode !== 'finished' && !isSolvingInstantly
  const canStep = canRun || playback.isReviewing
  const isLiveRegionPaused = playback.mode === 'autoPlaying' || isSolvingInstantly
  const stopInstantSolve = phase === 'solvingInstantlyLong' ? playback.stopInstantSolve : undefined

  const grid = <SudokuGrid cellViews={cellViews} showLineNumbers={!isPhoneLayout} onTypeDigit={editor.typeDigit} />
  const pseudocodePanel = <PseudocodePanel highlight={highlight} isCollapsible={isPhoneLayout} />
  const solutionVectorPanel = (
    <SolutionVectorPanel
      slotViews={slotViews}
      currentIndex={progress?.currentIndex ?? 0}
      blankCount={blankCount}
      isCollapsible={isPhoneLayout}
      historyReview={{
        steps: playback.historySteps,
        reviewEventsBack: playback.reviewEventsBack,
        reviewedTryCount: progress?.tryCount ?? 0,
        onReviewSequence: playback.reviewSequence,
        onReviewOlderStep: playback.reviewOlderStep,
        onReviewNewerStep: playback.reviewNewerStep,
        onReturnToLatest: playback.returnToLatest,
      }}
    />
  )
  const playbackControls = (
    <PlaybackControls
      canRun={canRun}
      canStep={canStep}
      isAutoPlaying={playback.mode === 'autoPlaying'}
      onStep={playback.step}
      onToggleAutoPlay={playback.toggleAutoPlay}
      onSolveInstantly={playback.solveInstantly}
      onStepBack={playback.stepBack}
      canStepBack={playback.canStepBack && !isSolvingInstantly}
      onReset={isPhoneLayout ? undefined : playback.reset}
    />
  )
  const speedControl = (
    <SpeedControl
      triesPerSecond={playback.triesPerSecond}
      onChangeSpeed={playback.changeSpeed}
      canJumpToNextBacktrack={canRun}
      onJumpToNextBacktrack={playback.jumpToNextBacktrack}
    />
  )

  const pasteDialog = (
    <PastePuzzleDialog
      isOpen={isPasteDialogOpen}
      returnFocusTo={isPhoneLayout ? optionsButtonRef : pasteButtonRef}
      onClose={() => setIsPasteDialogOpen(false)}
      onLoadPuzzle={editor.loadPastedPuzzle}
    />
  )

  if (isPhoneLayout) {
    const closeOptionsSheet = () => setIsOptionsSheetOpen(false)
    return (
      <main className="solver-page solver-page--phone">
        <div className="solver-page__heading-row">
          <p className="solver-page__eyebrow">{messages.solver.eyebrow}</p>
          <button
            ref={optionsButtonRef}
            type="button"
            className="button button--secondary solver-page__options-button"
            aria-haspopup="dialog"
            onClick={() => setIsOptionsSheetOpen(true)}
          >
            <SlidersHorizontal size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} aria-hidden />
            {messages.solver.controls.options}
          </button>
        </div>
        <button
          type="button"
          className="solver-page__puzzle-switcher"
          aria-haspopup="dialog"
          aria-label={formatMessage(messages.solver.controls.changePuzzle, {
            label: currentPuzzleLabel(editor.source, editor.puzzle),
          })}
          onClick={() => setIsOptionsSheetOpen(true)}
        >
          <span className="solver-page__puzzle-switcher-label">{currentPuzzleLabel(editor.source, editor.puzzle)}</span>
          <ChevronDown size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} aria-hidden />
        </button>
        {grid}
        <StatusMessageBox message={message} isLiveRegionPaused={isLiveRegionPaused} onStop={stopInstantSolve} />
        <div className="card solver-page__phone-counters">
          <SolverCounters progress={progress} />
        </div>
        {pseudocodePanel}
        {solutionVectorPanel}
        <div className="solver-page__bottom-bar">{playbackControls}</div>
        <SolverOptionsSheet isOpen={isOptionsSheetOpen} returnFocusTo={optionsButtonRef} onClose={closeOptionsSheet}>
          <PuzzleControls
            source={editor.source}
            puzzle={editor.puzzle}
            onSelectSample={editor.selectSample}
            onOpenPasteDialog={() => {
              closeOptionsSheet()
              setIsPasteDialogOpen(true)
            }}
            onCheckPuzzle={() => {
              playback.reset()
              closeOptionsSheet()
            }}
          />
          <ResetButton
            onReset={() => {
              playback.reset()
              closeOptionsSheet()
            }}
          />
          {speedControl}
        </SolverOptionsSheet>
        {pasteDialog}
      </main>
    )
  }

  return (
    <main className="solver-page">
      <div className="solver-page__board">
        <p className="solver-page__eyebrow">{messages.solver.eyebrow}</p>
        {grid}
        <GridLegend />
        <PuzzleControls
          source={editor.source}
          puzzle={editor.puzzle}
          pasteButtonRef={pasteButtonRef}
          onSelectSample={editor.selectSample}
          onOpenPasteDialog={() => setIsPasteDialogOpen(true)}
          onCheckPuzzle={playback.reset}
        />
        {playbackControls}
        {speedControl}
      </div>
      <div className="solver-page__panels">
        {pseudocodePanel}
        {solutionVectorPanel}
        <ProgressPanel
          progress={progress}
          message={message}
          isLiveRegionPaused={isLiveRegionPaused}
          onStopInstantSolve={stopInstantSolve}
        />
      </div>
      {pasteDialog}
    </main>
  )
}
