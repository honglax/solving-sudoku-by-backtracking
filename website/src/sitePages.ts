import { messages } from './i18n/messages.ts'

export const SITE_NAME = messages.site.name

export const HOME_PATH = '/'
export const SOLVER_PATH = '/solver'
export const ALGORITHM_PATH = '/algorithm'
export const COMPARISON_PATH = '/compare'
export const ABOUT_PATH = '/about'

export type SitePage = {
  path: string
  navigationLabel: string
}

export const SITE_PAGES: SitePage[] = [
  { path: HOME_PATH, navigationLabel: messages.site.navigation.home },
  { path: SOLVER_PATH, navigationLabel: messages.site.navigation.solver },
  { path: ALGORITHM_PATH, navigationLabel: messages.site.navigation.algorithm },
  { path: COMPARISON_PATH, navigationLabel: messages.site.navigation.comparison },
  { path: ABOUT_PATH, navigationLabel: messages.site.navigation.about },
]

export const PUZZLE_SEARCH_PARAMETER = 'puzzle'

export function solverLinkForPuzzle(puzzleText: string): string {
  const searchParameters = new URLSearchParams({ [PUZZLE_SEARCH_PARAMETER]: puzzleText })
  return `${SOLVER_PATH}?${searchParameters.toString()}`
}
