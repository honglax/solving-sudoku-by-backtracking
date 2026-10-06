import { SolverRace } from '../components/comparison/SolverRace.tsx'
import { SpeedMeasurement } from '../components/comparison/SpeedMeasurement.tsx'
import { CHECK_STRATEGIES } from '../comparison/comparisonMethods.ts'
import { useDocumentTitle } from '../hooks/useDocumentTitle.ts'
import { formatMessage, messages } from '../i18n/messages.ts'
import { findSamplePuzzle } from '../solver/samplePuzzles.ts'
import { formatCount } from '../solverView/formatting.ts'
import '../styles/pages/ComparisonPage.css'

const COMPARISON = messages.comparison
const ARTO_INKALA_PUZZLE_ID = 5
const EASTER_MONSTER_PUZZLE_ID = 11

const ARTO_INKALA_PUZZLE = findSamplePuzzle(ARTO_INKALA_PUZZLE_ID)
const EASTER_MONSTER_PUZZLE = findSamplePuzzle(EASTER_MONSTER_PUZZLE_ID)
const TAKEAWAY_VALUES = {
  easterMonsterRowMajorTryCount: formatCount(EASTER_MONSTER_PUZZLE.measured.tryCount),
  easterMonsterFewestTryCount: formatCount(EASTER_MONSTER_PUZZLE.measuredWithFewestCandidatesFirst.tryCount),
  inkalaRowMajorTryCount: formatCount(ARTO_INKALA_PUZZLE.measured.tryCount),
  inkalaFewestTryCount: formatCount(ARTO_INKALA_PUZZLE.measuredWithFewestCandidatesFirst.tryCount),
}

export default function ComparisonPage() {
  useDocumentTitle(COMPARISON.documentTitle)

  return (
    <>
      <div className="page-band">
        <div className="page-band__inner comparison-page__width">
          <h1 className="page-title">{COMPARISON.title}</h1>
          <p className="comparison-page__intro">{COMPARISON.intro}</p>
        </div>
      </div>
      <main className="comparison-page comparison-page__width">
        <section className="comparison-page__section" aria-labelledby="comparison-race">
          <h2 id="comparison-race">{COMPARISON.sections.race}</h2>
          <p className="comparison-page__paragraph">{COMPARISON.race.intro}</p>
          <SolverRace />
        </section>

        <section className="comparison-page__section" aria-labelledby="comparison-checks">
          <h2 id="comparison-checks">{COMPARISON.sections.checks}</h2>
          <p className="comparison-page__paragraph">
            {formatMessage(COMPARISON.checks.intro, { inkalaTryCount: TAKEAWAY_VALUES.inkalaRowMajorTryCount })}
          </p>
          <div className="comparison-page__checks">
            {CHECK_STRATEGIES.map(checkStrategy => (
              <div key={checkStrategy} className="card comparison-check">
                <h3 className="comparison-check__title">{COMPARISON.checks.strategies[checkStrategy].name}</h3>
                <p>{COMPARISON.checks.strategies[checkStrategy].description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="comparison-page__section" aria-labelledby="comparison-measure">
          <h2 id="comparison-measure">{COMPARISON.sections.measure}</h2>
          <SpeedMeasurement />
        </section>

        <section className="comparison-page__section" aria-labelledby="comparison-takeaways">
          <h2 id="comparison-takeaways">{COMPARISON.sections.takeaways}</h2>
          <ul className="comparison-page__takeaways">
            {COMPARISON.takeaways.map(takeaway => (
              <li key={takeaway}>{formatMessage(takeaway, TAKEAWAY_VALUES)}</li>
            ))}
          </ul>
        </section>
      </main>
    </>
  )
}
