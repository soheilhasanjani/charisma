import { useStore } from 'zustand'

import { useMarketRuntime } from '@/features/options/hooks/use-market-runtime'

export function useKnownSymbols() {
  const runtime = useMarketRuntime()

  return useStore(runtime.stores.knownSymbols, (state) => state.symbols)
}
