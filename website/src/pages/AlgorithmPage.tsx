import { Link } from 'react-router'
import { RichText } from '../components/RichText.tsx'
import { SudokuGrid } from '../components/solver/SudokuGrid.tsx'
import { useActiveSection } from '../hooks/useActiveSection.ts'
import { useDocumentTitle } from '../hooks/useDocumentTitle.ts'
import { formatMessage, messages, puzzleName } from '../i18n/messages.ts'
import { parsePuzzle } from '../solver/puzzleParser.ts'
import { analyzePuzzle } from '../solver/puzzleValidator.ts'
import {
  ANTI_BACKTRACKING_PUZZLE_ID,
  findSamplePuzzle,
  LISTED_SAMPLE_PUZZLES,
  type SamplePuzzle,
} from '../solver/samplePuzzles.ts'
import { createSolverProgress } from '../solver/solverProgress.ts'
import { solverLinkForPuzzle } from '../sitePages.ts'
import { formatCount } from '../solverView/formatting.ts'
import { buildGridView } from '../solverView/gridView.ts'
import { countPuzzleTextBlanks } from '../solverView/puzzleLabels.ts'
import '../styles/pages/AlgorithmPage.css'

const ALGORITHM = messages.algorithm

type ArticleSection = {
  id: string
  title: string
}

const ARTICLE_SECTIONS: ArticleSection[] = [
  { id: 'problem', title: ALGORITHM.sections.problem },
  { id: 'modelling', title: ALGORITHM.sections.modelling },
  { id: 'pseudocode-to-sudoku', title: ALGORITHM.sections.pseudocodeToSudoku },
  { id: 'complexity', title: ALGORITHM.sections.complexity },
  { id: 'measurements', title: ALGORITHM.sections.measurements },
  { id: 'anti-backtracking', title: ALGORITHM.sections.antiBacktracking },
]

const SECTION_IDS = ARTICLE_SECTIONS.map(section => section.id)
const ARTO_INKALA_PUZZLE_ID = 5
const WRONG_FIRST_CELL_TRY_COUNT = 540_052_062

function buildPuzzleOnlyGridView(puzzleText: string) {
  const parseResult = parsePuzzle(puzzleText)
  if (!parseResult.ok) {
    throw new Error('Anti-backtracking puzzle does not parse')
  }
  const puzzle = parseResult.grid
  return buildGridView({
    puzzle,
    lockedGivens: puzzle,
    puzzleStatus: analyzePuzzle(puzzle),
    progress: createSolverProgress(puzzle),
  })
}

function ignoreTypedDigit() {
  return
}

const ANTI_BACKTRACKING_PUZZLE = findSamplePuzzle(ANTI_BACKTRACKING_PUZZLE_ID)
const ARTO_INKALA_PUZZLE = findSamplePuzzle(ARTO_INKALA_PUZZLE_ID)
const ANTI_BACKTRACKING_GRID_VIEW = buildPuzzleOnlyGridView(ANTI_BACKTRACKING_PUZZLE.puzzle)
const COMPARED_PUZZLES: SamplePuzzle[] = [ARTO_INKALA_PUZZLE, ANTI_BACKTRACKING_PUZZLE]
const SLOWDOWN_FACTOR = Math.round(ANTI_BACKTRACKING_PUZZLE.measured.tryCount / ARTO_INKALA_PUZZLE.measured.tryCount)
const ANTI_BACKTRACKING_REASON_VALUES = {
  wrongFirstCellTryCount: formatCount(WRONG_FIRST_CELL_TRY_COUNT),
  wrongFirstCellPercent: ALGORITHM.wrongFirstCellPercent,
}

function MeasurementTable({ puzzles, showPuzzleNumber }: { puzzles: SamplePuzzle[]; showPuzzleNumber: boolean }) {
  const COLUMNS = ALGORITHM.measurementColumns
  return (
    <div className="data-table">
      <table>
        <thead>
          <tr>
            <th scope="col">{COLUMNS.puzzle}</th>
            <th scope="col" className="data-table__number">{COLUMNS.blankCount}</th>
            <th scope="col" className="data-table__number">{COLUMNS.tryCount}</th>
            <th scope="col" className="data-table__number">{COLUMNS.recordCount}</th>
            <th scope="col" className="data-table__number">{COLUMNS.restoreCount}</th>
          </tr>
        </thead>
        <tbody>
          {puzzles.map(sample => (
            <tr key={sample.id}>
              <td>
                {showPuzzleNumber
                  ? formatMessage(ALGORITHM.measurementRowLabel, { id: sample.id, name: puzzleName(sample.id) })
                  : puzzleName(sample.id)}
              </td>
              <td className="data-table__number">{formatCount(countPuzzleTextBlanks(sample.puzzle))}</td>
              <td className="data-table__number">{formatCount(sample.measured.tryCount)}</td>
              <td className="data-table__number">{formatCount(sample.measured.recordCount)}</td>
              <td className="data-table__number">{formatCount(sample.measured.restoreCount)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function AlgorithmPage() {
  useDocumentTitle(ALGORITHM.documentTitle)
  const activeSectionId = useActiveSection(SECTION_IDS)

  return (
    <>
      <div className="page-band">
        <div className="page-band__inner algorithm-page__width">
          <h1 className="page-title">{ALGORITHM.title}</h1>
        </div>
      </div>
      <main className="algorithm-page algorithm-page__width">
        <article className="algorithm-article">
          <section id="problem">
            <h2>{ALGORITHM.sections.problem}</h2>
            <div className="algorithm-article__io">
              <div className="card algorithm-article__io-card">
                <p className="algorithm-article__io-label">{ALGORITHM.inputLabel}</p>
                <p>{ALGORITHM.inputText}</p>
              </div>
              <div className="card algorithm-article__io-card">
                <p className="algorithm-article__io-label">{ALGORITHM.outputLabel}</p>
                <p>{ALGORITHM.outputText}</p>
              </div>
            </div>
          </section>

          <section id="modelling">
            <h2>{ALGORITHM.sections.modelling}</h2>
            <ul>
              {ALGORITHM.modellingPoints.map(point => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </section>

          <section id="pseudocode-to-sudoku">
            <h2>{ALGORITHM.sections.pseudocodeToSudoku}</h2>
            <div className="data-table">
              <table>
                <thead>
                  <tr>
                    <th scope="col" className="data-table__half">
                      {ALGORITHM.mappingColumns.pseudocode}
                    </th>
                    <th scope="col">{ALGORITHM.mappingColumns.inSudoku}</th>
                  </tr>
                </thead>
                <tbody>
                  {ALGORITHM.mappings.map(mapping => (
                    <tr key={mapping.pseudocode}>
                      <td>
                        <code className="inline-code">{mapping.pseudocode}</code>
                      </td>
                      <td>
                        {mapping.isSudokuSideCode ? <code className="inline-code">{mapping.inSudoku}</code> : mapping.inSudoku}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section id="complexity">
            <h2>{ALGORITHM.sections.complexity}</h2>
            <p className="algorithm-article__paragraph">{ALGORITHM.complexityIntro}</p>
            <pre className="algorithm-article__derivation">{ALGORITHM.complexityDerivation.join('\n')}</pre>
            <p className="algorithm-article__paragraph">{ALGORITHM.complexityConclusion}</p>
          </section>

          <section id="measurements">
            <h2>{ALGORITHM.sections.measurements}</h2>
            <figure className="algorithm-article__figure">
              <MeasurementTable puzzles={LISTED_SAMPLE_PUZZLES} showPuzzleNumber />
              <figcaption className="algorithm-article__caption">{ALGORITHM.measurementCaption}</figcaption>
            </figure>
          </section>

          <section id="anti-backtracking">
            <h2>{ALGORITHM.sections.antiBacktracking}</h2>
            <p className="algorithm-article__paragraph">
              <RichText text={ALGORITHM.antiBacktrackingIntro} />
            </p>
            <figure className="algorithm-article__puzzle" role="img" aria-label={ALGORITHM.antiBacktrackingPictureLabel}>
              <SudokuGrid cellViews={ANTI_BACKTRACKING_GRID_VIEW} showLineNumbers={false} onTypeDigit={ignoreTypedDigit} />
            </figure>
            <h3 className="algorithm-article__subheading">{ALGORITHM.antiBacktrackingWhyTitle}</h3>
            <ul>
              {ALGORITHM.antiBacktrackingReasons.map(reason => (
                <li key={reason}>{formatMessage(reason, ANTI_BACKTRACKING_REASON_VALUES)}</li>
              ))}
            </ul>
            <figure className="algorithm-article__figure algorithm-article__comparison">
              <MeasurementTable puzzles={COMPARED_PUZZLES} showPuzzleNumber={false} />
              <figcaption className="algorithm-article__caption">
                {formatMessage(ALGORITHM.antiBacktrackingComparisonCaption, { slowdownFactor: formatCount(SLOWDOWN_FACTOR) })}
              </figcaption>
            </figure>
            <p className="algorithm-article__paragraph">{ALGORITHM.antiBacktrackingConclusion}</p>
            <div className="algorithm-article__try-it">
              <Link className="button button--secondary" to={solverLinkForPuzzle(ANTI_BACKTRACKING_PUZZLE.puzzle)}>
                {ALGORITHM.antiBacktrackingTryButton}
              </Link>
              <p className="algorithm-article__caption">{ALGORITHM.antiBacktrackingTryNote}</p>
            </div>
          </section>
        </article>

        <aside className="algorithm-toc">
          <nav aria-labelledby="algorithm-toc-title">
            <p id="algorithm-toc-title" className="algorithm-toc__title">
              {ALGORITHM.tableOfContentsTitle}
            </p>
            {ARTICLE_SECTIONS.map(section => (
              <a
                key={section.id}
                className="algorithm-toc__link"
                href={`#${section.id}`}
                aria-current={activeSectionId === section.id ? 'true' : undefined}
              >
                {section.title}
              </a>
            ))}
          </nav>
        </aside>
      </main>
    </>
  )
}
