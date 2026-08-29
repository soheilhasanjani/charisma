/**
 * Assembles a real controller over real stores for tests.
 *
 * Everything here is the production code path — only the transport is left to the
 * caller — so specs exercise actual behaviour instead of mocks, and adding a
 * store dependency means editing this file rather than every spec.
 */

import { createFrameScheduler } from '@/core/scheduler/frame-scheduler'
import { createMarketController } from '@/features/options/model/market-controller'
import {
  createFeedStatusStore,
  createHistoryStore,
  createKnownSymbolsStore,
  createLastTradeStore,
  createSelectionStore,
} from '@/features/options/model/stores/live-stores'
import { createSymbolStore } from '@/features/options/model/stores/symbol-store'

export type TestMarketOptions = {
  /** Symbols treated as on-screen, which is what gates history recording. */
  trackedSymbols?: Iterable<string>
  onFlush?: (keys: ReadonlySet<string>) => void
}

export function createTestMarket(options: TestMarketOptions = {}) {
  const tracked = new Set(options.trackedSymbols ?? [])

  const symbolStore = createSymbolStore()
  const lastTradeStore = createLastTradeStore()
  const historyStore = createHistoryStore()
  const feedStatusStore = createFeedStatusStore()
  const selectionStore = createSelectionStore()
  const knownSymbolsStore = createKnownSymbolsStore()

  const scheduler = createFrameScheduler({
    onFlush: options.onFlush ?? (() => undefined),
  })

  const controller = createMarketController({
    symbolStore,
    lastTradeStore,
    historyStore,
    feedStatusStore,
    selectionStore,
    knownSymbolsStore,
    scheduler,
    isSymbolTracked: (symbol) => tracked.has(symbol),
  })

  return {
    controller,
    scheduler,
    stores: {
      symbol: symbolStore,
      lastTrade: lastTradeStore,
      history: historyStore,
      feedStatus: feedStatusStore,
      selection: selectionStore,
      knownSymbols: knownSymbolsStore,
    },
    track(symbol: string) {
      tracked.add(symbol)
    },
  }
}
