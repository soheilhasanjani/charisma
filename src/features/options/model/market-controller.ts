import type { InboundMarketMessage } from '@/core/realtime/protocol'
import type { FeedTransportStatus } from '@/core/realtime/socket-client'
import type { FrameScheduler } from '@/core/scheduler/frame-scheduler'
import { reconcileSnapshotRow } from '@/features/options/model/snapshot-reconcile'
import type {
  FeedStatusStore,
  HistoryStore,
  LastTradeStore,
  SelectionStore,
} from '@/features/options/model/stores/live-stores'
import type { SymbolStore } from '@/features/options/model/stores/symbol-store'
import type { FeedStatusLabelKey } from '@/features/options/model/types'
import type { OptionSnapshot } from '@/features/options/types'

const LAST_TRADE_THROTTLE_MS = 750

export type MarketControllerDeps = {
  symbolStore: SymbolStore
  lastTradeStore: LastTradeStore
  historyStore: HistoryStore
  feedStatusStore: FeedStatusStore
  selectionStore: SelectionStore
  scheduler: FrameScheduler
  isSymbolTracked?: (symbol: string) => boolean
}

export function createMarketController(deps: MarketControllerDeps) {
  let lastTradePublishedAt = 0
  let knownSymbols: string[] = []

  function markSymbolDirty(symbol: string) {
    deps.scheduler.markDirty(symbol)
    deps.symbolStore.markDirty(symbol)
  }

  function deriveFeedLabelKey(
    transport: FeedTransportStatus,
    serverStatus: 'connected' | 'slow' | 'disconnected' | null,
  ): FeedStatusLabelKey {
    if (transport.lastCloseReason === 'offline') {
      return 'feed.offline'
    }
    if (transport.lastCloseReason === 'watchdog') {
      return 'feed.watchdog'
    }
    if (transport.awaitingManualRetry) {
      return 'feed.manualRetry'
    }
    if (transport.transport === 'connecting') {
      return 'feed.connecting'
    }
    if (transport.staleLevel === 'slow') {
      return 'feed.slow'
    }
    if (serverStatus === 'disconnected' && transport.transport === 'open') {
      return 'feed.serverDisconnected'
    }
    if (transport.transport === 'open') {
      return 'feed.connected'
    }
    return 'feed.disconnected'
  }

  function deriveAuthority(
    transport: FeedTransportStatus,
    serverStatus: 'connected' | 'slow' | 'disconnected' | null,
  ): 'transport' | 'server' | 'staleness' {
    if (transport.staleLevel === 'slow' || transport.staleLevel === 'dead') {
      return 'staleness'
    }
    if (serverStatus === 'disconnected' && transport.transport === 'open') {
      return 'server'
    }
    return 'transport'
  }

  function shouldTrackHistory(symbol: string) {
    return deps.isSymbolTracked?.(symbol) ?? false
  }

  return {
    handleMessage(message: InboundMarketMessage) {
      switch (message.type) {
        case 'ticker':
          deps.symbolStore.applyTicker(message.symbol, {
            last: message.last,
            bid: message.bid,
            ask: message.ask,
          })
          if (shouldTrackHistory(message.symbol)) {
            deps.historyStore.recordPrice(message.symbol, message.last)
            deps.historyStore.flushKey(message.symbol)
          }
          markSymbolDirty(message.symbol)
          break

        case 'greeks':
          deps.symbolStore.applyGreeks(message.symbol, message)
          markSymbolDirty(message.symbol)
          break

        case 'trade': {
          const receivedAt = Date.now()
          deps.symbolStore.upsert(message.symbol, (record) => ({
            ...record,
            lastTradeSide: message.side,
          }))
          markSymbolDirty(message.symbol)

          if (shouldTrackHistory(message.symbol)) {
            deps.historyStore.recordTrade(message.symbol, {
              price: message.price,
              size: message.size,
              side: message.side,
              time: message.time,
              receivedAt,
            })
            deps.historyStore.flushKey(message.symbol)
          }

          if (receivedAt - lastTradePublishedAt >= LAST_TRADE_THROTTLE_MS) {
            lastTradePublishedAt = receivedAt
            deps.lastTradeStore.set({
              symbol: message.symbol,
              price: message.price,
              size: message.size,
              side: message.side,
              time: message.time,
              receivedAt,
            })
            deps.lastTradeStore.flush()
          }
          break
        }

        case 'status':
          deps.feedStatusStore.update({
            serverStatus: message.status,
            labelKey: deriveFeedLabelKey(
              {
                transport: 'open',
                staleLevel: 'fresh',
                reconnectAttempt: 0,
                awaitingManualRetry: false,
                lastCloseReason: null,
                lastMessageAt: null,
                subscribedSymbols: [],
                confirmedSymbols: [],
              },
              message.status,
            ),
            authority: 'server',
          })
          deps.feedStatusStore.flush()
          break

        case 'subscribed':
          deps.selectionStore.set(message.symbols)
          deps.selectionStore.flush()
          break
      }
    },

    applySnapshot(snapshots: OptionSnapshot[]) {
      knownSymbols = snapshots.map((row) => row.symbol)

      for (const row of snapshots) {
        const current = deps.symbolStore.get(row.symbol)
        const next = reconcileSnapshotRow(current, row)
        deps.symbolStore.setRecord(row.symbol, next)
        markSymbolDirty(row.symbol)
      }
    },

    getKnownSymbols() {
      return knownSymbols
    },

    updateTransportStatus(transport: FeedTransportStatus) {
      const serverStatus = deps.feedStatusStore.getSnapshot().serverStatus
      deps.feedStatusStore.update({
        transport: transport.transport,
        staleLevel: transport.staleLevel,
        reconnectAttempt: transport.reconnectAttempt,
        awaitingManualRetry: transport.awaitingManualRetry,
        lastCloseReason: transport.lastCloseReason,
        authority: deriveAuthority(transport, serverStatus),
        labelKey: deriveFeedLabelKey(transport, serverStatus),
      })
      deps.feedStatusStore.flush()
    },
  }
}

export type MarketController = ReturnType<typeof createMarketController>
