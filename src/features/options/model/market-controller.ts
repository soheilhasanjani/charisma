/**
 * Translates decoded feed messages into store writes.
 *
 * The only place that knows how the wire protocol maps onto application state,
 * so a protocol change lands here and nowhere else.
 */

import type { InboundMarketMessage } from '@/core/realtime/protocol'
import type { FeedTransportStatus } from '@/core/realtime/socket-client'
import type { FrameScheduler } from '@/core/scheduler/frame-scheduler'
import { reconcileSnapshotRow } from '@/features/options/model/snapshot-reconcile'
import type {
  FeedStatusStore,
  KnownSymbolsStore,
  LastTradeStore,
  SelectionStore,
} from '@/features/options/model/stores/live-stores'
import type { SymbolStore } from '@/features/options/model/stores/symbol-store'
import type {
  FeedAuthority,
  FeedStatusLabelKey,
  ServerFeedStatus,
} from '@/features/options/model/types'
import type { OptionSnapshot } from '@/features/options/types'

const LAST_TRADE_THROTTLE_MS = 750

const INITIAL_TRANSPORT: FeedTransportStatus = {
  transport: 'idle',
  staleLevel: 'awaiting',
  reconnectAttempt: 0,
  awaitingManualRetry: false,
  lastCloseReason: null,
  lastMessageAt: null,
}

export type MarketControllerDeps = {
  symbolStore: SymbolStore
  lastTradeStore: LastTradeStore
  feedStatusStore: FeedStatusStore
  selectionStore: SelectionStore
  knownSymbolsStore: KnownSymbolsStore
  scheduler: FrameScheduler
}

export function createMarketController(deps: MarketControllerDeps) {
  let lastTradePublishedAt = 0

  /**
   * The real transport snapshot, kept so status derivation never has to invent
   * one. Deriving the label from a fabricated "healthy" transport silently
   * discards genuine offline, watchdog and manual-retry states.
   */
  let transportStatus: FeedTransportStatus = INITIAL_TRANSPORT

  /**
   * Writes already dirty the entity store via `set`. This only tells the
   * scheduler when to flush those keys.
   */
  function scheduleSymbol(symbol: string) {
    deps.scheduler.markDirty(symbol)
  }

  function deriveLabelKey(serverStatus: ServerFeedStatus): FeedStatusLabelKey {
    if (transportStatus.lastCloseReason === 'offline') {
      return 'feed.offline'
    }
    if (transportStatus.lastCloseReason === 'watchdog') {
      return 'feed.watchdog'
    }
    if (transportStatus.awaitingManualRetry) {
      return 'feed.manualRetry'
    }
    if (transportStatus.transport === 'connecting') {
      return 'feed.connecting'
    }
    if (
      transportStatus.transport === 'open' &&
      transportStatus.staleLevel === 'awaiting'
    ) {
      return 'feed.connecting'
    }
    if (transportStatus.staleLevel === 'slow') {
      return 'feed.slow'
    }
    if (transportStatus.staleLevel === 'dead') {
      return 'feed.disconnected'
    }
    if (transportStatus.transport === 'open') {
      if (serverStatus === 'slow') {
        return 'feed.slow'
      }
      // The mock (and a wedged gateway) can send `disconnected` while it is
      // still pushing tickers and trades. Do not show قطع in that case.
      return 'feed.connected'
    }
    return 'feed.disconnected'
  }

  function deriveAuthority(serverStatus: ServerFeedStatus): FeedAuthority {
    if (
      transportStatus.staleLevel === 'slow' ||
      transportStatus.staleLevel === 'dead'
    ) {
      return 'staleness'
    }
    if (
      transportStatus.transport === 'open' &&
      (serverStatus === 'slow' || serverStatus === 'connected')
    ) {
      return 'server'
    }
    return 'transport'
  }

  function publishFeedStatus() {
    const serverStatus = deps.feedStatusStore.getState().serverStatus

    deps.feedStatusStore.setState({
      transport: transportStatus.transport,
      staleLevel: transportStatus.staleLevel,
      reconnectAttempt: transportStatus.reconnectAttempt,
      awaitingManualRetry: transportStatus.awaitingManualRetry,
      lastCloseReason: transportStatus.lastCloseReason,
      authority: deriveAuthority(serverStatus),
      labelKey: deriveLabelKey(serverStatus),
    })
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
          scheduleSymbol(message.symbol)
          break

        case 'greeks':
          deps.symbolStore.applyGreeks(message.symbol, message)
          scheduleSymbol(message.symbol)
          break

        case 'trade': {
          const receivedAt = Date.now()

          if (receivedAt - lastTradePublishedAt >= LAST_TRADE_THROTTLE_MS) {
            lastTradePublishedAt = receivedAt
            deps.lastTradeStore.setState({
              trade: {
                symbol: message.symbol,
                price: message.price,
                size: message.size,
                side: message.side,
                time: message.time,
                receivedAt,
              },
            })
          }
          break
        }

        case 'status':
          deps.feedStatusStore.setState({
            serverStatus: message.status,
            serverStatusAt: Date.now(),
          })
          publishFeedStatus()
          break

        case 'subscribed':
          // The ack records what the server confirmed; it must never overwrite
          // what the user asked for.
          deps.selectionStore.setState({ confirmed: message.symbols })
          break
      }
    },

    applySnapshot(snapshots: OptionSnapshot[]) {
      for (const row of snapshots) {
        const current = deps.symbolStore.get(row.symbol)
        const next = reconcileSnapshotRow(current, row)
        deps.symbolStore.setRecord(row.symbol, next)
        scheduleSymbol(row.symbol)
      }

      deps.knownSymbolsStore.setState({
        symbols: snapshots.map((row) => row.symbol),
      })
    },

    getKnownSymbols() {
      return deps.knownSymbolsStore.getState().symbols
    },

    updateTransportStatus(next: FeedTransportStatus) {
      transportStatus = next
      publishFeedStatus()
    },
  }
}

export type MarketController = ReturnType<typeof createMarketController>
