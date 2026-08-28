import { useSyncExternalStore } from 'react'

import { useMarketRuntime } from '@/features/options/hooks/use-market-runtime'
import { symbolRecordToSnapshot } from '@/features/options/model/snapshot-reconcile'
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
  const symbols = useRankedSymbols()

  return useSyncExternalStore(
    (listener) => runtime.stores.symbol.subscribeAll(listener),
    () =>
      symbols
        .map((symbol) => runtime.stores.symbol.toOptionSnapshot(symbol))
        .filter((row): row is OptionSnapshot => row != null),
    () =>
      symbols
        .map((symbol) => {
          const record = runtime.stores.symbol.getSnapshot(symbol)
          return record ? symbolRecordToSnapshot(record) : null
        })
        .filter((row): row is OptionSnapshot => row != null),
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
