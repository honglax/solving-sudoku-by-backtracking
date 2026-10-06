import { useEffect, useRef, useState, type FormEvent, type RefObject } from 'react'
import { messages } from '../../i18n/messages.ts'
import { parsePuzzle, type PuzzleParseError } from '../../solver/puzzleParser.ts'
import type { Grid } from '../../solver/sudokuRules.ts'
import { parseErrorMessage } from '../../solverView/statusMessage.ts'
import { StatusMessageBox } from './StatusMessageBox.tsx'
import '../../styles/components/solver/PastePuzzleDialog.css'

const EXAMPLE_PUZZLE_TEXT = [
  '5 3 X X 7 X X X X',
  '6 X X 1 9 5 X X X',
  'X 9 8 X X X X 6 X',
  '8 X X X 6 X X X 3',
  '4 X X 8 X 3 X X 1',
  '7 X X X 2 X X X 6',
  'X 6 X X X X 2 8 X',
  'X X X 4 1 9 X X 5',
  'X X X X 8 X X 7 9',
].join('\n')

const PASTE_DIALOG = messages.solver.pasteDialog
const TEXTAREA_ROWS = 9
const TITLE_ID = 'paste-dialog-title'
const DESCRIPTION_ID = 'paste-dialog-description'
const ERROR_ID = 'paste-dialog-error'

type PastePuzzleDialogProps = {
  isOpen: boolean
  returnFocusTo: RefObject<HTMLElement | null>
  onClose: () => void
  onLoadPuzzle: (grid: Grid) => void
}

export function PastePuzzleDialog({ isOpen, returnFocusTo, onClose, onLoadPuzzle }: PastePuzzleDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [puzzleText, setPuzzleText] = useState(EXAMPLE_PUZZLE_TEXT)
  const [parseError, setParseError] = useState<PuzzleParseError | null>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (dialog === null) {
      return
    }
    if (isOpen && !dialog.open) {
      dialog.showModal()
    }
    if (!isOpen && dialog.open) {
      dialog.close()
      returnFocusTo.current?.focus()
    }
  }, [isOpen, returnFocusTo])

  const closeDialog = () => {
    setParseError(null)
    onClose()
  }

  const submitPuzzle = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const parseResult = parsePuzzle(puzzleText)
    if (!parseResult.ok) {
      setParseError(parseResult.error)
      return
    }
    onLoadPuzzle(parseResult.grid)
    closeDialog()
  }

  const describedBy = parseError === null ? DESCRIPTION_ID : `${DESCRIPTION_ID} ${ERROR_ID}`

  return (
    <dialog
      ref={dialogRef}
      className="card paste-dialog"
      aria-labelledby={TITLE_ID}
      onCancel={event => {
        event.preventDefault()
        closeDialog()
      }}
    >
      <form className="paste-dialog__form" onSubmit={submitPuzzle}>
        <h2 id={TITLE_ID} className="paste-dialog__title">
          {PASTE_DIALOG.title}
        </h2>
        <p id={DESCRIPTION_ID}>{PASTE_DIALOG.description}</p>
        <div className="paste-dialog__field">
          <textarea
            className="paste-dialog__textarea"
            rows={TEXTAREA_ROWS}
            spellCheck={false}
            aria-labelledby={TITLE_ID}
            aria-describedby={describedBy}
            aria-invalid={parseError !== null}
            value={puzzleText}
            onChange={event => setPuzzleText(event.target.value)}
          />
          {parseError !== null && <StatusMessageBox id={ERROR_ID} message={parseErrorMessage(parseError)} />}
        </div>
        <div className="paste-dialog__actions">
          <button type="button" className="button button--ghost" onClick={closeDialog}>
            {PASTE_DIALOG.cancel}
          </button>
          <button type="submit" className="button button--primary">
            {PASTE_DIALOG.submit}
          </button>
        </div>
      </form>
    </dialog>
  )
}
