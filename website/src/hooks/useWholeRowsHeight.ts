import { useLayoutEffect, useRef } from 'react'

function readRowGap(element: HTMLElement): number {
  const rowGap = Number.parseFloat(getComputedStyle(element).rowGap)
  if (Number.isNaN(rowGap)) {
    return 0
  }
  return rowGap
}

export function useWholeRowsHeight<ElementType extends HTMLElement>(isEnabled: boolean) {
  const elementRef = useRef<ElementType>(null)

  useLayoutEffect(() => {
    const element = elementRef.current
    const container = element?.parentElement ?? null
    if (!isEnabled || element === null || container === null) {
      return
    }

    const fitToWholeRows = () => {
      const firstItem = element.firstElementChild
      if (!(firstItem instanceof HTMLElement)) {
        element.style.height = ''
        return
      }
      const rowGap = readRowGap(element)
      const rowStep = firstItem.offsetHeight + rowGap
      const wholeRowCount = Math.max(1, Math.floor((container.clientHeight + rowGap) / rowStep))
      element.style.height = `${wholeRowCount * rowStep - rowGap}px`
    }

    fitToWholeRows()
    const resizeObserver = new ResizeObserver(fitToWholeRows)
    resizeObserver.observe(container)
    return () => {
      resizeObserver.disconnect()
      element.style.height = ''
    }
  }, [isEnabled])

  return elementRef
}
