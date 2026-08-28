import { useSyncExternalStore } from 'react'

import { useMarketRuntime } from '@/features/options/hooks/use-market-runtime'
import type { OptionSnapshot } from '@/features/options/types'

export function useSymbolRecord(symbol: string) {
  const runtime = useMarketRuntime()

  return useSyncExternalStore(
    (listener) => runtime.stores.symbol.subscribe(symbol, listener),
    () => runtime.stores.symbol.getSnapshot(symbol),
    () => runtime.stores.symbol.getSnapshot(symbol),
  )
}

export function useRankedSymbols() {
  const runtime = useMarketRuntime()

  return useSyncExternalStore(
    (listener) => runtime.ranking.subscribe(listener),
    () => runtime.ranking.getSnapshot(),
    () => runtime.ranking.getSnapshot(),
  )
}

export function useOptionsTableRows(): OptionSnapshot[] {
  const runtime = useMarketRuntime()

  return useSyncExternalStore(
    (listener) => runtime.tableRows.subscribe(listener),
    () => runtime.tableRows.getSnapshot(),
    () => runtime.tableRows.getSnapshot(),
  )
}

export function useFeedStatus() {
  const runtime = useMarketRuntime()

  return useSyncExternalStore(
    (listener) => runtime.stores.feedStatus.subscribe(listener),
    () => runtime.stores.feedStatus.getSnapshot(),
    () => runtime.stores.feedStatus.getSnapshot(),
  )
}
