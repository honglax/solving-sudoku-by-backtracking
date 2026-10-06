import { Moon, Sun, type LucideIcon } from 'lucide-react'
import { messages } from '../i18n/messages.ts'
import { type Theme } from '../theme/themeContext.ts'
import { useTheme } from '../hooks/useTheme.ts'
import { ICON_SIZE, ICON_STROKE_WIDTH, PRESSED_ICON_STROKE_WIDTH } from './iconSizes.ts'
import '../styles/components/ThemeSwitch.css'

type ThemeOption = {
  theme: Theme
  label: string
  icon: LucideIcon
}

const THEME_OPTIONS: ThemeOption[] = [
  { theme: 'light', label: messages.site.theme.light, icon: Sun },
  { theme: 'dark', label: messages.site.theme.dark, icon: Moon },
]

type ThemeSwitchProps = {
  showLabels?: boolean
}

export function ThemeSwitch({ showLabels = false }: ThemeSwitchProps) {
  const { activeTheme, chooseTheme } = useTheme()
  const switchClassName = showLabels ? 'theme-switch theme-switch--labelled' : 'theme-switch'

  return (
    <div className={switchClassName} role="group" aria-label={messages.site.theme.groupLabel}>
      {THEME_OPTIONS.map(({ theme, label, icon: ThemeIcon }) => {
        const isPressed = activeTheme === theme
        return (
          <button
            key={theme}
            type="button"
            className="theme-switch__option"
            aria-pressed={isPressed}
            aria-label={showLabels ? undefined : label}
            title={showLabels ? undefined : label}
            onClick={() => chooseTheme(theme)}
          >
            <ThemeIcon
              size={ICON_SIZE}
              strokeWidth={isPressed ? PRESSED_ICON_STROKE_WIDTH : ICON_STROKE_WIDTH}
              aria-hidden
            />
            {showLabels && label}
          </button>
        )
      })}
    </div>
  )
}
