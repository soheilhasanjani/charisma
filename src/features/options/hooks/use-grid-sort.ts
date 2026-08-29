import { useStore } from 'zustand'

import { useMarketRuntime } from '@/features/options/hooks/use-market-runtime'

export function useGridSort() {
  const runtime = useMarketRuntime()

  return useStore(runtime.stores.sort)
}
