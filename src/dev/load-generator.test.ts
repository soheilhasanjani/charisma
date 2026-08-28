import { describe, expect, it } from 'vitest'

import { createFrameScheduler } from '@/core/scheduler/frame-scheduler'
import { createLoadGenerator } from '@/dev/load-generator'
import { synthesizeSymbols } from '@/dev/synthetic-symbols'
import { createMarketController } from '@/features/options/model/market-controller'
import {
  createFeedStatusStore,
  createHistoryStore,
  createLastTradeStore,
  createSelectionStore,
} from '@/features/options/model/stores/live-stores'
import { createSymbolStore } from '@/features/options/model/stores/symbol-store'

describe('synthesizeSymbols', () => {
  it('creates the requested number of unique symbols', () => {
    const symbols = synthesizeSymbols(5000)
    expect(symbols).toHaveLength(5000)
    expect(new Set(symbols).size).toBe(5000)
  })
})

describe('createLoadGenerator', () => {
  it('injects ticker messages into the controller', () => {
    const symbolStore = createSymbolStore()
    const scheduler = createFrameScheduler({ onFlush: () => undefined })
    const controller = createMarketController({
      symbolStore,
      lastTradeStore: createLastTradeStore(),
      historyStore: createHistoryStore(),
      feedStatusStore: createFeedStatusStore(),
      selectionStore: createSelectionStore(),
      scheduler,
    })

    const symbols = synthesizeSymbols(3)
    const generator = createLoadGenerator({
      controller,
      symbols,
      ratePerSecond: 5000,
    })

    generator.start()

    return new Promise<void>((resolve) => {
      setTimeout(() => {
        generator.stop()
        expect(generator.getMessagesSent()).toBeGreaterThan(0)
        expect(symbolStore.get(symbols[0])?.last?.value).toBeTypeOf('number')
        resolve()
      }, 50)
    })
  })
})
