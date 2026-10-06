import type { CellState } from '../../solverView/gridView.ts'
import { messages } from '../../i18n/messages.ts'
import '../../styles/components/solver/GridLegend.css'

type LegendEntry = {
  state: CellState
  label: string
}

const LEGEND_ENTRIES: LegendEntry[] = [
  { state: 'given', label: messages.solver.legend.given },
  { state: 'trying', label: messages.solver.legend.trying },
  { state: 'rejected', label: messages.solver.legend.rejected },
  { state: 'recorded', label: messages.solver.legend.recorded },
  { state: 'restored', label: messages.solver.legend.restored },
  { state: 'solved', label: messages.solver.legend.solved },
]

const SAMPLE_DIGIT = 5

export function GridLegend() {
  return (
    <div className="grid-legend">
      {LEGEND_ENTRIES.map(entry => (
        <span key={entry.state} className="grid-legend__entry">
          <span className={`grid-legend__swatch grid-legend__swatch--${entry.state}`} aria-hidden="true">
            <span className="grid-legend__digit">{SAMPLE_DIGIT}</span>
          </span>
          {entry.label}
        </span>
      ))}
    </div>
  )
}
