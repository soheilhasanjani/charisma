import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { useKnownSymbols } from '@/features/options/hooks/use-known-symbols'
import { useMarketRuntime } from '@/features/options/hooks/use-market-runtime'
import {
  diffSymbolSubscriptions,
  normalizeSubscriptionSymbols,
} from '@/features/options/lib/subscribe-diff'
import {
  readSymbolFilterFromUrl,
  writeSymbolFilterToUrl,
} from '@/features/options/lib/symbol-filter-url'

const SUBSCRIBE_DEBOUNCE_MS = 300

export function useSymbolFilter() {
  const runtime = useMarketRuntime()
  const knownSymbols = useKnownSymbols()
  const [selected, setSelected] = useState(readSymbolFilterFromUrl)
  const previousSubscriptionRef = useRef<string[]>([])
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const setFilter = useCallback((next: string[]) => {
    const unique = [...new Set(next)]
    setSelected(unique)
    writeSymbolFilterToUrl(unique)
  }, [])

  const toggleSymbol = useCallback((symbol: string) => {
    setSelected((current) => {
      const next = current.includes(symbol)
        ? current.filter((entry) => entry !== symbol)
        : [...current, symbol]
      writeSymbolFilterToUrl(next)
      return next
    })
  }, [])

  const toggleGroup = useCallback((symbols: readonly string[]) => {
    setSelected((current) => {
      const currentSet = new Set(current)
      const allSelected = symbols.every((symbol) => currentSet.has(symbol))
      const next = allSelected
        ? current.filter((symbol) => !symbols.includes(symbol))
        : [...new Set([...current, ...symbols])]
      writeSymbolFilterToUrl(next)
      return next
    })
  }, [])

  const clearAll = useCallback(() => {
    setFilter([])
  }, [setFilter])

  useEffect(() => {
    if (knownSymbols.length === 0) {
      return
    }

    if (debounceTimerRef.current != null) {
      clearTimeout(debounceTimerRef.current)
    }

    debounceTimerRef.current = setTimeout(() => {
      debounceTimerRef.current = null
      const next = normalizeSubscriptionSymbols(selected, knownSymbols).sort(
        (left, right) => left.localeCompare(right),
      )

      if (!diffSymbolSubscriptions(previousSubscriptionRef.current, next)) {
        return
      }

      previousSubscriptionRef.current = next
      runtime.subscribe(next)
    }, SUBSCRIBE_DEBOUNCE_MS)

    return () => {
      if (debounceTimerRef.current != null) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [knownSymbols, runtime, selected])

  const selectedSet = useMemo(() => new Set(selected), [selected])

  return {
    selected,
    selectedSet,
    setFilter,
    toggleSymbol,
    toggleGroup,
    clearAll,
    knownSymbols,
  }
}

export function useFilteredSymbols(
  rankedSymbols: readonly string[],
  selected: readonly string[],
) {
  return useMemo(() => {
    if (selected.length === 0) {
      return [...rankedSymbols]
    }

    const allowed = new Set(selected)
    return rankedSymbols.filter((symbol) => allowed.has(symbol))
  }, [rankedSymbols, selected])
}
