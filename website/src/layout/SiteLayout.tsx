import { Suspense } from 'react'
import { Outlet, useLocation } from 'react-router'
import { DelayedLoadingMessage } from '../components/DelayedLoadingMessage.tsx'
import { SiteFooter } from '../components/SiteFooter.tsx'
import { SiteHeader } from '../components/SiteHeader.tsx'
import { SOLVER_PATH } from '../sitePages.ts'
import '../styles/layout/SiteLayout.css'

export function SiteLayout() {
  const isSolverPage = useLocation().pathname === SOLVER_PATH

  return (
    <div className="site-layout">
      <SiteHeader />
      <Suspense fallback={<DelayedLoadingMessage />}>
        <Outlet />
      </Suspense>
      {!isSolverPage && <SiteFooter />}
    </div>
  )
}
