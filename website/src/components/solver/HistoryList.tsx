import { memo, useLayoutEffect, useRef } from 'react'
import { formatMessage, messages } from '../../i18n/messages.ts'
import type { SolverEvent } from '../../solver/solverEvents.ts'
import type { HistoryStep } from '../../solver/solverHistory.ts'
import { formatCount } from '../../solverView/formatting.ts'
import { describeHistoryEvent, HISTORY_LIMIT_REACHED_NOTICE, isHistoryFull } from '../../solverView/historyView.ts'
import { ICON_SIZE, ICON_STROKE_WIDTH } from '../iconSizes.ts'
import { TONE_ICONS } from './toneIcons.ts'
import '../../styles/components/solver/HistoryList.css'

const HISTORY = messages.solver.history

type HistoryListProps = {
  steps: HistoryStep[]
  reviewEventsBack: number
  onReviewSequence: (sequence: number) => void
}

function keepRowVisible(scrollContainer: HTMLElement, row: HTMLElement, headerHeight: number) {
  const containerBox = scrollContainer.getBoundingClientRect()
  const rowBox = row.getBoundingClientRect()
  const visibleTop = containerBox.top + headerHeight
  if (rowBox.top < visibleTop) {
    scrollContainer.scrollTop -= visibleTop - rowBox.top
  } else if (rowBox.bottom > containerBox.bottom) {
    scrollContainer.scrollTop += rowBox.bottom - containerBox.bottom
  }
}

export function HistoryList({ steps, reviewEventsBack, onReviewSequence }: HistoryListProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const previousScrollHeightRef = useRef(0)

  useLayoutEffect(() => {
    const scrollContainer = scrollContainerRef.current
    if (scrollContainer === null) {
      return
    }
    const addedHeight = scrollContainer.scrollHeight - previousScrollHeightRef.current
    const isReadingOlderSteps = scrollContainer.scrollTop > 0
    if (isReadingOlderSteps && addedHeight > 0) {
      scrollContainer.scrollTop += addedHeight
    }
    previousScrollHeightRef.current = scrollContainer.scrollHeight
  }, [steps])

  useLayoutEffect(() => {
    const scrollContainer = scrollContainerRef.current
    if (scrollContainer === null || reviewEventsBack === 0) {
      return
    }
    const reviewedRow = scrollContainer.querySelector<HTMLElement>('tr[aria-current="step"]')
    const header = scrollContainer.querySelector<HTMLElement>('thead')
    if (reviewedRow !== null) {
      keepRowVisible(scrollContainer, reviewedRow, header?.offsetHeight ?? 0)
    }
  }, [reviewEventsBack])

  if (steps.length === 0) {
    return <p className="history-table__empty">{HISTORY.empty}</p>
  }

  const isReviewing = reviewEventsBack > 0
  return (
    <div ref={scrollContainerRef} className="history-table">
      <table>
        <caption className="visually-hidden">{HISTORY.caption}</caption>
        <thead>
          <tr>
            <th scope="col" className="history-table__number">{HISTORY.columns.tryNumber}</th>
            <th scope="col">{HISTORY.columns.cell}</th>
            <th scope="col" className="history-table__digit">{HISTORY.columns.digit}</th>
            <th scope="col">{HISTORY.columns.result}</th>
            <th scope="col">{HISTORY.columns.reason}</th>
          </tr>
        </thead>
        <tbody>
          {steps.map(step => (
            <HistoryRow
              key={step.sequence}
              sequence={step.sequence}
              event={step.event}
              tryCount={step.tryCount}
              isReviewed={isReviewing && step.eventsBack === reviewEventsBack}
              onReviewSequence={onReviewSequence}
            />
          ))}
        </tbody>
        {isHistoryFull(steps.length) && (
          <tfoot>
            <tr>
              <td colSpan={5} className="history-table__limit-notice">
                {HISTORY_LIMIT_REACHED_NOTICE}
              </td>
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  )
}

type HistoryRowProps = {
  sequence: number
  event: SolverEvent
  tryCount: number
  isReviewed: boolean
  onReviewSequence: (sequence: number) => void
}

const HistoryRow = memo(function HistoryRow({ sequence, event, tryCount, isReviewed, onReviewSequence }: HistoryRowProps) {
  const rowView = describeHistoryEvent(event)
  const ToneIcon = TONE_ICONS[rowView.tone]
  const tryCountText = formatCount(tryCount)
  return (
    <tr
      className={isReviewed ? 'history-table__row history-table__row--reviewed' : 'history-table__row'}
      aria-current={isReviewed ? 'step' : undefined}
      onClick={() => onReviewSequence(sequence)}
    >
      <td className="history-table__number">
        <button
          type="button"
          className="history-table__review-button"
          aria-label={formatMessage(HISTORY.reviewButtonLabel, { tryCount: tryCountText, result: rowView.resultText })}
          onClick={clickEvent => {
            clickEvent.stopPropagation()
            onReviewSequence(sequence)
          }}
        >
          {tryCountText}
        </button>
      </td>
      <td className="history-table__cell">{rowView.cellText}</td>
      <td className="history-table__digit">{rowView.digitText}</td>
      <td>
        <span className={`history-table__result history-table__result--${rowView.tone}`}>
          <ToneIcon size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} aria-hidden />
          <span className="history-table__result-text">{rowView.resultText}</span>
        </span>
      </td>
      <td className="history-table__reason">{rowView.reasonText}</td>
    </tr>
  )
})
