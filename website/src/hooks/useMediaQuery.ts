import { useCallback, useSyncExternalStore } from 'react'

export const PHONE_LAYOUT_QUERY = '(max-width: 600px)'

export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (notifyChange: () => void) => {
      const mediaQueryList = window.matchMedia(query)
      mediaQueryList.addEventListener('change', notifyChange)
      return () => mediaQueryList.removeEventListener('change', notifyChange)
    },
    [query],
  )
  return useSyncExternalStore(subscribe, () => window.matchMedia(query).matches)
}
