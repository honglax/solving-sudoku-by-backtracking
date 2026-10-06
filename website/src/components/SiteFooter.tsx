import { Link } from 'react-router'
import { messages } from '../i18n/messages.ts'
import { ALGORITHM_PATH } from '../sitePages.ts'
import '../styles/components/SiteFooter.css'

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <span>{messages.site.footer}</span>
        <Link className="site-footer__link" to={ALGORITHM_PATH}>
          {messages.site.footerAlgorithmLink}
        </Link>
      </div>
    </footer>
  )
}
