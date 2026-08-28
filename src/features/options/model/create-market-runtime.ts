import { createReconnectingSocket } from '@/core/realtime/socket-client'
import { createFrameScheduler } from '@/core/scheduler/frame-scheduler'
import { createMarketController } from '@/features/options/model/market-controller'
import { createRanking, DEFAULT_SORT } from '@/features/options/model/ranking'
import {
  createFeedStatusStore,
  createHistoryStore,
  createLastTradeStore,
  createSelectionStore,
  createViewportStore,
} from '@/features/options/model/stores/live-stores'
import { createSymbolStore } from '@/features/options/model/stores/symbol-store'
import type { SortState } from '@/features/options/model/types'
import type { OptionSnapshot } from '@/features/options/types'

export type MarketRuntimeOptions = {
  fetchSnapshot?: () => Promise<OptionSnapshot[]>
  log?: (message: string, detail?: unknown) => void
}

export function createMarketRuntime(options: MarketRuntimeOptions = {}) {
  const log = options.log ?? (() => undefined)

  const symbolStore = createSymbolStore()
  const lastTradeStore = createLastTradeStore()
  const historyStore = createHistoryStore()
  const feedStatusStore = createFeedStatusStore()
  const selectionStore = createSelectionStore()
  const viewportStore = createViewportStore()

  let sortState: SortState = DEFAULT_SORT
  let orderLocked = false
  let started = false

  const scheduler = createFrameScheduler({
    getVisibleKeys: () => viewportStore.getVisibleSymbols(),
    onFlush(keys) {
      for (const key of keys) {
        symbolStore.flushKey(key)
      }
      ranking.invalidate()
    },
  })

  const controller = createMarketController({
    symbolStore,
    lastTradeStore,
    historyStore,
    feedStatusStore,
    selectionStore,
    scheduler,
    isSymbolTracked: (symbol) => viewportStore.getVisibleSymbols().has(symbol),
  })

  const ranking = createRanking({
    getSymbols: () => controller.getKnownSymbols(),
    getRecord: (symbol) => symbolStore.get(symbol),
    getSort: () => sortState,
    isOrderLocked: () => orderLocked,
  })

  const socket = createReconnectingSocket({
    onMessage: (message) => controller.handleMessage(message),
    onStatusChange: (status) => controller.updateTransportStatus(status),
    onResyncNeeded: () => {
      void resyncSnapshot()
    },
    log,
  })

  async function resyncSnapshot() {
    if (!options.fetchSnapshot) return
    log('snapshot resync started')
    const snapshots = await options.fetchSnapshot()
    controller.applySnapshot(snapshots)
    scheduler.flushNow()
    ranking.invalidate(true)
    log('snapshot resync applied', { rows: snapshots.length })
  }

  return {
    stores: {
      symbol: symbolStore,
      lastTrade: lastTradeStore,
      history: historyStore,
      feedStatus: feedStatusStore,
      selection: selectionStore,
      viewport: viewportStore,
    },
    ranking,
    scheduler,
    controller,
    socket,

    start() {
      if (started) return
      started = true
      scheduler.start()
      socket.start()
    },

    stop() {
      if (!started) return
      started = false
      socket.stop()
      scheduler.stop()
    },

    applySnapshot(snapshots: OptionSnapshot[]) {
      controller.applySnapshot(snapshots)
      scheduler.flushNow()
      ranking.invalidate(true)
    },

    resyncSnapshot,

    subscribe(symbols: string[]) {
      selectionStore.set(symbols)
      socket.subscribe(symbols)
    },

    setSort(next: SortState) {
      sortState = next
      ranking.setSort()
    },

    setOrderLocked(locked: boolean) {
      orderLocked = locked
      if (!locked) {
        ranking.unlockAndFlush()
      }
    },

    setViewportSymbols(symbols: string[]) {
      viewportStore.setSymbols(symbols)
      viewportStore.flush()
    },
  }
}

export type MarketRuntime = ReturnType<typeof createMarketRuntime>
