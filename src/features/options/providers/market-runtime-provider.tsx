import { createContext, type ReactNode, useEffect, useState } from 'react'

import { getOptionsSnapshot } from '@/features/options/api/options-snapshot'
import {
  createMarketRuntime,
  type MarketRuntime,
} from '@/features/options/model/create-market-runtime'

const MarketRuntimeContext = createContext<MarketRuntime | null>(null)

type MarketRuntimeProviderProps = {
  children: ReactNode
  /** Supplied by tests to drive the real pipeline over a fake transport. */
  runtime?: MarketRuntime
}

export function MarketRuntimeProvider({
  children,
  runtime: injected,
}: MarketRuntimeProviderProps) {
  const [runtime] = useState(
    () =>
      injected ??
      createMarketRuntime({
        fetchSnapshot: () => getOptionsSnapshot(),
        log: import.meta.env.DEV
          ? (message, detail) => {
              console.log(`[market] ${message}`, detail ?? '')
            }
          : undefined,
      }),
  )

  useEffect(() => {
    runtime.start()
    return () => {
      runtime.stop()
    }
  }, [runtime])

  return (
    <MarketRuntimeContext.Provider value={runtime}>
      {children}
    </MarketRuntimeContext.Provider>
  )
}

export { MarketRuntimeContext }
