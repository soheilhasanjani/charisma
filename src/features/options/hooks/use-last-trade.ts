import { useStore } from 'zustand'

import { useMarketRuntime } from '@/features/options/hooks/use-market-runtime'

export function useLastTrade() {
  const runtime = useMarketRuntime()

  return useStore(runtime.stores.lastTrade, (state) => state.trade)
}
