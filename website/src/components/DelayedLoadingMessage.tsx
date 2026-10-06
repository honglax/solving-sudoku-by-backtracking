import { useEffect, useState } from 'react'
import { messages } from '../i18n/messages.ts'

const LOADING_MESSAGE_DELAY_MILLISECONDS = 300

export function DelayedLoadingMessage() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const timerId = window.setTimeout(() => setIsVisible(true), LOADING_MESSAGE_DELAY_MILLISECONDS)
    return () => window.clearTimeout(timerId)
  }, [])

  return (
    <main className="page-container loading-message">
      {isVisible && <p>{messages.site.loading}</p>}
    </main>
  )
}
