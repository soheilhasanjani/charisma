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
import { createTableRowsCache } from '@/features/options/model/table-rows-cache'
import type { SortState } from '@/features/options/model/types'
import { createRiskEngine } from '@/features/options/risk/risk-engine'
import type { RiskComputeMode } from '@/features/options/risk/types'
import type { OptionSnapshot } from '@/features/options/types'

function readInitialComputeMode(): RiskComputeMode {
  if (typeof window === 'undefined') return 'viewport'
  return window.location.search.includes('risk=all') ? 'all' : 'viewport'
}

export type MarketRuntimeOptions = {
  fetchSnapshot?: () => Promise<OptionSnapshot[]>
  log?: (message: string, detail?: unknown) => void
  riskComputeMode?: RiskComputeMode
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
  let computeMode = options.riskComputeMode ?? readInitialComputeMode()

  const rankingHolder: {
    ranking?: ReturnType<typeof createRanking>
  } = {}

  const riskEngine = createRiskEngine({
    getRecord: (symbol) => symbolStore.get(symbol),
    getComputeMode: () => computeMode,
    onScore(symbol, score) {
      symbolStore.applyRiskScore(symbol, score)
      symbolStore.flushKey(symbol)
      rankingHolder.ranking?.invalidate()
    },
  })

  const scheduler = createFrameScheduler({
    getVisibleKeys: () => viewportStore.getVisibleSymbols(),
    onFlush(keys) {
      riskEngine.computeForKeys(keys, viewportStore.getVisibleSymbols())
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
  rankingHolder.ranking = ranking

  const tableRows = createTableRowsCache({
    getSymbols: () => ranking.getSnapshot(),
    getRow: (symbol) => symbolStore.toOptionSnapshot(symbol),
    subscribeSymbols: (listener) => symbolStore.subscribeAll(listener),
    subscribeOrder: (listener) => ranking.subscribe(listener),
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
    riskEngine.computeAllKnown(snapshots.map((row) => row.symbol))
    scheduler.flushNow()
    ranking.invalidate(true)
    tableRows.invalidate()
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
    tableRows,
    scheduler,
    controller,
    socket,
    riskEngine,

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
      riskEngine.computeAllKnown(snapshots.map((row) => row.symbol))
      scheduler.flushNow()
      ranking.invalidate(true)
      tableRows.invalidate()
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

    setRiskComputeMode(mode: RiskComputeMode) {
      computeMode = mode
    },
  }
}

export type MarketRuntime = ReturnType<typeof createMarketRuntime>
