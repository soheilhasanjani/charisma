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
  createKnownSymbolsStore,
  createLastTradeStore,
  createSelectionStore,
} from '@/features/options/model/stores/live-stores'
import { createSymbolStore } from '@/features/options/model/stores/symbol-store'

export type TestMarketOptions = {
  onFlush?: (keys: ReadonlySet<string>) => void
}

export function createTestMarket(options: TestMarketOptions = {}) {
  const symbolStore = createSymbolStore()
  const lastTradeStore = createLastTradeStore()
  const feedStatusStore = createFeedStatusStore()
  const selectionStore = createSelectionStore()
  const knownSymbolsStore = createKnownSymbolsStore()

  const scheduler = createFrameScheduler({
    onFlush: options.onFlush ?? (() => undefined),
  })

  const controller = createMarketController({
    symbolStore,
    lastTradeStore,
    feedStatusStore,
    selectionStore,
    knownSymbolsStore,
    scheduler,
  })

  return {
    controller,
    scheduler,
    stores: {
      symbol: symbolStore,
      lastTrade: lastTradeStore,
      feedStatus: feedStatusStore,
      selection: selectionStore,
      knownSymbols: knownSymbolsStore,
    },
  }
}
