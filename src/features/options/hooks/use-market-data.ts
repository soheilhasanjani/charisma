import { useSyncExternalStore } from 'react'
import { useStore } from 'zustand'

import { useMarketRuntime } from '@/features/options/hooks/use-market-runtime'

/**
 * Per-symbol tick data. Subscribes to one key, so a message for another symbol
 * cannot re-render this row.
 */
export function useSymbolRecord(symbol: string) {
  const runtime = useMarketRuntime()

  return useSyncExternalStore(
    (listener) => runtime.stores.symbol.subscribe(symbol, listener),
    () => runtime.stores.symbol.getSnapshot(symbol),
    () => runtime.stores.symbol.getSnapshot(symbol),
  )
}

export function useFeedStatus() {
  const runtime = useMarketRuntime()

  return useStore(runtime.stores.feedStatus)
}
