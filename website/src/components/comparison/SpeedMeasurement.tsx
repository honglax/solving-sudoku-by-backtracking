import { ChevronDown } from 'lucide-react'
import { useId, useState } from 'react'
import { COMPARISON_METHODS, type ListedComparisonMethod } from '../../comparison/comparisonMethods.ts'
import type { MethodMeasurement } from '../../comparison/comparisonMeasurement.ts'
import { useComparisonMeasurement, type MeasurementStatus } from '../../hooks/useComparisonMeasurement.ts'
import { formatMessage, messages } from '../../i18n/messages.ts'
import { parsePuzzle } from '../../solver/puzzleParser.ts'
import {
  ANTI_BACKTRACKING_PUZZLE_ID,
  findSamplePuzzle,
  LISTED_SAMPLE_PUZZLES,
  type SamplePuzzle,
} from '../../solver/samplePuzzles.ts'
import type { Grid } from '../../solver/sudokuRules.ts'
import { formatCount, formatMilliseconds } from '../../solverView/formatting.ts'
import { samplePuzzleLabel, unlistedPuzzleLabel } from '../../solverView/puzzleLabels.ts'
import { ICON_SIZE, ICON_STROKE_WIDTH } from '../iconSizes.ts'
import { HorizontalBarChart, type BarChartRow } from './HorizontalBarChart.tsx'
import '../../styles/components/DataTable.css'
import '../../styles/components/comparison/SpeedMeasurement.css'

const COMPARISON = messages.comparison
const MEASURE = COMPARISON.measure
const DEFAULT_MEASURED_PUZZLE_ID = 5
const SLOW_MEASUREMENT_TRY_COUNT = 50_000_000

const MEASURABLE_PUZZLES: SamplePuzzle[] = [...LISTED_SAMPLE_PUZZLES, findSamplePuzzle(ANTI_BACKTRACKING_PUZZLE_ID)]

function puzzleOptionLabel(sample: SamplePuzzle): string {
  return sample.isListed ? samplePuzzleLabel(sample) : unlistedPuzzleLabel(sample)
}

function parseSamplePuzzle(sample: SamplePuzzle): Grid {
  const parseResult = parsePuzzle(sample.puzzle)
  if (!parseResult.ok) {
    throw new Error(`Sample puzzle ${sample.id} does not parse`)
  }
  return parseResult.grid
}

function comparisonMethodName(method: ListedComparisonMethod): string {
  return formatMessage(COMPARISON.methodName, {
    order: COMPARISON.cellOrders[method.cellOrder],
    check: COMPARISON.checks.strategies[method.checkStrategy].name,
  })
}

function statusText(status: MeasurementStatus, measuredCount: number, currentMethod: ListedComparisonMethod | null): string {
  const totalCount = COMPARISON_METHODS.length
  if (status === 'measuring' && currentMethod !== null) {
    return formatMessage(MEASURE.status.measuring, { method: comparisonMethodName(currentMethod), measuredCount, totalCount })
  }
  if (status === 'finished') {
    return formatMessage(MEASURE.status.finished, { totalCount })
  }
  if (status === 'stopped') {
    return MEASURE.status.stopped
  }
  return MEASURE.status.idle
}

function countText(measurement: MethodMeasurement | undefined, readCount: (measured: MethodMeasurement) => number): string {
  if (measurement === undefined) {
    return MEASURE.notMeasured
  }
  return formatCount(readCount(measurement))
}

export function SpeedMeasurement() {
  const puzzleSelectId = useId()
  const [selectedPuzzleId, setSelectedPuzzleId] = useState(DEFAULT_MEASURED_PUZZLE_ID)
  const { status, measurements, currentMethodId, start, stop, reset } = useComparisonMeasurement()

  const selectedPuzzle = findSamplePuzzle(selectedPuzzleId)
  const isMeasuring = status === 'measuring'
  const hasMeasurements = Object.keys(measurements).length > 0
  const currentMethod = COMPARISON_METHODS.find(method => method.id === currentMethodId) ?? null
  const isSlowPuzzle = selectedPuzzle.measured.tryCount >= SLOW_MEASUREMENT_TRY_COUNT

  const changePuzzle = (puzzleId: number) => {
    setSelectedPuzzleId(puzzleId)
    reset()
  }

  const chartRows = (valueOf: (measurement: MethodMeasurement) => number, formatValue: (value: number) => string) =>
    COMPARISON_METHODS.map((method): BarChartRow => {
      const measurement = measurements[method.id]
      const value = measurement === undefined ? null : valueOf(measurement)
      return {
        key: method.id,
        label: comparisonMethodName(method),
        value,
        valueText: value === null ? MEASURE.notMeasured : formatValue(value),
        isActive: method.id === currentMethodId,
      }
    })

  return (
    <div className="speed-measurement">
      <p className="speed-measurement__intro">{MEASURE.intro}</p>
      <div className="speed-measurement__controls">
        <label className="speed-measurement__label" htmlFor={puzzleSelectId}>
          {MEASURE.puzzleSelectLabel}
        </label>
        <div className="speed-measurement__row">
          <div className="select-field">
            <select
              id={puzzleSelectId}
              className="select-field__control"
              value={selectedPuzzleId}
              disabled={isMeasuring}
              onChange={event => changePuzzle(Number(event.target.value))}
            >
              {MEASURABLE_PUZZLES.map(sample => (
                <option key={sample.id} value={sample.id}>
                  {puzzleOptionLabel(sample)}
                </option>
              ))}
            </select>
            <ChevronDown className="select-field__icon" size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} aria-hidden />
          </div>
          {isMeasuring ? (
            <button type="button" className="button button--secondary" onClick={stop}>
              {MEASURE.stopButton}
            </button>
          ) : (
            <button type="button" className="button button--primary" onClick={() => start(parseSamplePuzzle(selectedPuzzle))}>
              {status === 'idle' ? MEASURE.startButton : MEASURE.restartButton}
            </button>
          )}
        </div>
        <p className="speed-measurement__status" role="status">
          {statusText(status, Object.keys(measurements).length, currentMethod)}
        </p>
        {isSlowPuzzle && (
          <p className="speed-measurement__note">
            {formatMessage(MEASURE.slowPuzzleNote, { tryCount: formatCount(selectedPuzzle.measured.tryCount) })}
          </p>
        )}
      </div>

      {(hasMeasurements || isMeasuring) && (
        <>
          <HorizontalBarChart
            title={MEASURE.timeChart.title}
            note={MEASURE.timeChart.note}
            rows={chartRows(measurement => measurement.millisecondsPerRun, formatMilliseconds)}
          />
          <HorizontalBarChart
            title={MEASURE.tryChart.title}
            note={MEASURE.tryChart.note}
            rows={chartRows(measurement => measurement.counts.tryCount, formatCount)}
          />
          <details className="speed-measurement__details">
            <summary>{MEASURE.tableToggle}</summary>
            <figure className="speed-measurement__table">
              <div className="data-table">
                <table>
                  <thead>
                    <tr>
                      <th scope="col">{MEASURE.columns.method}</th>
                      <th scope="col" className="data-table__number">{MEASURE.columns.tryCount}</th>
                      <th scope="col" className="data-table__number">{MEASURE.columns.recordCount}</th>
                      <th scope="col" className="data-table__number">{MEASURE.columns.restoreCount}</th>
                      <th scope="col" className="data-table__number">{MEASURE.columns.checkReadCount}</th>
                      <th scope="col" className="data-table__number">{MEASURE.columns.cellChoiceReadCount}</th>
                      <th scope="col" className="data-table__number">{MEASURE.columns.millisecondsPerRun}</th>
                      <th scope="col" className="data-table__number">{MEASURE.columns.runCount}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {COMPARISON_METHODS.map(method => {
                      const measurement = measurements[method.id]
                      return (
                        <tr key={method.id}>
                          <td className="speed-measurement__method-cell">{comparisonMethodName(method)}</td>
                          <td className="data-table__number">{countText(measurement, measured => measured.counts.tryCount)}</td>
                          <td className="data-table__number">{countText(measurement, measured => measured.counts.recordCount)}</td>
                          <td className="data-table__number">{countText(measurement, measured => measured.counts.restoreCount)}</td>
                          <td className="data-table__number">
                            {countText(measurement, measured => measured.counts.checkReadCount)}
                          </td>
                          <td className="data-table__number">
                            {countText(measurement, measured => measured.counts.cellChoiceReadCount)}
                          </td>
                          <td className="data-table__number">
                            {measurement === undefined ? MEASURE.notMeasured : formatMilliseconds(measurement.millisecondsPerRun)}
                          </td>
                          <td className="data-table__number">{countText(measurement, measured => measured.runCount)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              <figcaption className="speed-measurement__caption">{MEASURE.tableCaption}</figcaption>
            </figure>
          </details>
        </>
      )}
    </div>
  )
}
