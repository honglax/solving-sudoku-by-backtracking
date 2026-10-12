import { Code, Video, type LucideIcon } from 'lucide-react'
import { ICON_SIZE, ICON_STROKE_WIDTH } from '../components/iconSizes.ts'
import { useDocumentTitle } from '../hooks/useDocumentTitle.ts'
import { messages } from '../i18n/messages.ts'
import '../styles/pages/AboutPage.css'

const ABOUT = messages.about
const SOURCE_CODE_URL = 'https://github.com/honglax/solving-sudoku-by-backtracking'

type ExternalLink = {
  label: string
  url: string | null
  icon: LucideIcon
}

const EXTERNAL_LINKS: ExternalLink[] = [
  { label: ABOUT.videoLink, url: null, icon: Video },
  { label: ABOUT.sourceCodeLink, url: SOURCE_CODE_URL, icon: Code },
]

export default function AboutPage() {
  useDocumentTitle(ABOUT.documentTitle)
  const availableLinks = EXTERNAL_LINKS.filter(link => link.url !== null)

  return (
    <main className="about-page">
      <h1 className="page-title">{ABOUT.title}</h1>
      <p className="about-page__intro">{ABOUT.intro}</p>
      <dl className="card about-page__details">
        {ABOUT.rows.map(row => (
          <div key={row.label} className="about-page__row">
            <dt className="about-page__label">{row.label}</dt>
            <dd>{row.text}</dd>
          </div>
        ))}
      </dl>
      {availableLinks.length > 0 && (
        <div className="about-page__links">
          {availableLinks.map(({ label, url, icon: LinkIcon }) => (
            <a key={label} className="card about-page__link" href={url ?? undefined} target="_blank" rel="noreferrer">
              <LinkIcon size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} aria-hidden />
              {label}
            </a>
          ))}
        </div>
      )}
    </main>
  )
}
