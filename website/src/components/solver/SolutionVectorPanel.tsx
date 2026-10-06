import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { formatMessage, messages } from '../../i18n/messages.ts'
import { memo, useState } from 'react'
import { ICON_SIZE, ICON_STROKE_WIDTH } from '../iconSizes.ts'
import type { HistoryStep } from '../../solver/solverHistory.ts'
import { EMPTY } from '../../solver/sudokuRules.ts'
import { formatCount } from '../../solverView/formatting.ts'
import { HISTORY_LIMIT_NOTICE } from '../../solverView/historyView.ts'
import type { SlotState, SlotView } from '../../solverView/solutionVectorView.ts'
import { RichText } from '../RichText.tsx'
import { useWholeRowsHeight } from '../../hooks/useWholeRowsHeight.ts'
import { HistoryList } from './HistoryList.tsx'
import '../../styles/components/solver/SolverPanels.css'

const HISTORY = messages.solver.history
const SOLUTION_VECTOR = messages.solver.solutionVector

type SolutionTab = 'solution' | 'history'

const SOLUTION_TAB_ID = 'solution-tab'
const HISTORY_TAB_ID = 'history-tab'
const SOLUTION_TAB_PANEL_ID = 'solution-tab-panel'
const HISTORY_TAB_PANEL_ID = 'history-tab-panel'

export type HistoryReview = {
  steps: HistoryStep[]
  reviewEventsBack: number
  reviewedTryCount: number
  onReviewSequence: (sequence: number) => void
  onReviewOlderStep: () => void
  onReviewNewerStep: () => void
  onReturnToLatest: () => void
}

type SolutionVectorPanelProps = {
  slotViews: SlotView[]
  currentIndex: number
  blankCount: number
  historyReview: HistoryReview
  isCollapsible: boolean
}

function SolutionSlots({ slotViews, fitsWholeRows }: { slotViews: SlotView[]; fitsWholeRows: boolean }) {
  const slotsRef = useWholeRowsHeight<HTMLDivElement>(fitsWholeRows)
  return (
    <div ref={slotsRef} className="solution-slots">
      {slotViews.map(slotView => (
        <SolutionSlot key={slotView.index} index={slotView.index} digit={slotView.digit} state={slotView.state} />
      ))}
    </div>
  )
}

function ReviewControls({ historyReview }: { historyReview: HistoryReview }) {
  const hasOlderStep = historyReview.steps.some(step => step.eventsBack > historyReview.reviewEventsBack)
  return (
    <div className="review-controls">
      <span className="review-controls__notice">
        <RichText
          text={formatMessage(HISTORY.reviewNotice, { tryCount: formatCount(historyReview.reviewedTryCount) })}
          strongClassName="tabular-numbers"
        />
      </span>
      <button
        type="button"
        className="button button--secondary button--compact"
        disabled={!hasOlderStep}
        onClick={historyReview.onReviewOlderStep}
      >
        <ChevronLeft size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} aria-hidden />
        {HISTORY.olderStep}
      </button>
      <button type="button" className="button button--secondary button--compact" onClick={historyReview.onReviewNewerStep}>
        {HISTORY.newerStep}
        <ChevronRight size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} aria-hidden />
      </button>
      <button type="button" className="button button--ghost button--compact" onClick={historyReview.onReturnToLatest}>
        {HISTORY.latestStep}
      </button>
    </div>
  )
}

function SolutionPosition({ currentIndex, blankCount }: { currentIndex: number; blankCount: number }) {
  return (
    <span className="tabular-numbers">
      {formatMessage(SOLUTION_VECTOR.position, { currentIndex, blankCount })}
    </span>
  )
}

export function SolutionVectorPanel({
  slotViews,
  currentIndex,
  blankCount,
  historyReview,
  isCollapsible,
}: SolutionVectorPanelProps) {
  const [selectedTab, setSelectedTab] = useState<SolutionTab>('solution')
  const isReviewing = historyReview.reviewEventsBack > 0
  const historyList = (
    <HistoryList
      steps={historyReview.steps}
      reviewEventsBack={historyReview.reviewEventsBack}
      onReviewSequence={historyReview.onReviewSequence}
    />
  )

  if (isCollapsible) {
    return (
      <>
        <details className="card collapsible-panel">
          <summary className="collapsible-panel__summary">
            <span className="collapsible-panel__heading">
              {SOLUTION_VECTOR.collapsedTitle}
              <span className="collapsible-panel__heading-end">
                <span className="collapsible-panel__position">
                  <SolutionPosition currentIndex={currentIndex} blankCount={blankCount} />
                </span>
                <ChevronDown className="collapsible-panel__chevron" size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} aria-hidden />
              </span>
            </span>
          </summary>
          <div className="collapsible-panel__content">
            <SolutionSlots slotViews={slotViews} fitsWholeRows={false} />
          </div>
        </details>
        <details className="card collapsible-panel" open={isReviewing ? true : undefined}>
          <summary className="collapsible-panel__summary">
            <span className="collapsible-panel__heading">
              {HISTORY.tabLabel}
              <span className="collapsible-panel__heading-end">
                <span className="collapsible-panel__position">{HISTORY_LIMIT_NOTICE}</span>
                <ChevronDown className="collapsible-panel__chevron" size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} aria-hidden />
              </span>
            </span>
          </summary>
          <div className="collapsible-panel__content history-panel__content">
            {isReviewing && <ReviewControls historyReview={historyReview} />}
            {historyList}
          </div>
        </details>
      </>
    )
  }

  return (
    <section className="card solver-panel solver-panel--fills-height">
      <div className="solver-panel__header solver-panel__header--tabs">
        <div className="solver-tabs" role="tablist" aria-label={SOLUTION_VECTOR.tabsLabel}>
          <button
            id={SOLUTION_TAB_ID}
            type="button"
            role="tab"
            className="solver-tabs__tab"
            aria-selected={selectedTab === 'solution'}
            aria-controls={SOLUTION_TAB_PANEL_ID}
            onClick={() => setSelectedTab('solution')}
          >
            {SOLUTION_VECTOR.tabLabel}
          </button>
          <button
            id={HISTORY_TAB_ID}
            type="button"
            role="tab"
            className="solver-tabs__tab"
            aria-selected={selectedTab === 'history'}
            aria-controls={HISTORY_TAB_PANEL_ID}
            onClick={() => setSelectedTab('history')}
          >
            {HISTORY.tabLabel}
          </button>
        </div>
        {isReviewing && <ReviewControls historyReview={historyReview} />}
        {!isReviewing && selectedTab === 'solution' && (
          <p className="solver-panel__caption">
            <SolutionPosition currentIndex={currentIndex} blankCount={blankCount} />
          </p>
        )}
        {!isReviewing && selectedTab === 'history' && <p className="solver-panel__caption">{HISTORY_LIMIT_NOTICE}</p>}
      </div>
      {selectedTab === 'solution' ? (
        <div id={SOLUTION_TAB_PANEL_ID} role="tabpanel" aria-labelledby={SOLUTION_TAB_ID} className="solver-tabs__panel">
          <SolutionSlots slotViews={slotViews} fitsWholeRows />
        </div>
      ) : (
        <div id={HISTORY_TAB_PANEL_ID} role="tabpanel" aria-labelledby={HISTORY_TAB_ID} className="solver-tabs__panel">
          {historyList}
        </div>
      )}
    </section>
  )
}

type SolutionSlotProps = {
  index: number
  digit: number
  state: SlotState
}

const SolutionSlot = memo(function SolutionSlot({ index, digit, state }: SolutionSlotProps) {
  return (
    <div className={`solution-slot solution-slot--${state}`}>
      <span className="solution-slot__digit">{digit === EMPTY ? '' : digit}</span>
      <span className="solution-slot__index">{index}</span>
    </div>
  )
})
