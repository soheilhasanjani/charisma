import { describe, expect, it } from 'vitest'

import { createTableRowsCache } from '@/features/options/model/table-rows-cache'
import type { OptionSnapshot } from '@/features/options/types'

const row = (symbol: string, last: number): OptionSnapshot => ({
  symbol,
  last,
  bid: last - 0.1,
  ask: last + 0.1,
  delta: 0.5,
  gamma: 0.1,
  theta: -0.02,
  vega: 1.2,
  riskScore: 100,
})

describe('createTableRowsCache', () => {
  it('returns a stable snapshot reference when data is unchanged', () => {
    const symbols = ['AAPL_20250117_190_C']
    let last = 10
    const symbolListeners = new Set<() => void>()

    const cache = createTableRowsCache({
      getSymbols: () => symbols,
      getRow: (symbol) => row(symbol, last),
      subscribeSymbols: (listener) => {
        symbolListeners.add(listener)
        return () => symbolListeners.delete(listener)
      },
      subscribeOrder: () => () => undefined,
    })

    const first = cache.getSnapshot()
    const second = cache.getSnapshot()

    expect(first).toBe(second)

    cache.invalidate()
    expect(cache.getSnapshot()).toBe(first)

    for (const listener of symbolListeners) {
      listener()
    }

    expect(cache.getSnapshot()).toBe(first)

    last = 11
    cache.invalidate()
    const third = cache.getSnapshot()

    expect(third).not.toBe(first)
    expect(third[0]?.last).toBe(11)
  })
})
