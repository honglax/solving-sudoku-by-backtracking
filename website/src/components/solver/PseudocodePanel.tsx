import { ChevronDown } from 'lucide-react'
import { messages } from '../../i18n/messages.ts'
import { ICON_SIZE, ICON_STROKE_WIDTH } from '../iconSizes.ts'
import { PSEUDOCODE_LINES, type PseudocodeHighlight } from '../../solverView/pseudocode.ts'
import '../../styles/components/solver/SolverPanels.css'

const PSEUDOCODE = messages.solver.pseudocode

type PseudocodeLineProps = {
  lineText: string
  isRunning: boolean
  highlight: PseudocodeHighlight | null
}

function PseudocodeLine({ lineText, isRunning, highlight }: PseudocodeLineProps) {
  return (
    <div
      className={isRunning ? 'pseudocode__line pseudocode__line--running' : 'pseudocode__line'}
      aria-current={isRunning ? 'step' : undefined}
    >
      {lineText}
      {isRunning && highlight?.checkResult === 'accepted' && <span className="check-tag check-tag--accepted">{PSEUDOCODE.acceptedTag}</span>}
      {isRunning && highlight?.checkResult === 'rejected' && <span className="check-tag check-tag--rejected">{PSEUDOCODE.rejectedTag}</span>}
    </div>
  )
}

function PseudocodeBlock({ highlight }: { highlight: PseudocodeHighlight | null }) {
  return (
    <div className="pseudocode">
      {PSEUDOCODE_LINES.map((lineText, lineIndex) => {
        const lineNumber = lineIndex + 1
        return (
          <PseudocodeLine
            key={lineNumber}
            lineText={lineText}
            isRunning={highlight?.lineNumber === lineNumber}
            highlight={highlight}
          />
        )
      })}
    </div>
  )
}

type PseudocodePanelProps = {
  highlight: PseudocodeHighlight | null
  isCollapsible: boolean
  caption?: string
}

export function PseudocodePanel({ highlight, isCollapsible, caption = PSEUDOCODE.caption }: PseudocodePanelProps) {
  if (isCollapsible) {
    return (
      <details className="card collapsible-panel">
        <summary className="collapsible-panel__summary">
          <span className="collapsible-panel__heading">
            {PSEUDOCODE.collapsedTitle}
            <ChevronDown className="collapsible-panel__chevron" size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} aria-hidden />
          </span>
          {highlight !== null && (
            <span className="pseudocode collapsible-panel__preview">
              <PseudocodeLine
                lineText={PSEUDOCODE_LINES[highlight.lineNumber - 1].trim()}
                isRunning
                highlight={highlight}
              />
            </span>
          )}
        </summary>
        <div className="collapsible-panel__content">
          <PseudocodeBlock highlight={highlight} />
        </div>
      </details>
    )
  }

  return (
    <section className="card solver-panel">
      <div className="solver-panel__header">
        <h2 className="solver-panel__title">{PSEUDOCODE.title}</h2>
        <p className="solver-panel__caption">{caption}</p>
      </div>
      <PseudocodeBlock highlight={highlight} />
    </section>
  )
}
