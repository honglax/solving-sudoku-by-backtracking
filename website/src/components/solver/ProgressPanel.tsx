import type { SolverProgress } from '../../solver/solverProgress.ts'
import { messages } from '../../i18n/messages.ts'
import { formatCount } from '../../solverView/formatting.ts'
import type { StatusMessage } from '../../solverView/statusMessage.ts'
import { StatusMessageBox } from './StatusMessageBox.tsx'
import '../../styles/components/solver/SolverPanels.css'

type CounterValues = Pick<SolverProgress, 'tryCount' | 'recordCount' | 'restoreCount'>

export function SolverCounters({ progress }: { progress: CounterValues | null }) {
  const counters = [
    { label: messages.solver.progress.tryCount, value: progress?.tryCount ?? 0 },
    { label: messages.solver.progress.recordCount, value: progress?.recordCount ?? 0 },
    { label: messages.solver.progress.restoreCount, value: progress?.restoreCount ?? 0 },
  ]
  return (
    <div className="solver-counters">
      {counters.map(counter => (
        <div key={counter.label} className="solver-counter">
          <div className="solver-counter__value">{formatCount(counter.value)}</div>
          <div className="solver-counter__label">{counter.label}</div>
        </div>
      ))}
    </div>
  )
}

type ProgressPanelProps = {
  progress: SolverProgress | null
  message: StatusMessage
  isLiveRegionPaused: boolean
  onStopInstantSolve?: () => void
}

export function ProgressPanel({ progress, message, isLiveRegionPaused, onStopInstantSolve }: ProgressPanelProps) {
  return (
    <section className="card solver-panel">
      <div className="progress-panel__summary">
        <h2 className="solver-panel__title">{messages.solver.progress.panelTitle}</h2>
        <SolverCounters progress={progress} />
      </div>
      <StatusMessageBox message={message} isLiveRegionPaused={isLiveRegionPaused} onStop={onStopInstantSolve} />
    </section>
  )
}
