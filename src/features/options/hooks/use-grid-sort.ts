import { useSyncExternalStore } from 'react'

import { useMarketRuntime } from '@/features/options/hooks/use-market-runtime'

export function useGridSort() {
  const runtime = useMarketRuntime()

  return useSyncExternalStore(
    (listener) => runtime.subscribeSort(listener),
    () => runtime.getSortSnapshot(),
    () => runtime.getSortSnapshot(),
  )
}
