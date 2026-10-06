import { Square } from 'lucide-react'
import { messages } from '../../i18n/messages.ts'
import { ICON_SIZE, ICON_STROKE_WIDTH } from '../iconSizes.ts'
import type { StatusMessage } from '../../solverView/statusMessage.ts'
import { TONE_ICONS } from './toneIcons.ts'
import '../../styles/components/solver/SolverPanels.css'


type StatusMessageBoxProps = {
  message: StatusMessage
  id?: string
  isLiveRegionPaused?: boolean
  onStop?: () => void
}

export function StatusMessageBox({ message, id, isLiveRegionPaused = false, onStop }: StatusMessageBoxProps) {
  const ToneIcon = TONE_ICONS[message.tone]
  const isError = message.tone === 'error'
  const liveRegionProps = isError
    ? { role: 'alert' as const }
    : { role: 'status' as const, 'aria-live': isLiveRegionPaused ? ('off' as const) : ('polite' as const) }

  return (
    <div id={id} className={`status-message status-message--${message.tone}`}>
      <ToneIcon size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} aria-hidden />
      <span className="status-message__text" {...liveRegionProps}>
        {message.segments.map((segment, segmentIndex) =>
          segment.isEmphasized ? <strong key={segmentIndex}>{segment.text}</strong> : <span key={segmentIndex}>{segment.text}</span>,
        )}
      </span>
      {onStop !== undefined && (
        <button type="button" className="button button--secondary" onClick={onStop}>
          <Square size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} aria-hidden />
          {messages.solver.controls.stop}
        </button>
      )}
    </div>
  )
}
