import { useSyncExternalStore } from 'react'

import { useMarketRuntime } from '@/features/options/hooks/use-market-runtime'

export function useKnownSymbols() {
  const runtime = useMarketRuntime()

  return useSyncExternalStore(
    (listener) => runtime.subscribeKnownSymbols(listener),
    () => runtime.getKnownSymbols(),
    () => runtime.getKnownSymbols(),
  )
}
