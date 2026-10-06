import { useId } from 'react'
import '../../styles/components/comparison/HorizontalBarChart.css'

export type BarChartRow = {
  key: string
  label: string
  value: number | null
  valueText: string
  isActive: boolean
}

type HorizontalBarChartProps = {
  title: string
  note: string
  rows: BarChartRow[]
}

const FULL_WIDTH_PERCENT = 100

function barWidthPercent(value: number, largestValue: number): number {
  if (largestValue <= 0) {
    return 0
  }
  return (value / largestValue) * FULL_WIDTH_PERCENT
}

export function HorizontalBarChart({ title, note, rows }: HorizontalBarChartProps) {
  const measuredValues = rows.flatMap(row => (row.value === null ? [] : [row.value]))
  const largestValue = measuredValues.length === 0 ? 0 : Math.max(...measuredValues)
  const titleId = useId()

  return (
    <figure className="bar-chart card" aria-labelledby={titleId}>
      <figcaption>
        <p id={titleId} className="bar-chart__title">
          {title}
        </p>
        <p className="bar-chart__note">{note}</p>
      </figcaption>
      <ul className="bar-chart__rows">
        {rows.map(row => (
          <li key={row.key} className="bar-chart__row" data-active={row.isActive ? 'true' : undefined}>
            <span className="bar-chart__label">{row.label}</span>
            <span className="bar-chart__track">
              {row.value !== null && (
                <span
                  className="bar-chart__bar"
                  style={{ width: `${barWidthPercent(row.value, largestValue)}%` }}
                  aria-hidden
                />
              )}
              <span className="bar-chart__value">{row.valueText}</span>
            </span>
          </li>
        ))}
      </ul>
    </figure>
  )
}
