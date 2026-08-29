/**
 * Assembles the socket, controller, scheduler, risk engine and stores into one
 * handle with start()/stop().
 *
 * A factory rather than a module singleton: singletons break HMR and force tests
 * to mock, whereas this lets a spec inject a fake transport and get the real
 * pipeline. Nothing in here touches React.
 */

import { createReconnectingSocket } from '@/core/realtime/socket-client'
import { createFrameScheduler } from '@/core/scheduler/frame-scheduler'
import { createMarketController } from '@/features/options/model/market-controller'
import {
  createFeedStatusStore,
  createKnownSymbolsStore,
  createLastTradeStore,
  createSelectionStore,
  createViewportStore,
} from '@/features/options/model/stores/live-stores'
import { createSymbolStore } from '@/features/options/model/stores/symbol-store'
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
  /** Lets tests drive the real pipeline over a fake transport. */
  webSocketFactory?: (url: string) => WebSocket
}

export function createMarketRuntime(options: MarketRuntimeOptions = {}) {
  const log = options.log ?? (() => undefined)

  const symbolStore = createSymbolStore()
  const lastTradeStore = createLastTradeStore()
  const feedStatusStore = createFeedStatusStore()
  const selectionStore = createSelectionStore()
  const viewportStore = createViewportStore()
  const knownSymbolsStore = createKnownSymbolsStore()

  let started = false
  let computeMode = options.riskComputeMode ?? readInitialComputeMode()

  const riskEngine = createRiskEngine({
    getRecord: (symbol) => symbolStore.get(symbol),
    getComputeMode: () => computeMode,
    onScore(symbol, score) {
      symbolStore.applyRiskScore(symbol, score)
      symbolStore.flushKey(symbol)
    },
  })

  const scheduler = createFrameScheduler({
    getVisibleKeys: () => viewportStore.getState().visible,
    onFlush(keys) {
      riskEngine.computeForKeys(keys, viewportStore.getState().visible)
      symbolStore.flushKeys(keys)
    },
  })

  const controller = createMarketController({
    symbolStore,
    lastTradeStore,
    feedStatusStore,
    selectionStore,
    knownSymbolsStore,
    scheduler,
  })

  const socket = createReconnectingSocket({
    onMessage: (message) => controller.handleMessage(message),
    onStatusChange: (status) => controller.updateTransportStatus(status),
    onResyncNeeded: () => {
      void resyncSnapshot()
    },
    webSocketFactory: options.webSocketFactory,
    log,
  })

  function applySnapshot(snapshots: OptionSnapshot[]) {
    controller.applySnapshot(snapshots)
    riskEngine.computeAllKnown(snapshots.map((row) => row.symbol))
    scheduler.flushNow()
  }

  async function resyncSnapshot() {
    if (!options.fetchSnapshot) return
    log('snapshot resync started')
    const snapshots = await options.fetchSnapshot()
    applySnapshot(snapshots)
    log('snapshot resync applied', { rows: snapshots.length })
  }

  return {
    stores: {
      symbol: symbolStore,
      lastTrade: lastTradeStore,
      feedStatus: feedStatusStore,
      selection: selectionStore,
      viewport: viewportStore,
      knownSymbols: knownSymbolsStore,
    },
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

    applySnapshot,
    resyncSnapshot,

    /**
     * Asks the server to narrow the feed. Deliberately does not write
     * `selection.intended`: that field has exactly one writer, the filter UI, and
     * `selection.confirmed` has exactly one writer, the `subscribed` ack.
     */
    requestSubscription(symbols: string[]) {
      socket.subscribe(symbols)
    },

    setViewportSymbols(symbols: string[]) {
      const current = viewportStore.getState().symbols
      if (
        current.length === symbols.length &&
        current.every((symbol, index) => symbol === symbols[index])
      ) {
        return
      }

      viewportStore.setState({
        symbols: [...symbols],
        visible: new Set(symbols),
      })
    },

    setRiskComputeMode(mode: RiskComputeMode) {
      computeMode = mode
    },
  }
}

export type MarketRuntime = ReturnType<typeof createMarketRuntime>
