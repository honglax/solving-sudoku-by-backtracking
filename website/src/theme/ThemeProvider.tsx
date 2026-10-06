import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { ThemeContext, type Theme } from './themeContext.ts'

const THEME_STORAGE_KEY = 'theme'
const DARK_COLOR_SCHEME_QUERY = '(prefers-color-scheme: dark)'

function isTheme(value: string | null): value is Theme {
  return value === 'light' || value === 'dark'
}

function readStoredTheme(): Theme | null {
  try {
    const storedValue = localStorage.getItem(THEME_STORAGE_KEY)
    if (isTheme(storedValue)) {
      return storedValue
    }
    return null
  } catch {
    return null
  }
}

function storeTheme(theme: Theme) {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme)
  } catch {
    return
  }
}

function readSystemTheme(): Theme {
  if (window.matchMedia(DARK_COLOR_SCHEME_QUERY).matches) {
    return 'dark'
  }
  return 'light'
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [storedTheme, setStoredTheme] = useState<Theme | null>(readStoredTheme)
  const [systemTheme, setSystemTheme] = useState<Theme>(readSystemTheme)

  useEffect(() => {
    const darkColorScheme = window.matchMedia(DARK_COLOR_SCHEME_QUERY)
    const followSystemTheme = () => setSystemTheme(readSystemTheme())
    darkColorScheme.addEventListener('change', followSystemTheme)
    return () => darkColorScheme.removeEventListener('change', followSystemTheme)
  }, [])

  const chooseTheme = useCallback((theme: Theme) => {
    storeTheme(theme)
    document.documentElement.dataset.theme = theme
    setStoredTheme(theme)
  }, [])

  const activeTheme = storedTheme ?? systemTheme

  return (
    <ThemeContext.Provider value={{ activeTheme, chooseTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}
