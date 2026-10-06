import { lazy } from 'react'
import { createBrowserRouter, RouterProvider } from 'react-router'
import { SiteLayout } from './layout/SiteLayout.tsx'
import { AppErrorPage } from './pages/AppErrorPage.tsx'
import { ABOUT_PATH, ALGORITHM_PATH, COMPARISON_PATH, SOLVER_PATH } from './sitePages.ts'
import { ThemeProvider } from './theme/ThemeProvider.tsx'

const HomePage = lazy(() => import('./pages/HomePage.tsx'))
const SolverPage = lazy(() => import('./pages/SolverPage.tsx'))
const AlgorithmPage = lazy(() => import('./pages/AlgorithmPage.tsx'))
const ComparisonPage = lazy(() => import('./pages/ComparisonPage.tsx'))
const AboutPage = lazy(() => import('./pages/AboutPage.tsx'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage.tsx'))

const router = createBrowserRouter([
  {
    element: <SiteLayout />,
    children: [
      {
        errorElement: <AppErrorPage />,
        children: [
          { index: true, element: <HomePage /> },
          { path: SOLVER_PATH, element: <SolverPage /> },
          { path: ALGORITHM_PATH, element: <AlgorithmPage /> },
          { path: COMPARISON_PATH, element: <ComparisonPage /> },
          { path: ABOUT_PATH, element: <AboutPage /> },
          { path: '*', element: <NotFoundPage /> },
        ],
      },
    ],
  },
])

export function App() {
  return (
    <ThemeProvider>
      <RouterProvider router={router} />
    </ThemeProvider>
  )
}
