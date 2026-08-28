import { useSyncExternalStore } from 'react'

import { useMarketRuntime } from '@/features/options/hooks/use-market-runtime'

export function useLastTrade() {
  const runtime = useMarketRuntime()

  return useSyncExternalStore(
    (listener) => runtime.stores.lastTrade.subscribe(listener),
    () => runtime.stores.lastTrade.getSnapshot(),
    () => runtime.stores.lastTrade.getSnapshot(),
  )
}
