import { Link } from 'react-router'
import { HOME_PATH, SOLVER_PATH } from '../sitePages.ts'
import { useDocumentTitle } from '../hooks/useDocumentTitle.ts'
import { messages } from '../i18n/messages.ts'
import '../styles/pages/StatusPage.css'

export default function NotFoundPage() {
  const NOT_FOUND = messages.notFound
  useDocumentTitle(NOT_FOUND.documentTitle)

  return (
    <main className="page-container status-page">
      <div className="status-page__content">
        <p className="status-page__code">{NOT_FOUND.code}</p>
        <h1 className="page-title">{NOT_FOUND.title}</h1>
        <p className="status-page__description">{NOT_FOUND.description}</p>
        <div className="status-page__actions">
          <Link className="button button--primary" to={HOME_PATH}>{NOT_FOUND.homeButton}</Link>
          <Link className="button button--secondary" to={SOLVER_PATH}>{NOT_FOUND.solverButton}</Link>
        </div>
      </div>
    </main>
  )
}
