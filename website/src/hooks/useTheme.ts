import { useContext } from 'react'
import { ThemeContext, type ThemeContextValue } from '../theme/themeContext.ts'

export function useTheme(): ThemeContextValue {
  const themeContextValue = useContext(ThemeContext)
  if (themeContextValue === null) {
    throw new Error('useTheme must be used inside ThemeProvider')
  }
  return themeContextValue
}
