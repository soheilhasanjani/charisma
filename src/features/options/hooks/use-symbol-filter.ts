import { useCallback, useEffect, useMemo, useRef } from 'react'
import { useStore } from 'zustand'

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

/**
 * The user's symbol filter.
 *
 * Intent lives in `selection.intended` and nowhere else; the URL is a mirror for
 * shareable links, not a second source of truth. The server's `subscribed` ack
 * lands in `selection.confirmed` so an echo can never overwrite what was asked
 * for.
 */
export function useSymbolFilter() {
  const runtime = useMarketRuntime()
  const knownSymbols = useKnownSymbols()
  const selected = useStore(runtime.stores.selection, (state) => state.intended)
  const previousSubscriptionRef = useRef<string[]>([])
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const seededFromUrlRef = useRef(false)

  const setFilter = useCallback(
    (next: readonly string[]) => {
      const unique = [...new Set(next)]
      runtime.stores.selection.setState({ intended: unique })
      writeSymbolFilterToUrl(unique)
    },
    [runtime],
  )

  // The URL seeds intent once, on first mount, before any user interaction.
  useEffect(() => {
    if (seededFromUrlRef.current) return
    seededFromUrlRef.current = true

    const fromUrl = readSymbolFilterFromUrl()
    if (fromUrl.length > 0) {
      runtime.stores.selection.setState({ intended: fromUrl })
    }
  }, [runtime])

  const toggleSymbol = useCallback(
    (symbol: string) => {
      const current = runtime.stores.selection.getState().intended
      setFilter(
        current.includes(symbol)
          ? current.filter((entry) => entry !== symbol)
          : [...current, symbol],
      )
    },
    [runtime, setFilter],
  )

  const toggleGroup = useCallback(
    (symbols: readonly string[]) => {
      const current = runtime.stores.selection.getState().intended
      const currentSet = new Set(current)
      const allSelected = symbols.every((symbol) => currentSet.has(symbol))

      setFilter(
        allSelected
          ? current.filter((symbol) => !symbols.includes(symbol))
          : [...current, ...symbols],
      )
    },
    [runtime, setFilter],
  )

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
      runtime.requestSubscription(next)
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
  symbols: readonly string[],
  selected: readonly string[],
) {
  return useMemo(() => {
    if (selected.length === 0) {
      return [...symbols]
    }

    const allowed = new Set(selected)
    return symbols.filter((symbol) => allowed.has(symbol))
  }, [selected, symbols])
}
