import { useEffect, useRef, type ReactNode, type RefObject } from 'react'
import { messages } from '../../i18n/messages.ts'
import '../../styles/components/solver/SolverOptionsSheet.css'

const TITLE_ID = 'solver-options-title'

type SolverOptionsSheetProps = {
  isOpen: boolean
  returnFocusTo: RefObject<HTMLElement | null>
  onClose: () => void
  children: ReactNode
}

export function SolverOptionsSheet({ isOpen, returnFocusTo, onClose, children }: SolverOptionsSheetProps) {
  const sheetRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const sheet = sheetRef.current
    if (sheet === null) {
      return
    }
    if (isOpen && !sheet.open) {
      sheet.showModal()
    }
    if (!isOpen && sheet.open) {
      sheet.close()
      returnFocusTo.current?.focus()
    }
  }, [isOpen, returnFocusTo])

  return (
    <dialog
      ref={sheetRef}
      className="options-sheet"
      aria-labelledby={TITLE_ID}
      onCancel={event => {
        event.preventDefault()
        onClose()
      }}
      onClick={event => {
        if (event.target === sheetRef.current) {
          onClose()
        }
      }}
    >
      <div className="options-sheet__content">
        <div className="options-sheet__header">
          <h2 id={TITLE_ID} className="options-sheet__title">
            {messages.solver.optionsSheet.title}
          </h2>
          <button type="button" className="button button--ghost" onClick={onClose}>
            {messages.solver.optionsSheet.close}
          </button>
        </div>
        {children}
      </div>
    </dialog>
  )
}
