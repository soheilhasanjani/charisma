import { useContext } from 'react'

import { MarketRuntimeContext } from '@/features/options/providers/market-runtime-provider'

export function useMarketRuntime() {
  const runtime = useContext(MarketRuntimeContext)
  if (!runtime) {
    throw new Error(
      'useMarketRuntime must be used within MarketRuntimeProvider',
    )
  }
  return runtime
}
