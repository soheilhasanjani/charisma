import { useSyncExternalStore } from 'react'

import { useMarketRuntime } from '@/features/options/hooks/use-market-runtime'
import type { SymbolHistory } from '@/features/options/model/types'

const EMPTY_HISTORY: SymbolHistory = { prices: [], trades: [] }

export function useSymbolHistory(symbol: string | null) {
  const runtime = useMarketRuntime()

  return useSyncExternalStore(
    (listener) => {
      if (!symbol) {
        return () => undefined
      }

      return runtime.stores.history.subscribe(symbol, listener)
    },
    () => {
      if (!symbol) {
        return EMPTY_HISTORY
      }

      return runtime.stores.history.getSnapshot(symbol) ?? EMPTY_HISTORY
    },
    () => EMPTY_HISTORY,
  )
}
