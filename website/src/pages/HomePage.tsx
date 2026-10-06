import { Link } from 'react-router'
import { RichText } from '../components/RichText.tsx'
import { HeroSolverAnimation } from '../components/home/HeroSolverAnimation.tsx'
import { useDocumentTitle } from '../hooks/useDocumentTitle.ts'
import { formatMessage, messages } from '../i18n/messages.ts'
import { parsePuzzle } from '../solver/puzzleParser.ts'
import { findSamplePuzzle } from '../solver/samplePuzzles.ts'
import { ALGORITHM_PATH, SOLVER_PATH } from '../sitePages.ts'
import { formatCount } from '../solverView/formatting.ts'
import { countPuzzleTextBlanks } from '../solverView/puzzleLabels.ts'
import { buildReplayFrames } from '../solverView/replayFrames.ts'
import '../styles/pages/HomePage.css'

const HOME = messages.home
const HERO_SAMPLE_ID = 3
const HERO_FIRST_TRY_NUMBER = 783
const HERO_LAST_TRY_NUMBER = 814
const FEATURED_HARD_SAMPLE_ID = 5

function buildHeroFrames() {
  const parseResult = parsePuzzle(findSamplePuzzle(HERO_SAMPLE_ID).puzzle)
  if (!parseResult.ok) {
    throw new Error('Hero sample puzzle does not parse')
  }
  return buildReplayFrames(parseResult.grid, HERO_FIRST_TRY_NUMBER, HERO_LAST_TRY_NUMBER)
}

const HERO_FRAMES = buildHeroFrames()
const FEATURED_HARD_SAMPLE = findSamplePuzzle(FEATURED_HARD_SAMPLE_ID)

export default function HomePage() {
  useDocumentTitle()

  return (
    <>
      <div className="page-band">
        <div className="page-band__inner home-page__width home-hero">
          <div className="home-hero__text">
            <h1 className="home-hero__title">{HOME.heroTitle}</h1>
            <p className="home-hero__lead">{HOME.heroLead}</p>
            <div className="home-hero__actions">
              <Link className="button button--primary" to={SOLVER_PATH}>
                {HOME.openSolverButton}
              </Link>
              <Link className="button button--secondary" to={ALGORITHM_PATH}>
                {HOME.readAlgorithmButton}
              </Link>
            </div>
          </div>
          <HeroSolverAnimation frames={HERO_FRAMES} label={HOME.heroAnimationLabel} />
        </div>
      </div>
      <main className="page-container home-page__width home-cards">
        <div className="card home-card">
          <h2 className="home-card__title">{HOME.problemCardTitle}</h2>
          <p className="home-card__text">{HOME.problemCardText}</p>
        </div>
        <div className="card home-card">
          <h2 className="home-card__title">{HOME.methodCardTitle}</h2>
          <p className="home-card__text">{HOME.methodCardText}</p>
        </div>
        <div className="card home-card">
          <h2 className="home-card__title">{HOME.speedCardTitle}</h2>
          <p className="home-card__text">
            <RichText
              text={formatMessage(HOME.speedCardText, {
                blankCount: countPuzzleTextBlanks(FEATURED_HARD_SAMPLE.puzzle),
                tryCount: formatCount(FEATURED_HARD_SAMPLE.measured.tryCount),
              })}
              strongClassName="home-card__number"
            />
          </p>
        </div>
      </main>
    </>
  )
}
