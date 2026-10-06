import { useEffect, useState } from 'react'

const ACTIVATION_LINE_FROM_TOP_PIXELS = 96
const BOTTOM_TOLERANCE_PIXELS = 2

function isScrolledToBottom(): boolean {
  const scrolledDistance = window.scrollY + window.innerHeight
  return scrolledDistance >= document.documentElement.scrollHeight - BOTTOM_TOLERANCE_PIXELS
}

function findActiveSectionId(sectionIds: string[]): string {
  if (isScrolledToBottom()) {
    return sectionIds[sectionIds.length - 1]
  }
  let activeSectionId = sectionIds[0]
  for (const sectionId of sectionIds) {
    const section = document.getElementById(sectionId)
    if (section !== null && section.getBoundingClientRect().top <= ACTIVATION_LINE_FROM_TOP_PIXELS) {
      activeSectionId = sectionId
    }
  }
  return activeSectionId
}

export function useActiveSection(sectionIds: string[]): string {
  const [activeSectionId, setActiveSectionId] = useState(sectionIds[0])

  useEffect(() => {
    const updateActiveSection = () => setActiveSectionId(findActiveSectionId(sectionIds))
    updateActiveSection()
    window.addEventListener('scroll', updateActiveSection, { passive: true })
    window.addEventListener('resize', updateActiveSection)
    return () => {
      window.removeEventListener('scroll', updateActiveSection)
      window.removeEventListener('resize', updateActiveSection)
    }
  }, [sectionIds])

  return activeSectionId
}
