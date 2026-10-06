import { useEffect } from 'react'
import { formatMessage, messages } from '../i18n/messages.ts'
import { SITE_NAME } from '../sitePages.ts'

export function useDocumentTitle(pageName?: string) {
  useEffect(() => {
    if (pageName === undefined) {
      document.title = SITE_NAME
    } else {
      document.title = formatMessage(messages.site.documentTitle, { pageName, siteName: SITE_NAME })
    }
  }, [pageName])
}
