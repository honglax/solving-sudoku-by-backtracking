import { NavLink } from 'react-router'
import { messages } from '../i18n/messages.ts'
import { HOME_PATH, SITE_PAGES } from '../sitePages.ts'
import '../styles/components/SiteNavigation.css'

type SiteNavigationProps = {
  layout: 'horizontal' | 'vertical'
  onNavigate?: () => void
}

export function SiteNavigation({ layout, onNavigate }: SiteNavigationProps) {
  return (
    <nav className={`site-navigation site-navigation--${layout}`} aria-label={messages.site.navigationLabel}>
      {SITE_PAGES.map(page => (
        <NavLink
          key={page.path}
          to={page.path}
          end={page.path === HOME_PATH}
          className="site-navigation__link"
          onClick={onNavigate}
        >
          {page.navigationLabel}
        </NavLink>
      ))}
    </nav>
  )
}
