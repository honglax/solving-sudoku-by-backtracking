import { Menu } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { messages } from '../i18n/messages.ts'
import { HOME_PATH, SITE_NAME } from '../sitePages.ts'
import { ICON_SIZE, ICON_STROKE_WIDTH } from './iconSizes.ts'
import { SiteNavigation } from './SiteNavigation.tsx'
import { ThemeSwitch } from './ThemeSwitch.tsx'
import '../styles/components/SiteHeader.css'

const SITE_MENU_ID = 'site-menu'

export function SiteHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const closeMenu = () => setIsMenuOpen(false)

  useEffect(() => {
    if (!isMenuOpen) {
      return
    }
    const closeMenuOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMenuOpen(false)
      }
    }
    document.addEventListener('keydown', closeMenuOnEscape)
    return () => document.removeEventListener('keydown', closeMenuOnEscape)
  }, [isMenuOpen])

  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link className="site-header__wordmark" to={HOME_PATH}>
          {SITE_NAME}
        </Link>
        <div className="site-header__actions">
          <SiteNavigation layout="horizontal" />
          <span className="site-header__divider" aria-hidden="true" />
          <ThemeSwitch />
        </div>
        <button
          type="button"
          className="button button--ghost site-header__menu-button"
          aria-expanded={isMenuOpen}
          aria-controls={SITE_MENU_ID}
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          <Menu size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} aria-hidden />
          {messages.site.menuButton}
        </button>
      </div>
      {isMenuOpen && (
        <div id={SITE_MENU_ID} className="site-menu">
          <SiteNavigation layout="vertical" onNavigate={closeMenu} />
          <ThemeSwitch showLabels />
        </div>
      )}
    </header>
  )
}
