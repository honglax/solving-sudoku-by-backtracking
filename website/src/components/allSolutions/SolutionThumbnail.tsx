import { memo } from 'react'
import { formatMessage, messages } from '../../i18n/messages.ts'
import { BOX_SIZE, cellPositionAt, EMPTY, SIZE, type Grid } from '../../solver/sudokuRules.ts'
import '../../styles/components/allSolutions/SolutionThumbnail.css'

const GALLERY = messages.allSolutions.gallery

type SolutionThumbnailProps = {
  solutionNumber: number
  solution: Grid
  puzzle: Grid
  firstSolution: Grid
}

function thumbnailCellClassName(index: number, isGiven: boolean, differsFromFirst: boolean): string {
  const { row, column } = cellPositionAt(index)
  const classNames = ['solution-thumbnail__cell']
  if (isGiven) {
    classNames.push('solution-thumbnail__cell--given')
  }
  if (differsFromFirst) {
    classNames.push('solution-thumbnail__cell--different')
  }
  if (column % BOX_SIZE === 0 && column < SIZE) {
    classNames.push('solution-thumbnail__cell--box-right-edge')
  }
  if (row % BOX_SIZE === 0 && row < SIZE) {
    classNames.push('solution-thumbnail__cell--box-bottom-edge')
  }
  return classNames.join(' ')
}

export const SolutionThumbnail = memo(function SolutionThumbnail({
  solutionNumber,
  solution,
  puzzle,
  firstSolution,
}: SolutionThumbnailProps) {
  const differentCellCount = solution.filter((digit, index) => digit !== firstSolution[index]).length
  const isFirstSolution = solutionNumber === 1
  const note = isFirstSolution
    ? GALLERY.firstItemNote
    : formatMessage(GALLERY.differenceNote, { count: differentCellCount })

  return (
    <figure className="solution-thumbnail">
      <div className="solution-thumbnail__grid" aria-hidden="true">
        {solution.map((digit, index) => (
          <span
            key={index}
            className={thumbnailCellClassName(index, puzzle[index] !== EMPTY, digit !== firstSolution[index])}
          >
            {digit}
          </span>
        ))}
      </div>
      <figcaption className="solution-thumbnail__caption">
        <span className="solution-thumbnail__title">{formatMessage(GALLERY.itemLabel, { number: solutionNumber })}</span>
        <span className="solution-thumbnail__note">{note}</span>
      </figcaption>
    </figure>
  )
})
