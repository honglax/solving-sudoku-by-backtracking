import { RotateCcw } from 'lucide-react'
import { ICON_SIZE, ICON_STROKE_WIDTH } from '../components/iconSizes.ts'
import { HOME_PATH } from '../sitePages.ts'
import { useDocumentTitle } from '../hooks/useDocumentTitle.ts'
import { messages } from '../i18n/messages.ts'
import '../styles/pages/StatusPage.css'

export function AppErrorPage() {
  const APP_ERROR = messages.appError
  useDocumentTitle(APP_ERROR.documentTitle)

  return (
    <main className="page-container status-page">
      <div className="status-page__content" role="alert">
        <h1 className="page-title">{APP_ERROR.title}</h1>
        <p className="status-page__description">{APP_ERROR.description}</p>
        <div className="status-page__actions">
          <button type="button" className="button button--primary" onClick={() => window.location.reload()}>
            <RotateCcw size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} aria-hidden />
            {APP_ERROR.reloadButton}
          </button>
          <a className="button button--secondary" href={HOME_PATH}>{APP_ERROR.homeButton}</a>
        </div>
      </div>
    </main>
  )
}
