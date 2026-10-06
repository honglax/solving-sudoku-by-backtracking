import { createContext } from 'react'

export type Theme = 'light' | 'dark'

export type ThemeContextValue = {
  activeTheme: Theme
  chooseTheme: (theme: Theme) => void
}

export const ThemeContext = createContext<ThemeContextValue | null>(null)
