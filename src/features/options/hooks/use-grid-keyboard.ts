import type { Virtualizer } from '@tanstack/react-virtual'
import { useCallback, useRef, useState } from 'react'

type UseGridKeyboardOptions = {
  symbols: string[]
  scrollRef: React.RefObject<HTMLDivElement | null>
  rowVirtualizer: Virtualizer<HTMLDivElement, Element>
  rowHeight: number
}

export function useGridKeyboard({
  symbols,
  scrollRef,
  rowVirtualizer,
  rowHeight,
}: UseGridKeyboardOptions) {
  const [focusedIndex, setFocusedIndex] = useState(0)
  const rowRefs = useRef(new Map<string, HTMLDivElement>())
  const pendingFocusSymbolRef = useRef<string | null>(null)
  const activeIndex =
    symbols.length === 0 ? 0 : Math.min(focusedIndex, symbols.length - 1)

  const registerRowRef = useCallback(
    (symbol: string, node: HTMLDivElement | null) => {
      if (node) {
        rowRefs.current.set(symbol, node)
        if (pendingFocusSymbolRef.current === symbol) {
          node.focus()
          pendingFocusSymbolRef.current = null
        }
        return
      }

      const existing = rowRefs.current.get(symbol)
      if (existing && document.activeElement === existing) {
        pendingFocusSymbolRef.current = symbol
      }
      rowRefs.current.delete(symbol)
    },
    [],
  )

  const focusIndex = useCallback(
    (nextIndex: number) => {
      if (symbols.length === 0) return

      const clamped = Math.max(0, Math.min(nextIndex, symbols.length - 1))
      setFocusedIndex(clamped)
      rowVirtualizer.scrollToIndex(clamped, { align: 'auto' })

      const symbol = symbols[clamped]
      const node = symbol ? rowRefs.current.get(symbol) : undefined
      if (node) {
        node.focus()
      } else if (symbol) {
        pendingFocusSymbolRef.current = symbol
      }
    },
    [rowVirtualizer, symbols],
  )

  const pageStep = useCallback(() => {
    const viewport = scrollRef.current
    if (!viewport) return 10
    return Math.max(1, Math.floor(viewport.clientHeight / rowHeight) - 1)
  }, [rowHeight, scrollRef])

  const handleRowKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault()
          focusIndex(activeIndex + 1)
          return
        case 'ArrowUp':
          event.preventDefault()
          focusIndex(activeIndex - 1)
          return
        case 'Home':
          event.preventDefault()
          focusIndex(0)
          return
        case 'End':
          event.preventDefault()
          focusIndex(symbols.length - 1)
          return
        case 'PageDown':
          event.preventDefault()
          focusIndex(activeIndex + pageStep())
          return
        case 'PageUp':
          event.preventDefault()
          focusIndex(activeIndex - pageStep())
          return
        case 'Enter':
          event.preventDefault()
          return
        default:
          return
      }
    },
    [activeIndex, focusIndex, pageStep, symbols.length],
  )

  const handleGridKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.target !== event.currentTarget) {
        return
      }

      if (event.key === 'ArrowDown' || event.key === 'Home') {
        event.preventDefault()
        focusIndex(event.key === 'Home' ? 0 : activeIndex)
      }
    },
    [activeIndex, focusIndex],
  )

  return {
    focusedIndex: activeIndex,
    setFocusedIndex,
    registerRowRef,
    handleRowKeyDown,
    handleGridKeyDown,
  }
}
